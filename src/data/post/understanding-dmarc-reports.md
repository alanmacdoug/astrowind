---
draft: false
title: "Understanding Your DMARC Reports: What Those Daily Emails Actually Mean"
excerpt: >-
  DMARC aggregate reports are the most underrated deliverability
  diagnostic you have. Here is how to read them without wading through
  raw XML.
author: Alan MacDougall
publishDate: 2026-09-14
categories:
  - Email Authentication
tags:
  - DMARC
  - Deliverability
---

If you publish a DMARC record — even a permissive `p=none` one — the
major mailbox providers start sending you daily XML reports about every
message that claims to come from your domain. Most businesses never read
them. The XML is dense, ugly and about as welcoming as a stack of
invoices.

Which is a shame, because buried inside those reports is the clearest
picture you will ever get of who is sending email as you, whether your
legitimate mail is passing authentication, and where your reputation is
quietly bleeding.

## What is in an aggregate report

A DMARC aggregate report (the technical name is RUA, "reporting
aggregate") lists, per message or grouped batches:

- **The sending IP address** — where the message actually originated
- **The results of SPF and DKIM checks** — pass or fail, for each
- **The alignment results** — whether the authenticated domains match
  your From domain
- **The From domain and envelope details** — what the recipient saw
- **Message counts** — how much mail this source sent

Notice what is *not* in there: message content, subject lines or
recipient addresses. Aggregate reports are metadata only, which is also
why they can be shared with a third-party processor without exposing
anything sensitive.

## The four findings that matter

Read enough of these reports and the same patterns repeat.

### 1. Legitimate mail that is failing

Your own CRM, invoicing system or marketing platform sends mail that
fails SPF or DKIM — usually because someone connected a tool without
adding its DNS records. Every failed message from a legitimate source
is a deliverability problem you can actually fix.

### 2. Senders you forgot about

An old ESP you migrated away from, a department running a mailing list
on a dusty server, a SaaS tool sending notifications under your domain.
DMARC reports surface all of it. Before you tighten your policy, every
one of these needs to be identified and either fixed or decommissioned.

### 3. Pure spoofing

Sources you do not recognise, sending volume you cannot explain. This
is impersonation — and the reason DMARC exists. At `p=none` you merely
observe it; at `p=quarantine` or `p=reject`, receiving providers act on
it.

### 4. Alignment failures

The subtle one. A message can pass SPF and pass DKIM and still fail
DMARC, because neither authenticated domain aligns with the domain in
the From address. This happens constantly with forwarded mail,
third-party senders and careless setups, and it is invisible without
reading reports.

## The workflow, start to finish

The intended sequence looks like this:

1. Publish DMARC at `p=none` and collect reports
2. Read the reports; identify every legitimate sender
3. Fix authentication for each one until clean reports come back
4. Move to `p=quarantine`, watch again
5. Move to `p=reject` once nothing legitimate is caught

Businesses that skip the reading step and jump straight to `p=reject`
are the ones who lock their own invoices out of customer inboxes. The
reports exist precisely so you do not have to guess.

## Why nobody actually does this

Because the raw files arrive as gzipped XML attachments with names like
`example.com!101293840182!5739.json.gz`, and opening one in a text
editor rewards you with a wall of namespace declarations. The industry's
answer is usually to pay a vendor to parse them for you.

That works, but you can also just parse them yourself — and for
independent verification, it is worth knowing what your data looks like
before it reaches anyone else's dashboard.

## Read your own reports

Paste an aggregate report file into the tool below and it parses the
XML directly in your browser — plain-English verdicts per source,
pass/fail breakdowns, and alignment results. Nothing is uploaded; the
file never leaves your machine.

[View your DMARC reports →](/dmarc-report-viewer)

One honest caveat: a single day's report is a snapshot. The value is in
the trend — the same senders appearing week after week, failures that
never get fixed. Bring the reports back once a month and read the
patterns, not just the incidents.
