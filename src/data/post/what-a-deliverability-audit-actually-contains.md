---
title: "What a Deliverability Audit Actually Contains: Scope, Timeline, Deliverable"
description: "A deliverability audit is not a report nobody reads. It is a diagnosis of where your email breaks, what it costs you, and how to fix it. Here is exactly what the work contains."
pubDate: false
---

# What a Deliverability Audit Actually Contains: Scope, Timeline, Deliverable

When you book a deliverability audit, you're buying diagnosis. Not a long PDF that explains what deliverability is, not a checklist somebody printed and handed back to you — a working investigation into where your email breaks, why it breaks there, and exactly what fixing it involves.

This post demystifies the scope. What you get, how long it takes, and what changes before and after the audit completes.

## What triggers an audit

Most clients book an audit because email is not doing what it should:

- **Email lands in spam and nobody knows why.** The dashboard shows sends leaving your platform. The recipients say they never see it.
- **A new platform, new domain, new supplier.** You're about to send a big campaign and you want the infrastructure right before you burn your reputation.
- **Migration or consolidation.** Moving between ESPs, consolidating sending domains, bringing in a new marketing platform — and you want authentication carried over correctly.
- **Suspicion of a configuration problem.** You've tried the obvious fixes and nothing moved. The problem is deeper than content or timing.

If one of those describes your situation, the audit starts with a conversation and proceeds from there.

## What the investigation covers

An audit is a systematic check of every layer that affects where email lands. The work is divided into three parts, each one checked, each one documented, each one scored as pass/fail with evidence.

### 1. Domain authentication

SPF, DKIM and DMARC published against your domain are examined line by line:

- **SPF record structure** — authorised servers listed correctly, the ten-lookup limit respected, SPF soft-fail vs hard-fail semantics applied appropriately for your sending volume.
- **DKIM selectors** — keys published and matching records, key rotation practice in place or flagged if absent, common selector mistakes that undermine signature validity.
- **DMARC policy** — currently published as monitoring (p=none) or enforcement (quarantine/reject), alignment rules appropriate for your sending platforms, reporting addresses configured so you actually receive the data.

Each element is tested live against public DNS — not theorised from documentation, observed directly. Where something fails, the exact error is logged.

### 2. Sending infrastructure

Authentication is necessary but not sufficient. The rest of the system is inspected:

- **Sending platform configuration** — whether your ESP or self-hosted stack is authenticated correctly, whether separate subdomains are used for different types of send (transactional vs marketing vs system mail), whether IP reputation is managed or delegated to a shared pool.
- **List hygiene status** — bounce rate on recent sends, whether hard bounces are suppressed automatically, whether dormant subscribers have been re-engaged or pruned. A list maintained to poor standards will fail regardless of authentication quality.
- **Historical complaints and blacklists** — whether the domain or sending IPs appear on any public blocklists, whether spam-trap hits have accumulated, what remediation looks like if the answer is yes.

This is where most "my email is going to spam" problems actually sit: not a DNS misconfiguration, but a reputation problem masked as a DNS problem.

### 3. The recipient-side view

Email delivery is decided by the receiving system, not yours. An audit therefore checks how you appear to the inbox providers:

- **Test sends to major inboxes** — Gmail, Outlook, Yahoo — with results logged for acceptance, rejection or spam placement.
- **Feedback loops and reputation tools** — whether you're enrolled in ISP feedback channels, whether Google Postmaster and Microsoft SNDS reports are accessible and monitored, what trends show over recent weeks.
- **Content checks** — subject lines, link structure, attachment usage, URL shortener domains, plain-text ratio. Content does not carry the full burden of placement, but bad content will sink a good reputation faster than good content will save a bad one.

The output is a complete picture: what you control, what you don't, and where the bottleneck sits.

## What you receive

The deliverable is not a generic report. It is specific to your domain, your sending platforms, and your current performance. The output includes:

- **A plain-English summary** — what is working, what is broken, what is causing the problem. Written for decision-makers who need to act, not engineers who need to read RFCs.
- **Evidence-backed findings** — each conclusion is tied to a test, a screenshot, or a DNS record. No assertions without proof.
- **A prioritised remediation plan** — fixes ranked by impact and effort, with the fastest wins first and the structural changes flagged for later quarters. You do not need to act on everything simultaneously; the audit tells you what matters and what can wait.
- **Next steps** — whether this is a two-hour self-fix, a three-day remediation project, or the start of a retainer for ongoing management. If the problem is deeper than the audit covers, that is told plainly, not sold through.

Typical turnaround is **three working days**, from initial conversation to written findings. Rushed audits produce rushed conclusions; three days allows proper investigation across all three layers.

## What the audit is not

To be clear on what an audit does **not** promise:

- **It does not guarantee inbox placement.** Mailbox providers make that decision, not consultants. The audit removes barriers within your control; external factors remain external.
- **It does not replace ongoing maintenance.** Authentication drifts, reputation shifts, sending volumes change. The audit is a snapshot, not a permanent shield.
- **It does not diagnose content problems alone.** Content interacts with reputation and authentication. A perfect DMARC record cannot compensate for a purchased list, and a good list cannot compensate for aggressive content. The audit diagnoses all three, and the findings reflect that interaction.

## Pricing and the path forward

The diagnostic audit — the full investigation described above — starts at **£150**. That is a fixed price, not an hourly rate, not an estimate. Once the investigation completes, you have either a self-fix plan or a remediation quote, with no further obligation.

For clients who need implementation support, the audit transitions naturally into the [review and strategy package](/services): the same investigation plus a prioritised implementation roadmap, delivered together at a single fee. This is the choice after diagnosis — fix it yourself using the plan, or engage help to execute it.

## Before the audit begins

If you want to prepare:

- **Gather access details.** Your ESP credentials, DNS hosting platform login, and any historical reports you have — the DMARC aggregate reports, the Postmaster trends. You don't need admin access to everything, but the investigation is cleaner with it.
- **Note the problems.** When did things start going wrong? What changed around that time? Who else sends email from your domain? The history helps the investigation focus.
- **Run the free tools first.** The [email authentication checker](/tools/auth-checker) and [ROI calculator](/tools/roi-calculator) give you a rough sense of what's broken and what it's costing. Bring those observations to the audit — it saves time, and it means you start with a clearer picture of the stakes.

## The real cost of delay

Delaying an audit is not risk-neutral. Every week with a broken authentication setup, every campaign sent to a degraded list, every reputation hit accepted as "normal" is cumulative damage. Reputation rebuilds slowly; it erodes quickly.

The audit tells you where you stand, and what fixing it involves. Once you know those two things, you can choose whether to act now or wait. Either way, it is a choice made with information rather than speculation.

*This post sits alongside [bounce types explained](/bounce-types-explained) and [list hygiene for small businesses](/list-hygiene-small-businesses) — the hygiene triad that feeds reputation. For the foundation layer, see [email authentication basics](/email-authentication-basics).*
