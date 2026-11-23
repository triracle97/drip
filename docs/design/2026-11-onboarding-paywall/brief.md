# Drip — onboarding + paywall redesign brief

App: "Drip", iOS subscription tracker. Hook: every subscription shown in HOURS OF YOUR WORK
("Netflix = 1h 02m of your work"). Hard paywall after onboarding: 3-day free trial, then
$30/year (preselected, "Save 50%", = $2.50/mo) or $5/month.

Visual language (match ref/current-home.png): pure white background, near-black text (#0A0A0A),
one accent teal #177b9c (light tint #E8F2F6), success green #34C759 used sparingly, SF Pro
(system) typography, big bold numbers as heroes (Robinhood-like, stark, data-forward),
rounded cards (radius 20) with hairline borders rgba(0,0,0,0.08), pill buttons (full-width,
height 56, black or teal). Real UI elements as visuals (subscription cards with real brand
logo tiles), NOT illustrations, mascots, 3D, gradients or stock art. Generous whitespace.
iPhone 15 Pro portrait frame, status bar 9:41, safe areas respected. English copy, exactly as given.

Sample data: hourly rate $15/h. Netflix $15.49/mo = 1h 02m. Spotify $11.99/mo = 48m.
ChatGPT Plus $20/mo = 1h 20m. iCloud+ $2.99/mo = 12m. Total $50.47/mo = 3h 22m of work
every month = 40 hours a year ("a full work week").

Screens (one image each, 1179x2556):
01-welcome: thin 5-dot progress at top. Hero: a single subscription card (Netflix logo tile,
  "Netflix", "$15.49/mo") with an arrow/transform into a big number "1h 02m" + caption
  "of your work". Headline "See what subscriptions really cost you." Sub: "Drip turns every
  price into the hours you work to pay for it." CTA black pill "Get started".
02-pick: title "Which ones do you pay for?" sub "Tap all that apply — you can edit later."
  3-column grid of rounded logo tiles (Netflix, Spotify, YouTube Premium, ChatGPT Plus,
  iCloud+, Amazon Prime, Disney+, Apple Music, Notion, Adobe CC, Microsoft 365, Duolingo),
  4 selected with teal check badge + teal 2px border. Sticky bottom: "4 selected · $50.47/mo"
  and teal pill "Continue". Small "+ Add another" text link.
03-income: title "What do you earn a month?" sub "We use it only to turn prices into hours.
  It never leaves your phone." Huge centered number input "$ 2,600" with currency chip "USD ▾".
  Under it live preview chip "= $15.00 per hour". Numeric keypad visible. CTA "Continue",
  text link "Skip for now".
04-reveal (the aha): small caption "EVERY MONTH YOU WORK". Giant number "3h 22m" (teal).
  Caption "just to pay for 4 subscriptions". Card: "That's 40 hours a year — a full work week."
  List rows with logo tile, name, price, hours right-aligned (ChatGPT Plus 1h 20m, Netflix
  1h 02m, Spotify 48m, iCloud+ 12m). CTA "Show me how to cut it".
05-reminders: icon-free; a mock iOS notification banner card at top ("Drip · now —
  Netflix renews tomorrow · $15.49 — that's 1h 02m of your work"). Title "Never get charged
  by surprise." Sub "We'll remind you before renewals and before free trials end." CTA
  "Turn on reminders", text link "Not now".
06-paywall: top-right small "Restore". Headline "Start your 3-day free trial". Personal line
  in teal tint pill: "Drip costs you 10 min of work a month". Vertical trial timeline with
  3 nodes connected by a line: "Today — Full access to everything" (teal filled node),
  "Day 2 — We'll remind you before the trial ends" (bell), "Day 3 — Your plan starts. Cancel
  anytime before." Plan cards: selected "Yearly · $30/year · just $2.50/mo" with "SAVE 50%"
  badge, teal border; unselected "Monthly · $5/month". Above CTA: green check "No payment
  due now". CTA teal pill "Start my free trial". Fine print: "3 days free, then $30/year.
  Auto-renews until cancelled." Footer links "Terms · Privacy".
