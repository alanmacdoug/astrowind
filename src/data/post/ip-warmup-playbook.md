---
publishDate: 2026-09-16
title: "IP Warm-Up: Start Sending Without Torching Your Reputation"
excerpt: "New sending infrastructure has no reputation, which receivers treat as suspicious. This is the staged process for building reputation deliberately, and the mistakes that burn it in week one."
category: Deliverability
tags: [deliverability, ip-warmup, sender-reputation, sending-infrastructure]
author: Alan MacDougall
draft: false
---

A new sending IP address has no history, no reputation, and no goodwill. Inbox providers, who make filtering decisions on exactly those signals, treat the unknown as suspect. The safest thing to do with a sender you have never seen before is deliver cautiously and watch.

That is what IP warm-up is: sending deliberately small, gradually increasing volumes from new infrastructure so receivers see a stable, consistent sender behaving normally, and extend the benefit of the doubt that established senders take for granted. It is slow, it is unglamorous, and skipping it is one of the most expensive mistakes in email infrastructure, because sender reputation, once damaged, recovers at the speed of geological time.

## Who this applies to

Warm-up is for **new sending infrastructure**. If you send through a major ESP, such as Mailchimp, Klaviyo or ActiveCampaign, you are on shared IPs or infrastructure already warmed by someone else's patience. You can skip this post; your ESP's sending practices handle it.

You need warm-up when one of these is true:

- You have moved to a **dedicated IP** on an ESP plan that offers one
- You are **self-hosting**, with Mautic, Postal, or any SMTP stack on your own VPS
- Your business has **outgrown shared infrastructure** and is making its first serious volume commitments

This overlaps with the same audience as the [Mautic cost comparison piece](/mautic-vs-esp-cost-comparison): self-hosters are the group that routinely learns about warm-up the hard way, after day one's first campaign lands in spam.

## Why warming works: the logic receivers apply

Inbox providers score senders on observable behaviour over time. Volume consistency, complaint rate, bounce rate, spam-trap hits, engagement from recipients. A sender with three months of steady, low-complaint history has accumulated trust. A sender that appears from nowhere and immediately sends 50,000 messages has, from the receiver's perspective, the exact profile of a spam operation, because that is overwhelmingly what such senders turn out to be.

Warm-up works by inverting that profile. Start where you look like a careful newcomer, and grow only at a rate where your behaviour keeps matching a legitimate sender scaling up. The complaint and bounce numbers need to stay low at every stage, because reputation damage is not averaged out over the warm-up. It is recorded, and it accumulates.

## The playbook

Standard progression for most senders, with volume growing roughly 50–100 percent per day where the previous day's signals were healthy:

**Week 1: the trickle.** A few hundred messages daily, and not just any messages. Your most engaged list segment: recent customers, frequent openers, contacts who have demonstrated activity. Receivers do not just see volume; they see engagement. Opens, replies, deletes, moves to inbox. Starting with your warmest recipients makes every early signal positive.

The volume matters less than the discipline. Same send times, daily, no skipped days. Consistency is itself the signal.

**Week 2: doubling down.** If complaints stayed negligible and bounces stayed low, roughly double the daily volume, continuing to favour engaged segments. A thousand-plus daily now. Watch the bounce rate closely. If it climbs, slow the progression. Bounces are read as list hygiene problems, and hygiene problems are read as spammer behaviour.

**Week 3–4: scale.** Continue doubling on the same condition, that yesterday's numbers were clean. By the end of week four, a typical small-business sender is at tens of thousands daily and effectively warmed. At this point the progression can relax; the reputation is established.

**Throughout, never these things:**

- **Do not send cold email from warming infrastructure.** Cold outreach has the worst engagement profile of any legitimate mail type: few opens, no replies, complaints, spam traps. It is the fastest way to burn a fresh IP, and possibly the origin of the myth that warm-up "does not work", because people who warm with cold lists get the results cold lists deserve.
- **Do not skip days.** A gap in sending resets the consistency signal you are building. Same schedule, every day, even weekends, especially if your eventual sending pattern includes weekends.
- **Do not accelerate past the signals.** If complaints or bounces appear at any stage, hold volume flat or reduce it. The temptation is to push through because the campaign calendar says so. The calendar is wrong; the signals are right.

## Domain reputation is not the same thing

A distinction that saves confusion later: everything above is about **IP reputation**, which belongs to the address. There is also **domain reputation**, which belongs to your sending domain and follows you across addresses. A new domain needs its own warm-up consideration regardless of IP, which is why the authentication and setup work covered in the [SPF deep-dive](/spf-record-deep-dive) matters before the first campaign, not after.

If you are migrating an established domain to new infrastructure, your domain reputation partially shields you, and the migration can progress faster than a cold start. If the domain is new too, warm both together and expect a slower curve than either alone.

## Verification at every stage

You are warming to build trust, so measure whether trust is being built. Before, during, and after the progression, check the same things a receiver checks. The full battery is in the [pre-send checklist](/pre-send-checklist), but the warm-up essentials:

- **Authentication passing**. SPF, DKIM, DMARC aligned from day one. Warming without authentication is building reputation on a foundation the receiver does not trust.
- **Blacklist status**. The common DNSBLs, checked regularly during the progression. Appearing on one is the clearest possible signal to halt and diagnose rather than continue.
- **Inbox placement tests**. Seed accounts at the major providers, checked at each volume stage. Placement is the outcome; authentication and reputation are the causes.

## When warm-up fails

Honest failure modes, because they are common enough to name:

- **Sending cold or purchased lists**, as above. Unfixable by warming.
- **Engagement never materialises**. If your recipients genuinely do not engage, the warm-up surface area is a list problem, not an infrastructure problem, and it needs a different fix.
- **A bad neighbour**. Rare on dedicated IPs, but a VPS provider can issue you an address with inherited reputation damage. If a fresh setup shows inexplicably poor placement from day one, check the IP's history before blaming your configuration.

If placement remains poor after a disciplined progression and clean signals throughout, the diagnosis is rarely the warm-up itself. It is something the warm-up surfaced, and that distinction, telling infrastructure problems from list problems, is exactly what a deliverability investigation is for.

## Where this fits

The [SPF generator](/tools) builds the authentication the whole progression rests on. The [pre-send checklist](/pre-send-checklist) verifies it before each stage. The ROI calculator measures what the eventual campaign performance is worth. Together: authenticate first, warm second, verify third, in that order, because each step assumes the ones before it.
