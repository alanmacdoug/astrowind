---
draft: false
title: "DKIM Selectors and Keys: The Part Most Never Touch Again"
excerpt: >-
  How DKIM selectors work, why records under different selectors behave differently,
  and what key rotation actually involves.
author: Alan MacDougall
category: 'Email Authentication'
tags:
  - DKIM
  - DNS
publishDate: 2026-09-15
---

DKIM has a strange property. It is simultaneously the most robust of the three authentication systems and the one most often quietly broken. The cryptography works when it is configured, and that configuration lives in DNS behind a naming scheme most people never look at again after setup day.

This guide covers that naming scheme and the maintenance discipline that keeps signatures verifiable for years.

## Where the key lives

A DKIM public key is published as a TXT record at an address built from a selector name and a fixed suffix:

    selector._domainkey.example.com

The two halves each carry meaning:

**The selector** is a label the sending platform chooses — `google`, `s1`, `smtp20`, `mail`, whatever the platform decided. When a message is signed, the signature records which selector was used, and the receiver fetches the key from that selector's address to verify it.

**The `_domainkey` suffix** is fixed. It marks the namespace. A record published anywhere else is decoration.

The consequence of this scheme matters: DKIM does not exist or not exist for a domain. It exists *per selector*. A domain can have a perfectly valid key at `s1._domainkey` and nothing at `s2._domainkey`. Or, a domain can have a set of custom keys. This is why checker tools probe a list of common selector names. An absent selector proves nothing on its own; it just means that name is not in use.

## The private half

For every published public key, the sending platform holds the matching private key and uses it to sign outgoing mail. The practical details that matter to senders:

- **Key size.** 1024-bit is the de facto minimum; some providers now require 2048-bit. Undersized keys can be treated as failed verification
- **The key's lifetime.** Private keys leak; they are decommissioned with platforms, or they outlive the DNS records they belong to. The public record should not outlive the platform that holds the private half. A *missing* record is what breaks mail

That last point is the failure mode worth internalising. DKIM breaks when the signature references a selector whose DNS record has gone missing, whether expired by the DNS policies, deleted during a migration, or never created because the setup was half-completed. The signing side believes everything is fine. The verifying side gets a lookup failure.

## What rotation actually is

Key rotation means generating a new key pair, publishing the new public key at a *new* selector, switching the signing platform to the new key, and retiring the old. Done properly, no message ever references a selector that does not resolve:

1. Publish the new public key at a new selector; the old record stays live
2. Switch the platform's signing to the new selector
3. Wait out the TTL of the old record, plus a margin covering in-flight mail
4. Remove the old record only once no signatures still reference it

The order matters. Rotating in the other direction, deleting first and publishing after, produces a window where every outgoing message carries a signature nothing can verify. Each failed verification is a reputation event.

How often to rotate is a matter of appetite rather than regulation. Common practice is annually. Security-conscious organisations rotate quarterly. The honest framing: rotation is cheap insurance against key compromise, and expensive only when done carelessly.

## Selectors in the wild

If you have ever wondered why your DKIM "isn't set up" even though your platform swears it is, the answer is nearly always selectors. Each platform signs under its own selector name, often several. Google uses per-tenant selectors and SendGrid its own; marketing platforms each bring theirs. A domain sending through four platforms typically has six to ten DKIM records scattered across different selectors, and each one matters only to the mail signed under it.

The [authentication checker](/tools/auth-checker) probes the common selector names and reports which resolve; it gives you a snapshot of what is live. For the complete inventory, your sending platforms' own settings pages remain the source of truth, because a valid selector with an unusual name is invisible to such tools.

## The maintenance discipline

DKIM does not need attention, until it does. The practice that prevents surprises:

- Verify selectors after any platform migration, DNS change, or domain transfer. The half-completed setup is the classic breaker
- Keep a private record of which platform signs under which selector, for every domain you administer
- Rotate on a schedule you will actually follow, in the order above
- Confirm signatures end-to-end by testing to a real mailbox, not by trusting the platform's status page
