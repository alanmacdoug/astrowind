---
draft: false
title: "The Pre-Send Checklist: Ten Things to Verify Before You Hit Send"
excerpt: >-
  A quick, systematic check before any campaign launch catches the
  mistakes that later show up as spam complaints and reputation damage.
author: Alan MacDougall
publishDate: 2026-09-14
categories:
  - Deliverability
tags:
  - Best Practice
  - Campaign Setup
---

The difference between a clean send and a damaged reputation is often
one overlooked detail that nobody noticed until after the fact. An
authentication record that was half-configured. A sending volume spike
that exceeded your ISP thresholds. A subject line that triggered
filters on the first batch and never got reviewed before the rest went
out.

These failures are not mysterious. They repeat with predictable
regularity, and they can be caught before anyone touches the send
button.

Below is a ten-item pre-send checklist that covers the common failure
points. Each item is verifiable without guesswork, and most take less
than five minutes to complete.

## 1. Authentication records current and valid

SPF, DKIM and DMARC should not only exist; they should be actively
valid. Authentication rot is real — DKIM keys expire, DNS changes from
infrastructure migrations orphan old records, DMARC policies get
published and forgotten. [Verify all three](/email-authentication-basics) on the sending domain before
any campaign, especially if the last send was months ago.

## 2. DNS lookups under the SPF limit

SPF evaluation fails if resolving your record requires more than ten
DNS lookups. That limit includes every nested `include:` from marketing
platforms, CRMs and third-party services. Audit your SPF regularly —
every new integration adds lookups, and the sum eventually breaks
things.

## 3. Sending reputation warm-up respected

Cold domains or dormant ones need gradual volume increases. Overnighting
a large send from a fresh or inactive domain is a fast route to spam.
ISP thresholds vary, but the principle is universal: ramp up, monitor,
then increase.

## 4. Unsubscribe mechanism working and visible

RFC 8058 requires one-click unsubscribe for bulk mail, and major
mailbox providers enforce it. Test the link yourself — not just once,
but from different clients and on different days. Broken unsubscribe
mechanisms turn manageable complaints into permanent reputation hits.

## 5. List hygiene applied recently

Bounced addresses, spam traps and long-inactive subscribers degrade
sending performance. Hard bounces should be removed immediately.
Inactive subscribers (no opens for six months) warrant a re-engagement
campaign or removal. Clean lists do not just improve metrics — they
protect reputation.

## 6. Content triggers avoided

Certain phrases, formatting and attachment types trigger spam filters.
Excessive punctuation (!!), ALL CAPS subject lines, misleading sender
names, embedded images without text — these remain problematic even in
2026. If the content feels aggressive, filters will too.

## 7. Links and tracking domains resolve correctly

Every link in the email should resolve, and tracking domains should
have proper authentication. Dead links frustrate recipients and reduce
engagement signals, which ISPs use as a positive ranking factor.

## 8. Sending IP and domain reputation checked

If you use a dedicated IP, verify its reputation is healthy. Shared IPs
can inherit problems from other tenants. Both domain and IP reputation
should be assessed before significant volume sends.

## 9. Test send across major clients

Send a test message to accounts at Gmail, Outlook, Yahoo and any other
important destination for your audience. Check rendering, spam folder
placement and authentication results. Do not rely on your own email
client alone.

## 10. Monitoring tools active and alerting

Ensure you have systems to track open rates, bounce rates and spam
complaints in real time. Sudden spikes indicate problems that require
immediate attention. Setting alerts means catching issues while there
is still time to adjust.

## The cost of skipping this

One overlooked mistake does not destroy a sending reputation overnight.
But repeated shortcuts accumulate: a bounced list that grows unchecked,
authentication drift that goes unnoticed, a spam complaint rate that
slowly climbs. The fix becomes harder the longer you wait.

Running a pre-send checklist before every campaign is not overhead. It
is the cheapest insurance you can buy against deliverability problems.

## Use the automated checklist

The preflight checklist below walks through each of these items with
brief explanations and three-state verdicts. Run it before any
significant send and save the output as your campaign audit trail.

[Run the pre-flight checklist →](/tools/preflight-checklist)

Keep it simple. Run it consistently. The inbox rewards patience and
punishes shortcuts, usually without giving you much warning either way.
