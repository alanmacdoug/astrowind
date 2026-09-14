---
draft: false
title: Why Your Emails Are Going to Spam in 2026
excerpt: >-
  Placeholder excerpt for layout testing: the major inbox providers now
  enforce sender requirements most businesses still fail. This scaffold
  post exists to test the article layout.
author: Alan MacDougall
publishDate: 2026-09-11
categories:
  - Deliverability
tags:
  - SPF
  - DKIM
  - DMARC
---

This is a scaffold post for layout testing. The prose sits inside a
`prose` wrapper in the Markdown layout, so this paragraph renders with
the theme's typography — copy below is placeholder and will be replaced
in the real editing pass.

## Why it happens

The bulk-sender requirements from Gmail, Outlook and Yahoo turned what
was previously advisory into enforcement. In practice:

- **SPF** — one record, no more than ten DNS lookups
- **DKIM** — signed mail, 1024-bit keys or larger
- **DMARC** — published policy, aligned with the above
- **One-click unsubscribe** — RFC 8058 for bulk mail

## What breaks most often

A short diagnostic list, placeholder wording included:

1. SPF records that accumulated over years and now exceed the lookup limit
2. DKIM selectors configured once and never verified in production
3. DMARC policies published as `p=none` and never moved to enforcement

## Where this goes

The real article diagnoses each failure mode in the direct, technical
register and ends by funnelling to the audit offer. That pass happens
once the layout is confirmed.

![Scaffold image for layout testing](~/assets/images/about-pipes.jpg)
