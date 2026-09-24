---
publishDate: 2026-09-16
title: "The DMARC Report Reading Checklist: What to Look At First"
excerpt: "Aggregate reports arrive as unreadable XML. This is a guide to parsing and understanding those files. The fields that matter and the ones to ignore, plus, what each finding means strategically."
category: Deliverability
tags: [dmarc, reports, email-authentication, dns]
author: Alan MacDougall
draft: false
---

Every domain with a DMARC record and a `rua=` address receives aggregate reports, usually daily, from Gmail, Outlook, Yahoo and other mailbox providers. Almost nobody reads them though. Not because the information is worthless - in fact, it is the single most detailed view of exactly who is sending mail as your domain. The problem is that the reports arrive as compressed XML attachments with header names like `auth_results` and `disposition`. Most small businesses just don't have the bandwidth.

If you have read [the guide on what these reports actually are](/understanding-dmarc-reports), you already know the terminology. This post is the practical counterpart. Run the following checks, in sequence, and you will extract ninety percent of the actionable value from any aggregate report in a few minutes.

## Before you start

A quick orientation that shapes everything below. DMARC aggregate reports show mail that **passes alignment** (sent by senders you have authorised) and mail that **fails it** (everything else). The failing traffic divides again into harmless noise and real problems. The order below is designed to get you to the real problems fastest, which means some checks are deliberately skimmed rather than studied.

## 1. Find the totals first

Every report is anchored by two numbers: how many messages were evaluated, and what proportion passed DMARC.

Read these before anything else, because they set the scale. The pass rate is your headline indicator. If 95 percent of your traffic passes, you are reading reports to fine-tune authentication and delivery. If 40 percent passes, you are reading them to find out what is broken, and the rest of this checklist becomes urgent instead of routine.

A healthy domain with correctly configured authentication records typically shows near-total passing once legitimate senders are aligned. Widespread failure on your own legitimate mail means a configuration problem, not spoofing. Skip to check 4.

## 2. Group by sender, not by message

Reports list each source IP, but you should not be reading them individually. Group the results by the reported sending domain (`header.from` combined with the reverse-DNS of the source). This collapses potentially thousands of rows into a handful of senders with volumes and pass rates attached.

For each sender, one question: **is this mine, and should it be?**

Three answers are possible, and they drive everything else:

- **Mine and legitimate**: your ESP, your mail server. This traffic should pass. If it fails, that is a misalignment to fix on your side.
- **Not mine and not pretending to be**: largely, your own domain appearing in others' reports, or direct-to-spam scans. Harmless, constant, ignorable.
- **Not mine, appearing to be me**: spoofing, or a sender you forgot you authorised. This is what DMARC exists to catch, and it is where the remaining checks concentrate.

## 3. Look at the failure detail for your legitimate senders

For your own senders that fail, the report shows *why*: the individual SPF and DKIM results. This distinction matters because DMARC passes if either mechanism aligns. A message can fail SPF and still pass DMARC via DKIM, and vice versa.

The common failure patterns:

- **SPF fails on forwarded mail**. Normal, and largely unavoidable. Forwarding breaks SPF by design. If the mail passes via DKIM, nothing is wrong.
- **DKIM fails with `d=` showing your ESP's domain instead of yours**. Your ESP is signing with its own domain, which does not align. Fixable in the platform settings, usually.
- **Both fail on everything from one sender**. That sender was never authorised properly. It needs SPF includes, DKIM setup, or removal from your sending architecture.

## 4. Check the disposition column

Each message row records what the receiver actually did with it: delivered, quarantined, or rejected. Under a `p=none` policy, everything is delivered regardless of outcome, which is why `p=none` is called monitoring. Under `p=quarantine` or `p=reject`, the failures start getting filtered.

If you are on `p=none`, this column tells you what *would* have happened under enforcement; almost like a dress rehearsal for [policy progression](/dmarc-policy-progression). If you are enforcing, this column tells you whether legitimate mail is being caught in the net, which is the one failure mode that costs revenue directly.

## 5. Scan the sending sources for the unfamiliar

Spoofing traffic shows up as small volumes from IPs with no relationship to you, sending mail with your domain in the `From` header. Look for two patterns specifically:

- **Persistent low-volume spoofing**: a few messages a day from the same sources. Common, mostly phishing-related, exactly what enforcement policy exists to suppress.
- **Bursts**: sudden spikes in volume from unknown sources. Occasionally a compromise, more commonly a spam campaign using your domain. The volume trend across successive reports is more informative than any single day's snapshot.

Note that some spoofed traffic will pass SPF anyway. This is because spammers sometimes publish their own SPF records for domains they control that reference your domain in the return-path. The alignment check is what catches this. SPF pass alone is not a safety signal.

## 6. Compare against the previous period

Single reports are snapshots; the value compounds across weeks. Two trends matter. Total volume, where a rising baseline of legitimate traffic is normal growth but a rising baseline of failures is an emerging problem. And the sender list, where a new legitimate sender appearing means something in your business started sending mail (invoicing platform, new CRM) and needs authorising before anything enforces against it.

## What not to do

Two mistakes are worth highlighting here because they consume most of the time people waste on these reports.

**Do not chase every failing source.** A domain that has existed for any length of time collects a permanent background hum of failed evaluations: scans, bounce probes, opportunistic spoofing at trivial volume. If a source sends five messages a week and fails, it is noise. Policy enforcement suppresses it without your attention. Attention goes to volume, persistence and burst patterns.

**Do not act on a single report.** Daily reports can vary for multiple reasons. Decisions about authorising senders or progressing policy belong to the weekly picture, minimum.

## Doing this faster

Everything above is a manual reading of a machine-readable file. The [DMARC report viewer](/tools/dmarc-report-viewer) takes the raw XML attachment and returns the grouped, interpreted picture: senders, volumes, pass rates, and the plain-English meaning of each. The judgement calls in this checklist still apply, from grouping to prioritising to deciding what is yours, but the XML stops being the obstacle.

If you need some help in applying the interpretation and the judgement, please contact me to discuss a written assessment of your reports, your senders, and what your next policy step should be. Either way, the reports keep arriving daily. The only question is whether anyone reads and acts on them.
