---
draft: false
title: "Building an SPF Record: Structure, Includes and the Lookup Limit"
excerpt: >-
  How SPF records actually work, why they break when they grow too
  large, and how to build one deliberately from scratch.
author: Alan MacDougall
publishDate: 2026-09-15
categories:
  - Email Authentication
tags:
  - SPF
  - DNS
---

Most SPF guides stop at "publish a record listing your servers." That
advice is how most broken SPF records get made. This is the deeper
version: what the record's parts actually do, the limit that silently
breaks it, and the discipline of building one deliberately.

If you are new to the three protocols altogether, start with the
basics, then come back here.

## The anatomy of a record

An SPF record is a single TXT record published at the apex of your
domain:

    v=spf1 include:_spf.google.com include:sendgrid.net ~all

Four parts, each doing one job:

**`v=spf1`** — the version tag. Every record starts with it. One record
per domain; publishing two means receivers may use either or neither.

**`include:`** — delegates evaluation to another domain's record. When a
receiver hits an include, it pauses your record, fetches the referenced
record, and evaluates that instead. Includes are how platforms like
Google Workspace and SendGrid authorise their own servers to send as
your domain — you point at them, they carry the list.

**The all-mechanism** — the final verdict for anything not matched
earlier. Four flavours, in increasing strictness: `+all` (permit
everything — never do this), `-all` (hard fail), `~all` (soft fail),
and bare omission (no policy at all). Most domains should use `~all`
while tuning, `-all` once their sender inventory is provably complete.

**Everything else** — `a`, `mx`, `ip4`, `ip6`, `redirect`, `exists`.
Each resolves to IPs the receiver should treat as authorised. `mx` and
`a` each cost a DNS lookup at evaluation time — relevant in a moment.

## The limit nobody warns you about

SPF evaluation is capped at ten DNS lookups per record. The cap
includes every include, every nested include inside those, every `mx`,
every `a`, every `redirect`, and every `exists`. Mechanisms that
resolve to literal addresses — `ip4` and `ip6` — are free.

When your record exceeds ten lookups, receivers do not partially
evaluate it. Most simply return `permerror` — the whole record fails,
including the mail that was legitimately sent from the servers you
listed. The record does not degrade gracefully. It breaks entirely.

This is why SPF records rot: every tool a business connects adds its
include, the count creeps up invisibly, and one day the record that
worked for years returns permerror for everything. It usually gets
diagnosed as something else first, because nobody checks the lookup
count first.

Ten includes does not mean ten lookups — most platform records contain
nested includes of their own. Google's record includes several more;
an `include:` for a platform that itself uses four lookups spends five
of your budget. The only way to know your true count is to walk the
tree, which is exactly what a lookup-aware check does.

## Building one deliberately

The discipline is to treat the record as an inventory, not a wish
list. Every entry should correspond to something that actively sends
mail as your domain today:

1. **List what actually sends.** Not what once sent, not what might
   send. Mail platform, CRM, invoicing system, helpdesk, the server
   that sends password resets. Each one either needs an include or an
   IP entry
2. **Add entries one at a time, deliberately.** Never paste a template
   with pre-ticked platforms — every entry is a claim that the sender
   is yours, and a lookup spent
3. **Count as you go.** Watch the lookup total climb with each
   addition. Above eight, you are in budget-management territory;
   above ten, broken
4. **Choose the closing mechanism consciously.** `~all` while the
   inventory is uncertain, `-all` only when DMARC reports confirm
   nothing legitimate is failing

## When the record is too big

If a genuine inventory cannot fit the budget — too many platforms, too
much nesting — the options are narrowing, not expansion:

- **Remove dead includes.** The first pass is almost always finding
  tools that were disconnected years ago and still occupy a lookup.
  Auditing against what actually sends frees budget at zero cost
- **Collapse nesting.** `ip4` entries are free; where a platform can
  provide stable ranges instead of an include, direct entries spend
  zero lookups — at the cost of maintaining them when ranges change
- **Flatten the record.** Third-party flattening services resolve the
  include tree and publish the resulting IPs. It trades maintainability
  for headroom, and needs monitoring to catch stale addresses

None of these are one-time fixes. The record is infrastructure — it
drifts as the business connects and disconnects tools, and needs
re-auditing whenever the stack changes.

## Check yours, then build it right

The authentication checker walks your live record through the full
lookup tree and reports your actual count, not the include count. If
you are rebuilding from scratch, the SPF generator walks the
inventory-first process described above — every sender added
deliberately, the lookup budget visible as you build.

[Check your current SPF record](/tools/auth-checker)

[Build an SPF record the deliberate way](/tools/spf-generator)

The record you publish is a claim about your infrastructure. Make it
a careful one.
