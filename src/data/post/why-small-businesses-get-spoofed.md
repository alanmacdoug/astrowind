---
publishDate: 2026-09-16
title: "Why Small Firms Get Spoofed: BEC in Plain English"
excerpt: "Scammers do not need to break into your systems to steal from your customers and suppliers. They can send email as you instead. Here is how spoofing works and how DMARC shuts it down."
category: Deliverability
tags: [spoofing, bec, dmarc, business-email-compromise]
author: Alan MacDougall
draft: false
---

Most people imagine email fraud as something technically elaborate: a hacker in your systems, a cracked password, malware on a server.

The uncomfortable truth is that the most profitable kind of email fraud usually needs none of that. The criminal sends email **as you**: from your domain, with your name, to your customers, suppliers and staff, without ever touching a single thing you own.

This is spoofing, and in its commercial form it is called business email compromise (BEC). It targets organisations of every size, but small businesses are disproportionately attractive victims, for reasons worth understanding before they cost you.

## How spoofing actually works

Nothing about email's original design verifies that the sender is who they claim to be. The "From" address on an email is, at base, text typed by whoever composed the message.

Receiving systems now apply various checks, SPF, DKIM and DMARC, to test whether a message really came from where it says it did. But if your domain has no protection published, or protection configured loosely, the spoofer's message faces no such obstacle. Your customers' mail server receives a message that looks exactly like it came from you. It has your domain in the From line. Their software may display your real company name, pulled from directories that associate your domain with your brand.

The criminal didn't need your password. They needed your *identity*, and email identities without DMARC are taken freely.

## Why small businesses are attractive targets

There is a comfortable myth that scammers chase big fish and ignore everyone else. In practice, small businesses offer a better effort-to-reward ratio:

- **Large brands almost always publish DMARC.** Banks, retailers, airlines: spoofing them is hard because their domains are defended. Your domain, published this year with no DMARC record, is the unlocked car in a street of alarmed ones.
- **Smaller supplier networks have softer procedures.** An invoice-redirection email works when the recipient is used to paying invoices from you without secondary verification. Big firms have payment-verification gates; small firms often have Karen, who trusts the domain.
- **Nobody is watching your DNS.** A large company has security staff alerted to spoofing patterns. A five-person business has nobody whose job includes noticing that emails are going out as them.

The result is a simple selection effect: spoofers follow the path of least resistance, and the path of least resistance leads through undefended domains, which are disproportionately small ones.

## The scams, briefly

Spoofing enables several distinct cons, all of them sharing the same technical root:

- **Invoice redirection.** Your supplier receives an email "from you" saying bank details have changed, along with an attached invoice for goods you genuinely ordered. They pay the criminal. Weeks later, you're both chasing a real invoice nobody paid.
- **CEO fraud.** Staff receive an email that appears to come from a director, urgent, confidential, requesting a payment or sensitive data. The request plays on hierarchy and time pressure precisely because it cannot survive scrutiny.
- **Customer impersonation.** Your customers get "offers" or "account warnings" from your domain. Whatever they lose, your brand pays for it, and they remember whose name was on the email.
- **Thread hijacking.** Instead of starting a new conversation, the criminal inserts themselves into a real one, replying as you in an existing exchange with real context. Far harder to spot, and far more convincing.

None of these depend on a weak password. All of them collapse if email claiming to be from your domain can be authenticated or rejected.

## The defence: DMARC, published properly

The technical fix for spoofing is DMARC, a DNS record that tells receiving systems what to do with email that claims to be from your domain but fails authentication.

DMARC works in stages:

1. **Monitor (p=none):** the record instructs receiving systems to accept unauthenticated mail but report it to you. You receive aggregate reports showing who is sending email as your domain, legitimate platforms and impostors alike. This is reconnaissance; you cannot fix what you cannot see.
2. **Quarantine:** unauthenticated mail is routed to spam. The spoof still sends, but it lands nowhere your customers will read it.
3. **Reject:** unauthenticated mail is refused outright. Impostor email from your domain simply stops arriving. This is where spoofing ends, not mitigated but ended.

The reason the staged approach exists is the same reason you cannot skip step one: businesses almost always send email from more places than they think. The CRM, the billing platform, the ticketing system, the freelancer's tool. Publishing enforcement before you know your legitimate senders blocks your own mail along with the criminals'. Monitoring first, enforcement second, is not caution for its own sake. It is the only sequence that works.

## Where to start

If you manage your own DNS, the sequence is straightforward:

1. **Check what protection you already have.** The [email authentication checker](/tools/auth-checker) inspects your domain's SPF, DKIM and DMARC records and interprets them in plain English. Undefended domains are found here, in minutes.
2. **Publish DMARC at p=none** and receive the reports. The [DMARC report viewer](/tools/dmarc-report-viewer) turns the XML attachments providers send you into readable form: who is sending as you, and whether it authenticates.
3. **Reconcile your senders**, then step the policy toward quarantine and reject.

If reading DNS records and reconciling senders sounds like a job rather than an afternoon, that is because it usually is, and that is fine. A [DMARC record read](/contact) is a flat-fee service that starts with your existing records and reports, and tells you exactly where you stand and what the safe next step is: fixed price, no further obligation.

## The uncomfortable summary

Your email address, your domain, your name, the identity customers trust, is currently usable by anyone on the internet, unless you have deliberately made it otherwise.

Business email compromise exists because spoofing is free where DMARC is absent. The defence is established, standard, and cheaper than a single successful invoice-redirection against one of your suppliers.

Start by finding out where you stand. [Check your domain's authentication records](/tools/auth-checker). The result, one way or the other, is better than not knowing.

*This post is part of a series on email authentication. For the foundations, see [SPF, DKIM and DMARC explained](/email-authentication-basics); for the safe path from monitoring to enforcement, see [DMARC policy progression](/dmarc-policy-progression).*
