---
publishDate: 2026-09-16
title: "Hard Bounces vs Soft: What Each One Costs You"
excerpt: "Hard and soft bounces explained in plain English, and why your sender reputation pays for every one of them."
category: Deliverability
tags: [bounces, list-hygiene, deliverability, sender-reputation]
author: Alan MacDougall
draft: false
---

A bounce looks like a small thing. One email, one address, one failure message buried within a report that has many more opens and clicks overall.

But a bounce is not simply one lost send. It is a signal from a system that decides where **all** your email lands, and the sending systems that notice bounces take each signal seriously. Enough of them, and every message you send suffers for it, including the ones sent to perfectly healthy addresses.

This post explains what a bounce actually is and how the two types differ. It also covers why the cost is always larger than just the email that failed.

## What a bounce actually is

When you send an email, the server responsible for the address you're writing to runs a series of checks before it accepts the message. Some of those checks are about *you* - from whether your sending server is authorised to use the domain to whether the sending IP has a decent reputation. Others are about the *recipient*. For example - does this address exist? Is this mailbox full? Is this account still active?

If the receiving server refuses the message outright, that refusal travels back to your sending platform as a bounce. The email never reached an inbox. It never will.

That is distinct from spam folder placement, which is a different failure with different causes. A bounced email wasn't filtered; it was rejected outright. Confusing the two is common and leads people to fix the wrong problem.

However, there are two types of bounces to be aware of - the hard bounce, and the soft bounce.

## Hard bounces: permanent, and the address is telling you so

A **hard bounce** is a permanent failure. The receiving server has looked at the address and said, in effect: this cannot work, stop trying.

Common causes:

- **The address doesn't exist.** The account was closed, deleted, or never existed. Maybe it was mistyped at signup. Maybe the person left the company years ago and the inbox was closed.
- **The domain doesn't exist.** The company went under, or the domain lapsed.
- **The receiving server has blocked your sending server permanently.** This is rarer, but a flat block, as opposed to a temporary throttle, counts as a hard bounce with a different cause: not a dead address, but in effect a dead relationship between the two servers.

The correct way to handle a hard bounce is to **remove the address immediately.** Not after the third bounce or at the end of the quarter. Straight away.

**Why?** Every send to an address that has previously been hard-bounced is a deliberate act of sending to a known-bad address. The receiving systems notice this. It is one of the clearest signals available that your list is not maintained. Mailbox providers read a high hard-bounce rate as the behaviour of a spammer, because historically, that is exactly what spammers do: send blindly to anything that may have once been an address.

## Soft bounces: temporary, or temporarily pretending to be

A **soft bounce** is a failure that may resolve itself. The address is probably fine; circumstances got in the way.

Common causes:

- **The mailbox is full.** The user hasn't logged in and cleared it. Old-school, but it still happens.
- **The receiving server is busy or throttling.** Large providers accept mail at a controlled rate and sometimes defer messages under load.
- **Greylisting.** Some servers deliberately reject first-time senders with a "try again later" code, then accept the retry. It is a spam-filtering technique, not a judgement about you specifically.
- **The message is too large**, or trips a filter rule the recipient has set, such as an aggressive attachment policy for example.

A soft bounce is not a reason to panic, and it is not a reason to delete the address. One soft bounce is noise. The sending platform will typically retry.

But there's a third case hiding inside "temporary". In this case, an address that soft-bounces **every time, over weeks or months**. A mailbox that has been full for six months is not a mailbox in waiting. It is an abandoned mailbox, and functionally it's no different from a hard bounce: you are sending to an address that never receives. The temporariness expired. Remove it.

## Why bounces cost more than the lost send

Most senders never connect this part.

Mailbox providers, the Gmails and Outlooks of the world, cannot directly observe whether your content is good. What they can observe, easily and at scale, is **behaviour** (both your behaviour and that of the recipient/receiving inbox): what fraction of your mail gets accepted, and whether you keep sending to dead addresses. Bounce rate is one of the most reliable signals there is.

So every hard bounce does double damage. The immediate loss is the send itself. The additional loss is reputational: a small deposit into an account you don't want to keep funding. If you keep sending to dead addresses at volume, the reaction is predictable. Throttling arrives first, then bulk placement. Eventually, rejection of messages to *clean* addresses too.

The true cost of a bounce is not one email. It's a fraction of a percent off successful delivery across everything you'll ever send.

## What to actually do about it

1. **Watch your bounce rate on every send.** Your platform reports it. Look at it the way you'd look at a temperature gauge, not a trivia fact.
2. **Remove hard bounces automatically and immediately.** Any competent ESP will do this natively. Verify it's enabled.
3. **Audit addresses with repeated soft bounces**, three or four consecutive sends is a reasonable threshold, and prune them like hard bounces.
4. **Fix problems upon collection.** Most bad addresses enter your list at signup. A double opt-in confirmation catches most of these at the point of collection.
5. **Never reuse an old list.** Bought lists, and "we had this from an event in 2023" lists, produce *hard bounces* at volume, all at once. This is perhaps the single fastest way to burn a sending reputation.

## Test what bounces are costing you

If you know your rough bounce rate, you can model what the hygiene problem is worth. Bounced mail never arrives, so it never gets opened and never converts. The [ROI calculator](/tools/roi-calculator) lets you run your own numbers with bounce rate as an input, and shows what the lost sends would have earned at your current rates.

And before your next campaign, the [preflight checklist](/tools/preflight-checklist) walks the checks that catch bounce-prone sends, from list freshness to authentication to send volume, before your reputation pays for them.

*Further reading: [list hygiene for small businesses](/list-hygiene-small-businesses), on how often to prune and why keeping dead addresses is worse than keeping no list at all.*
