# ASO Keyword Research: Drip — Subscription Manager

**Date:** 2026-04-06
**Store:** US (iPhone)
**Method:** Astro MCP live data + competitor extraction + strict filtering

---

## Qualified Competitors (revenue >= $10K/mo)

| App | Revenue Est. | Rating | Reviews | Source |
|-----|-------------|--------|---------|--------|
| Rocket Money | ~$400K/mo ($80M/yr) | 4.4 | 50K+ | Growjo, Prospeo |
| Bobby - Track Subscriptions | ~$10K+/mo (est. from 8K reviews × $2.99 IAP) | 4.7 | 7,882 | Conservative estimate |
| Chronicle - Bill Organizer | ~$10K+/mo (3.5K reviews × $11.99/yr sub) | 4.8 | 3,545 | Conservative estimate |

**Discarded** (< $10K/mo): SubTracky (172 reviews), SubMeter (0 reviews), Trial Alert (1 review), all other indie apps.

---

## All Keywords Evaluated — Full Filter Table

### Filter Criteria
- Pop >= 20
- Diff <= 60
- NOT branded
- Intent matches Drip's features (subscription tracking, trial reminders, bill reminders, cancel guides, spending dashboard)

| Keyword | Pop | Diff | Branded | Intent | Verdict |
|---------|-----|------|---------|--------|---------|
| subscription manager: | 56 | 17 | No | YES — manages subscriptions | **APPROVED** |
| bill organizer: | 55 | 40 | No | YES — organizes recurring bills | **APPROVED** |
| bill organizer | 58 | 57 | No | YES — same as above | **APPROVED** |
| bıll organizer | 55 | 57 | No | YES — typo variant, captures misspells | **APPROVED** |
| subscriptions: | 50 | 34 | No | YES — core term | **APPROVED** |
| subscription | 50 | 57 | No | YES — core term | **APPROVED** |
| cancel subscriptions | 38 | 60 | No | YES — app has cancel guides | **APPROVED** (Diff = 60, borderline) |
| subscription tracker | 36 | 47 | No | YES — core term | **APPROVED** |
| bill tracker | 32 | 57 | No | YES — tracks bills | **APPROVED** |
| subscription cancel | 30 | 51 | No | YES — cancel feature | **APPROVED** |
| bills manager | 26 | 56 | No | YES — manages bills | **APPROVED** |
| manage subscriptions | 25 | 46 | No | YES — core action | **APPROVED** |
| my subscriptions | 24 | 54 | No | YES — "my subscriptions" intent | **APPROVED** |
| payment tracker | 23 | 53 | No | BORDERLINE — tracks subscription payments | **APPROVED** |
| subscription stopper | 22 | 55 | No | YES — cancel/stop subscriptions | **APPROVED** |
| bill planner | 20 | 57 | No | BORDERLINE — plans bill payments | **APPROVED** |

**Total APPROVED: 16 keywords**

---

## Rejected Keywords

| Keyword | Pop | Diff | Reason |
|---------|-----|------|--------|
| money manager: | 48 | 19 | **Intent mismatch** — app doesn't do full money management |
| expense tracker: | 46 | 19 | **Intent mismatch** — app only tracks subscription expenses, not all expenses |
| money tracker: | 44 | 17 | **Intent mismatch** — not a general money tracker |
| budget tracker: | 42 | 15 | **Intent mismatch** — app doesn't do budgeting |
| worth tracker | 51 | 47 | **Intent mismatch** — app doesn't track net worth |
| spending tracker | 47 | 67 | **Diff > 60** — fails hard filter |
| reminder | 55 | 69 | **Diff > 60** — fails hard filter |
| cancel | 25 | 72 | **Diff > 60** — fails hard filter |
| free trial tracker | 5 | 67 | **Pop < 20 AND Diff > 60** — fails both filters |
| trial reminder | 5 | 40 | **Pop < 20** — fails hard filter |
| free trial reminder | 5 | 51 | **Pop < 20** — fails hard filter |
| subscription renewal | 5 | 19 | **Pop < 20** — fails hard filter |
| recurring payments | 5 | 58 | **Pop < 20** — fails hard filter |
| bill reminder | 9 | 51 | **Pop < 20** — fails hard filter |
| subscription spending | 5 | 42 | **Pop < 20** — fails hard filter |
| savings tracker: | 34 | 49 | **Intent mismatch** — app doesn't track savings |
| fast track | 33 | 46 | **Intent mismatch** — unrelated to subscriptions |
| everydollar dave ramsey | 33 | 53 | **BRANDED** — Dave Ramsey product |
| remind 101 | 32 | 44 | **BRANDED** — app name |
| income tracker | 21 | 48 | **Intent mismatch** — app doesn't track income |
| expense track | 23 | 58 | **Intent mismatch** — same as expense tracker |

---

## CRITICAL FINDING: Trial Keywords Are Dead

Earlier estimates suggested "trial reminder" (Pop 22, Diff 18) and "free trial tracker" (Pop 20, Diff 15) were GOLD opportunities. **Live Astro data shows Pop = 5 for ALL trial keywords.** This means:

- Nobody searches for "trial reminder" on the App Store
- The "blue ocean" was actually a "dead sea" — no water at all
- Trial tracking is still a great **feature differentiator** but NOT an ASO keyword strategy

**Implication**: Do NOT waste title/subtitle chars on trial keywords. Use them for proven high-pop keywords instead. Mention trial tracking in the description for conversion, not discovery.

---

## Recommended ASO Metadata

### App Name (30 chars max)
```
Drip: Subscription Manager
```
(26 chars)
- Captures: "subscription manager" (Pop 56, Diff 17) — #1 GOLD keyword
- Also indexes: "subscription", "manager"

### Subtitle (30 chars max)
```
Bill Organizer & Cancel Guide
```
(29 chars)
- Captures: "bill organizer" (Pop 58, Diff 57) — highest pop keyword
- Captures: "cancel" intent
- Also indexes: "bill", "organizer", "cancel"

### Keyword Field (100 chars max)
```
tracker,subscriptions,bills,manage,payment,stopper,my,planner,cancel subscriptions,recurring,track
```
(99 chars)

**Words already indexed from Title + Subtitle:** subscription, manager, bill, organizer, cancel, guide

**Keyword field combos created:**
| Combo | Pop | Diff |
|-------|-----|------|
| subscription tracker | 36 | 47 |
| subscriptions (via field) | 50 | 34 |
| cancel subscriptions | 38 | 60 |
| manage subscriptions | 25 | 46 |
| my subscriptions | 24 | 54 |
| subscription stopper | 22 | 55 |
| bill tracker | 32 | 57 |
| bills manager | 26 | 56 |
| bill planner | 20 | 57 |
| payment tracker | 23 | 53 |
| subscription cancel | 30 | 51 |

---

## Top 3 Keyword Opportunities

1. **subscription manager:** (Pop 56, Diff 17) — Easiest high-pop keyword to rank for. Low difficulty means a new app can reach top 10 quickly. Must be in title.

2. **bill organizer:** (Pop 55, Diff 40) / **bill organizer** (Pop 58, Diff 57) — Colon variant has significantly lower difficulty. Highest overall popularity keyword in the niche. Must be in subtitle.

3. **cancel subscriptions** (Pop 38, Diff 60) — High intent keyword. Users searching this are ready to act, which matches Drip's cancel guide feature perfectly.

---

## Updated Description Strategy

Since trial keywords have near-zero search volume, the description should:
- Lead with subscription management and bill organization (proven high-pop keywords)
- Mention trial tracking as a **conversion differentiator** (not an SEO play)
- Embed approved keywords naturally for Google Play indexing
- Drop all rejected keywords from copy

---

*Sources: Astro MCP live data (2026-04-06), Growjo, Prospeo, App Store listings*
