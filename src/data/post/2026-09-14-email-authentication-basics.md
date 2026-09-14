---
draft: true
title: "Email Authentication Basics: SPF, DKIM and DMARC Without the Jargon"
excerpt: >-
  What SPF, DKIM and DMARC actually do, why the major inbox providers
  made them mandatory, and how to check your own domain in seconds.
author: Alan MacDougall
publishDate: 2026-09-14
categories:
  - Email Authentication
tags:
  - SPF
  - DKIM
  - DMARC
---

If your email keeps going to spam, authentication is the first thing to
rule out. It is not the only factor that affects deliverability, but it
is the cheapest to verify and the fastest to fix — and since the major
inbox providers made proper authentication effectively mandatory, a
domain without it starts every send with a handicap.

Here is what the three systems actually do, stripped of the jargon most
documentation wraps them in.

## SPF: the guest list

SPF (Sender Policy Framework) is a DNS record that lists the mail
servers allowed to send email on behalf of your domain. Think of it as a
guest list handed to the venue: when an email arrives, the receiving
server checks whether the server that sent it is on your list.

The most common failure I see in the field is not a missing SPF record —
it is an over-stuffed one. Marketing platforms, CRMs, invoicing tools
and helpdesk systems each add their own `include:` statement, and
eventually the record exceeds the ten-DNS-lookup limit that receiving
servers enforce. Once that limit is hit, SPF stops evaluating for
everything, including mail that was perfectly legitimate. More than one
business has damaged its sending reputation by "fixing" deliverability
with yet another include.

Rule of thumb: one SPF record per domain, and audit it whenever you
connect a new tool that sends mail.

## DKIM: the wax seal

DKIM (DomainKeys Identified Mail) adds a cryptographic signature to
outgoing mail. The sending server signs each message with a private key;
the matching public key is published in your DNS. The receiving server
verifies the signature, which proves the message was not tampered with
in transit and identifies which domain took responsibility for it.

The practical problems with DKIM are almost always setup-related:

1. **It was never configured.** Plenty of platforms ship with SPF
   enabled but DKIM left off unless you switch it on.
2. **The DNS records were half-entered.** A missing or malformed CNAME
   on the selector means the signature can never verify.
3. **Nobody knows which selectors exist.** DKIM records live at
   addresses like `selector._domainkey.example.com`, and without knowing
   your selector, checking by hand is guesswork.

Note the caveat: an absent selector does not prove a domain lacks DKIM —
but if none of the common selectors resolve, further investigation is
warranted.

## DMARC: the policy

DMARC (Domain-based Message Authentication, Reporting and Conformance)
ties SPF and DKIM together and adds a policy: what should a receiving
server do if a message claiming to be from your domain fails both
checks?

Two parts matter to most senders:

1. **The policy itself** (`p=none`, `p=quarantine`, `p=reject`). Most
   domains should start at `p=none`, which monitors without blocking,
   then tighten gradually. Jumping straight to `p=reject` before you
   know what legitimate mail your organisation sends is how companies
   lock out their own invoices.
2. **Aggregate reports.** At `p=none`, mailbox providers send daily XML
   reports listing every message that claimed to be from your domain and
   whether it passed. This is the single most underrated deliverability
   diagnostic available — and almost nobody reads them, because parsing
   raw XML is miserable.

Alignment is where the subtleties live: a message can pass SPF and DKIM
individually and still fail DMARC if the domains involved do not align.
Worth understanding before acting on a failing report.

## Why this became non-negotiable

For years, authentication was best practice. Then the large mailbox
providers set minimum requirements for bulk senders: SPF and DKIM for
your domain, and a DMARC record on every domain you send from —
including the ones you think are dormant. An unused domain without
DMARC is a free forgery kit for whoever cares to impersonate you.

## Check your own domain

None of this requires specialist knowledge to verify. Enter your domain
into the tool below and it pulls your public DNS records, walks your SPF
includes to check the lookup count, probes the common DKIM selectors,
and reads your DMARC policy — entirely in your browser, with nothing
sent or stored anywhere.

[Check your email authentication →](/tools)

If the results surprise you, they are worth understanding before you
act. A misconfigured fix is often worse than a known gap — and knowing
exactly what is missing is the cheap part.
