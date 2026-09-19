---
publishDate: 2026-09-16
title: "Bounce Types Explained: Hard vs Soft, and What They Actually Cost You"
excerpt: "A bounced email looks like one lost send. It isn't. Hard vs soft bounces explained in plain English — and why your sender reputation pays for every one of them."
category: Deliverability
tags: [bounces, list-hygiene, deliverability, sender-reputation]
author: Alan MacDougall
draft: false
---

A bounce looks like a small thing. One email, one address, one failure message buried in a report nobody reads.

But a bounce is not one lost send. It is a data point in a system that decides where **all** your email lands — and the sending systems that notice bounces do not grade on a curve. Enough of them, and every message you send suffers for it, including the ones to perfectly good addresses.

This post explains what a bounce actually is, the two types that matter, and why the cost of a bounce is always larger than the email that failed.

## What a bounce actually is

When you send an email, the receiving mail server — the one responsible for the address you're writing to — runs a series of checks before it accepts the message. Some of those checks are about *you*: is your sending server authorised to use this domain, does the message carry a valid signature, does the sending IP have a decent reputation. Others are about the *recipient*: does this address exist, is this mailbox full, is this account still active.

If the receiving server refuses the message outright — declines it at the door — that refusal travels back to your sending platform as a bounce. The email never reached an inbox. It never will.

That is distinct from spam placement, which is a different failure with different causes. A bounced email wasn't filtered; it was rejected. Confusing the two is common and leads people to fix the wrong problem.

## Hard bounces: permanent, and the address is telling you so

A **hard bounce** is a permanent failure. The receiving server has looked at the address and said, in effect: this cannot work, stop trying.

Common causes:

- **The address doesn't exist.** The account was closed, deleted, or never existed. Maybe it was mistyped at signup. Maybe the person left the company years ago.
- **The domain doesn't exist.** The company went under, or the domain lapsed. Corporate domains die constantly.
- **The receiving server has blocked your sending server permanently.** This is rarer, but a flat block — as opposed to a temporary throttle — is a hard bounce with a different cause: not a dead address, but a dead relationship between the two servers.

The correct response to a hard bounce is always the same: **remove the address immediately.** Not after the third bounce, not at the end of the quarter. Now.

Here is why. Every send to an address that has already hard-bounced is a deliberate act of sending to a known-bad address. The receiving systems notice this. It is one of the clearest signals available that your list is not maintained — that you are sending to addresses you have been told are dead. Mailbox providers read a high hard-bounce rate as the behaviour of a spammer, because historically, that is exactly what spammers do: send blindly to anything that might once have been an address.

## Soft bounces: temporary, or temporarily pretending to be

A **soft bounce** is a failure that may resolve itself. The address is probably fine; circumstances got in the way.

Common causes:

- **The mailbox is full.** The user hasn't logged in and cleared it. Old-school, but it still happens.
- **The receiving server is busy or throttling.** Large providers accept mail at a controlled rate and sometimes defer messages under load.
- **Greylisting.** Some servers deliberately reject first-time senders with a "try again later" code, then accept the retry. It is a spam-filtering technique, not a judgment about you specifically.
- **The message is too large**, or trips a filter rule the recipient has set — say, an aggressive attachment policy.

A soft bounce is not a reason to panic, and it is definitely not a reason to delete the address. One soft bounce is noise. The sending platform will typically retry.

But there's a third case hiding inside "temporary": an address that soft-bounces **every time, over weeks or months**. A mailbox that has been full for six months is not a mailbox in waiting — it is an abandoned mailbox, and functionally it's no different from a hard bounce: you are sending to an address that never receives. The temporariness expired. Prune it.

## Why bounces cost more than the lost send

This is the part most senders never connect.

Mailbox providers — the Gmails and Outlooks of the world — cannot directly observe whether your content is good. What they can observe, cheaply and at scale, is **behaviour**: what fraction of your mail is accepted, how recipients treat it, whether you keep sending to dead addresses. Bounce rate is one of the cheapest and most reliable behavioural signals there is.

So every hard bounce does double damage. The immediate loss is the send itself. The deferred loss is reputational: a small deposit into an account you don't want funded. Keep sending to dead addresses at volume and the reaction is predictable — first throttling, then bulk placement, then rejection of messages to *live* addresses too.

Which means the true cost of a bounce is not one email. It's a fraction of a percent of deliverability on everything you'll ever send, collected at the door.

## What to actually do about it

1. **Watch your bounce rate on every send.** Your platform reports it. Look at it the way you'd look at a temperature gauge, not a trivia fact.
2. **Remove hard bounces automatically and immediately.** Any competent ESP will do this natively. Verify it's enabled.
3. **Audit addresses with repeated soft bounces** — say, three or four consecutive sends — and prune them like hard bounces.
4. **Fix problems at the point of collection.** Most bad addresses enter your list at signup. A double opt-in confirmation, or at minimum a well-designed signup form, prevents more bounces than any amount of pruning afterwards.
5. **Never reuse an old list.** Bought, borrowed, or "we had this from an event in 2023" — see *hard bounces* above, at volume, all at once. This is the single fastest known way to burn a sending reputation.

## Test what bounces are costing you

If you know your rough bounce rate, you can model what the hygiene problem is worth — bounced mail never arrives, never gets opened, and never converts. The [ROI calculator](/tools/roi-calculator) lets you run your own numbers with bounce rate as an input, and shows what the lost sends would have earned at your current rates.

And before your next campaign, the [preflight checklist](/tools/preflight-checklist) walks the checks that catch bounce-prone sends — list freshness, authentication, send volume — before your reputation pays for them.

*Next in this series: [list hygiene for small businesses](/list-hygiene-small-businesses) — how often to prune, how re-engagement campaigns work, and why keeping dead addresses is worse than keeping no list at all.*
