# Drip — Subscription Manager (ASO Research Folder)

## What This Is

ASO (App Store Optimization) research and metadata for **Drip: Subscription Manager** — a subscription tracking app with free trial reminders, bill organization, and cancel guides.

This folder is **research only** — no code, no app source. All files are markdown documents for ASO strategy.

## App Identity

- **App Name**: Drip: Subscription Manager
- **Subtitle**: Bill Organizer & Cancel Guide
- **Category**: Finance
- **Astro Temp App ID**: 112
- **Store**: US (iPhone)

## Key Files

| File | Purpose |
|------|---------|
| `aso-final-report.md` | **Primary reference** — validated keywords, metadata, final strategy |
| `competitor-analysis.md` | 12 competitor profiles, feature matrix, gaps |
| `keyword-research.md` | Initial keyword research (note: estimates differ from live Astro data) |
| `keyword-scores.md` | Live Astro pop/diff scores for 23 keywords |
| `app-description.md` | App Store description drafts |
| `app-store-metadata.md` | Earlier metadata draft (superseded by aso-final-report.md) |
| `temp-keyword.md` | Raw keyword list from user |

## ASO Rules (from aso-keyword-research skill)

When doing keyword research in this project, always follow:

1. **Revenue filter**: Only analyze competitors earning >= $10K/month
2. **Hard keyword filter**: Pop >= 20 AND Diff <= 60
3. **No branded keywords**: Never use app names, company names, product names
4. **Intent match**: Only keep keywords that match Drip's actual features. If a user searches the keyword and downloads Drip, they must find what they're looking for
5. **Use Astro MCP for live data**: Never rely on estimated scores — always get live Pop/Diff from Astro

## Drip's Actual Features (for intent matching)

- Track subscriptions (manual entry, 500+ service library)
- Free trial tracking with countdown & reminders
- Multi-reminder stacking (7d, 3d, 1d before renewal)
- Monthly/yearly spending dashboard
- Cancel guides with direct links
- Privacy-first (no bank linking, on-device data, iCloud sync)
- Home screen widgets, dark mode

## Critical Findings

- **Trial keywords have near-zero search volume** (Pop = 5 on Astro). Trial tracking is a conversion differentiator, NOT an ASO keyword strategy
- **Colon-suffix keywords (e.g., "subscription manager:") have dramatically lower difficulty** than their plain versions
- **"subscription manager:" (Pop 56, Diff 17) is the #1 opportunity**
- **"bill organizer" (Pop 58) is the highest popularity keyword** in the niche

## Tools

- **Astro MCP**: Used for live keyword scores, competitor extraction, app tracking
- **Astro ASO Researcher agent**: Use for keyword research tasks
- Skill: `aso-keyword-research` — strict process for keyword validation

## Qualified Competitors

| App | ID | Revenue |
|-----|----|---------|
| Rocket Money | 1130616675 | ~$400K/mo |
| Bobby | 1059152023 | ~$10K+/mo (est.) |
| Chronicle | 572561420 | ~$10K+/mo (est.) |
