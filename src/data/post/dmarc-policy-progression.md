---
draft: false
title: "Moving From DMARC none to reject, Safely"
excerpt: >-
  The staged path from monitoring to enforcement that locks out
  spoofers without locking out your own invoices.
author: Alan MacDougall
publishDate: 2026-09-15
categories:
  - Email Authentication
tags:
  - DMARC
  - Deliverability
---

DMARC is the only one of the three authentication systems with teeth. SPF lists servers. DKIM signs messages. DMARC decides what happens to mail that fails both, and that decision is a dial, not a switch.

The dial has three settings, and the businesses that struggle with DMARC almost always struggle for the same reason: they turned the dial too far, too fast, and burned their own legitimate mail in the process. This is the guide to moving it deliberately.

## The three policies

A DMARC record's `p=` tag tells receiving servers what to do with mail from your domain that fails both SPF and DKIM alignment:

**`p=none`** means monitor. Take no action against failing mail, but send daily aggregate reports to the address in your `rua=` tag. This is observation, not enforcement, and it is the correct starting point for every domain, without exception.

**`p=quarantine`** means deliver failing mail to spam, with a tunable percentage (`pct=`). At `pct=25`, a quarter of failing mail is quarantined; the rest sails through untouched.

**`p=reject`** bins failing mail outright. Again percentage-tunable, though at this stage most domains drop the training wheels.

The progression exists because DMARC's job is protecting you from forgery, and forging you is what fraudsters do with mail you *never* sent. But the same mechanism that rejects a criminal's impersonation also rejects your own mail when your own authentication is broken. Policy strength is only safe once your legitimate senders all pass.

## The stage before the dial

Before any policy movement, a prerequisite that shortens the whole journey: every legitimate sender must be authenticated. The mail server, the marketing platform, the invoicing system, the helpdesk, the notifications from that internal tool nobody remembers commissioning. All of them sending authenticated, aligned mail.

The aggregate reports are how you know. They list every source sending as your domain, legitimate or not, and the authentication result of each. The methodology is unglamorous. Read the reports, identify every legitimate source, fix each one until nothing legitimate fails, then move the dial.

Skip that reading step and enforcement becomes a gamble on your own mail. Organisations that jump straight to `p=reject` are the ones who discover, via angry customers, that their invoices were being binned for a fortnight.

## The deliberate progression

**Stage one: publish at `p=none` with `rua=` set.** Collect reports for two to four weeks minimum. Fix everything legitimate that fails. This stage costs nothing and risks nothing.

**Stage two: `p=quarantine`, `pct=25`.** Watch the reports for a week. Failing mail from unknown sources starts landing in spam folders. If nothing legitimate appears in the failure list, double the percentage. Then double again, to 100.

**Stage three: `p=quarantine` at 100%.** A full dry run of rejection. Reports confirm total legitimate passage. Stay here until the reports are boring: the same senders, passing, week after week.

**Stage four: `p=reject`.** The spoofers are now being dropped entirely. Keep the reports flowing. The work is not over, it is ongoing, because new tools get connected, senders drift, and the record needs re-reading whenever the infrastructure changes.

Total elapsed time for a moderately complex domain: six to twelve weeks. Faster is possible. Faster is also where the burned invoices come from.

## Alignment, and the dormant domains

Two corners of DMARC practice worth knowing:

**Alignment matters more than passing.** A message can pass SPF and DKIM individually and still fail DMARC if neither authenticated domain aligns with the visible From domain. Forwarded mail, third-party senders and careless setups produce alignment failures constantly. This is explained in more depth in the authentication basics guide, and it is the single most common misreading of an aggregate report.

**Dormant domains still need records.** Every domain you own that sends no mail should publish `v=DMARC1; p=reject; rua=...`. An unused domain with no policy is a free forgery kit for whoever cares to impersonate you, and you receive the reports proving it happened.

## Watch your own progression

The [DMARC report viewer](/tools/dmarc-report-viewer) parses your aggregate reports in-browser, giving plain-English verdicts per source; the same reading discipline this guide prescribes, minus the XML archaeology. Bring the reports to any policy change and read what the dials are about to affect.

[Check your current DMARC policy](/tools/auth-checker)

Enforcement is not a setting you publish; it is a journey your reports must clear first. Turn the dial only as fast as your own mail has earned.
