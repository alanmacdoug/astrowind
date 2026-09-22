---
publishDate: 2026-09-16
title: "SPF Generator: Building a Record One Answer at a Time"
excerpt: "A guided tour of the SPF record generator, how the questions map to senders, why the lookup counter matters, and what to do with the record once it is built."
category: Tools
tags: [spf, dns, tools, email-authentication]
author: Alan MacDougall
draft: false
---

Most SPF generators work like a shopping basket: tick the services you use, and a record falls out the bottom. That is convenient, and it is also how most SPF records end up quietly broken, assembled from a checklist of brands rather than from a picture of what actually sends mail as your domain.

This walkthrough explains how the SPF generator on this site is built differently, and how to get the most out of it. If you have not read the companion piece on [how SPF records actually work](/spf-record-deep-dive), that is the place to start. This post assumes you know what an include mechanism is and why the ten-lookup limit exists.

## What the generator does

The tool walks you through a series of questions about your sending setup. Each answer confirms a sender, such as Google Workspace, Microsoft 365, a marketing platform, or custom servers, and adds the matching mechanism to your record. As you go, two things accumulate: the record itself, and the lookup budget it consumes.

The record assembles at the bottom of the page as you answer. Nothing is sent anywhere and nothing is stored; the tool runs entirely in your browser.

## The questions, and why they are in that order

The question flow follows the structure most small businesses actually have, rather than an exhaustive taxonomy of every mail platform on earth.

**Does Google Workspace send email as your domain?** The most common sender, and the largest single consumer of SPF budget. The `include:_spf.google.com` mechanism pulls in a nested chain of lookups, and that chain occasionally grows when Google adjusts their infrastructure. Your record does not care what your budget intentions were; it cares what the includes resolve to on the day a receiver evaluates it.

**Does Microsoft 365 send email as your domain?** Similar mechanics, similar appetite. Note that Microsoft's include lives under `spf.protection.outlook.com`, and it is tenant-specific in effect even though the include string is shared, because Microsoft's servers handle the tenant matching during evaluation.

**Does a marketing platform send email as your domain?** Mailchimp, Klaviyo, ActiveCampaign, Brevo, and friends. This is where records tend to bloat: each ESP adds its own include, some add several, and none of them warn you about the accumulated total. The generator's dropdown covers the common platforms and allows a custom entry for the rest.

**Do you have custom servers sending as your domain?** For most readers, no. If yes, this is the only place raw IP addresses belong in your record, via `ip4` or `ip6` mechanisms, entered deliberately and as few as you can manage.

**Are there any other services?** The catch-all, and deliberately last. Order receipts from your invoicing software, website contact forms, CRM notifications: the senders nobody remembers until the record is already published. A common pattern this question catches is a business that authenticates its newsletter and its staff mail, forgets the booking system, and then wonders why booking confirmations are the one message type landing in spam.

## Watching the lookup budget

The counter showing your current SPF budget consumption is the point of the whole exercise. Ten lookups is the hard ceiling. It is not a guideline or a best practice, it is a limit defined in RFC 7208, and once your record exceeds it, evaluation stops. A receiver checking your SPF simply fails to reach a verdict: your valid mail loses the pass signal, along with every other signal that alignment depends on.

Practically, this means budget is a resource you spend. Google Workspace costs a handful of lookups. Microsoft 365 costs a few more. Add two ESPs and you can be at nine without a single custom server in sight. The generator's counter is there so you notice the spending as it happens, not after publication.

If your honest answers put you over ten, the record cannot be fixed by cleverness. The standard solutions are consolidating senders (fewer platforms sending as the domain) or moving some senders onto their own subdomain with its own SPF. Both are covered at the end of the deep-dive post.

## Choosing the closing mechanism

The final question is what your record ends with: `-all` (hard fail), `~all` (soft fail), or `?all` (no opinion).

The honest answer for a first record is usually `~all`. It tells receivers "these are my legitimate senders; anything else is probably not mine, but I am not asking you to punish it yet", which is the correct posture while you are still discovering forgotten senders through soft-fail diagnostics. Moving to `-all` is a graduation, not a starting point, and it should happen after you have evidence that everything you care about passes. `?all` exists in the list because it is technically valid and some setups need it, but as a deliberate choice it is rarely what anyone wants.

If you have read the [DMARC policy progression piece](/dmarc-policy-progression), you will recognise the shape of this argument: monitoring before enforcement, always. SPF's closing mechanism and DMARC's policy tag are two dials governing the same principle. Do not lock the door until you know who is supposed to come through it.

## Publishing the record

Once the generator hands you a record, it needs to go into DNS as a TXT record on your domain, published at the apex (the bare domain, not a subdomain). A few practical notes:

- **One SPF record per domain.** If a TXT record already exists starting `v=spf1`, you edit it; you do not add a second. Two SPF records means neither is evaluated, and receivers are required to treat the situation as an error.
- **The tool does not modify DNS.** By design. It builds the string; you paste it into your registrar or DNS host, where you can see exactly what changed. Publishers who automate DNS edits on your behalf are doing the same thing, faster and less visibly.
- **Verify after publishing.** DNS propagation is usually minutes with modern hosts, but verify rather than assume. The [email authentication checker](/tools) will show your published record and interpret it the way a receiver does, including the lookup count as it resolves live, which may differ slightly from the generator's estimate if a provider has changed their include chain.

## When the generator is not the right tool

Honest boundaries. The generator is built for the common case: a small business with a handful of known senders assembling a first sensible record. It is less suited to untangling an existing record you inherited, with flattened includes, nested redirects, and third-party senders nobody remembers commissioning. That is an audit-shaped problem, not a wizard-shaped one.

If you already run a correct record and a new sender pushes you over budget, the generator will show you the collision. But the resolution is a design decision about which senders deserve the apex domain, and that decision benefits from someone who has made it before.

## Where this fits

The generator answers one question well: *what should my SPF record be?* It deliberately does not answer *what is my SPF record actually doing?*, which is the authentication checker's job, nor *what is happening to mail that fails?*, which is DMARC's territory, covered in the [DMARC reports explainer](/understanding-dmarc-reports).

Run the three against your domain in that order and you have the complete picture: what you intend, what is published, and what receivers actually see.
