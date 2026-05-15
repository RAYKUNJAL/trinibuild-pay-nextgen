# WeFetePass — Master Build Document
## Full Site Audit + Feature Roadmap
**Version:** 1.0
**Date:** May 15, 2026
**Platform:** WeFetePass — AI Ticketing & Event Platform for the Caribbean

---

## SECTION 1: CURRENT STATE AUDIT

### 1.1 Core Problem
The site has two distinct customer types — Party Promoters (B2B) and Party Goers (B2C) — but all copy and UX defaults to promoters. Party goers are nearly invisible across every page. A buyer landing on the homepage would be confused within seconds and bounce.

### 1.2 HOMEPAGE — Issues
- Headline "Sell the event. Design the flyer. Run the door." is 100% promoter language
- "WeFetePass is the black-and-gold command center for promoters..." is a feature dump
- "Explore Events" leads to an empty page — destroys trust
- CashConnect / API / fintech section on the consumer homepage — REMOVE

### 1.3 PROMOTERS PAGE — Issues
- Generic headline "The one-stop shop for party promotion..."
- Feature lists not benefits
- "Legal Onboarding" button — clinical, rename to "Apply to sell tickets"

### 1.4 COMPARE PAGE — Critical bugs to delete
- "Use named competitors only where public claims are available..." (developer note in prod)
- "MARKET FEE SIGNAL" (internal Notion header in prod)
- "AI feature 1" through "AI feature 6" placeholder labels

### 1.5 EVENTS / DISCOVER — Empty state
Replace "No events found. Try adjusting your search terms." with WhatsApp lead capture:
> "The fetes are coming. Drop your number and we'll WhatsApp you when the first events go live."

### 1.6 SUPPORT — Issues
- Placeholder phone `+1 (868) 555-TICK` — remove
- FAQ only buyer-focused, add promoter path

### 1.7 NAVIGATION
- No party goer journey
- Sign Up only routes to promoter demo
- Recommended:
  - Buyers: Find Events | How it works
  - Promoters: Sell Tickets | Promoter Tools | Pricing | Compare
  - Global: Support | Sign Up (with role selection)

---

## SECTION 2: COPY REWRITES (READY TO IMPLEMENT)

### Homepage Hero — Split for Both Audiences

**Promoter side:**
- Headline: "Your next event, fully loaded."
- Sub: "Tickets, flyers, VIP, door ops, and AI tools — all from one platform built for T&T."
- CTA: "Start selling →"

**Party Goer side:**
- Headline: "Find your next fete."
- Sub: "Browse events, pay by bank transfer, get your QR ticket. No stress."
- CTA: "Explore events →"

### Promoters Page Headline
"Stop juggling five WhatsApp chats and three apps. Run your whole event from here."

### Compare Page Headline
"Why WeFetePass costs more — and why promoters say it's worth it."

### Events Empty State
"First fetes dropping soon. Enter your number and we'll text you when tickets go live."

### Pricing Card Rewrite
"7.5% — everything included." Sub: "Flyers, hosted page, VIP codes, scanner team, AI agent, and bank-receipt ticketing. Compare what you'd pay for five separate tools."

### Legal Onboarding Button
"Apply to sell tickets"

---

## SECTION 3: NEW FEATURES TO BUILD

### 3.1 AI INTELLIGENCE LAYER
- 3.1.1 Predictive Event Intelligence — pace vs. promoter historical avg
- 3.1.2 AI Demand Forecasting — recommend price ranges (event type, venue, season)
- 3.1.3 Dynamic Pricing Engine — adjusts within promoter floor/ceiling
- 3.1.4 Promoter Readiness Score (0–100) — flyer, page, VIPs, payout info, scanners, social
- 3.1.5 AI Receipt Fraud Detection — Low/Medium/High/Auto-reject
- 3.1.6 Post-Event AI Debrief Report — attendance, revenue tiers, peak entry, recs

### 3.2 PARTY GOER EXPERIENCE
- 3.2.1 Digital Ticket Wallet — all QR tickets, past/upcoming, "My Fete Season"
- 3.2.2 WhatsApp-Native Ticket Delivery — QR via WhatsApp, no email needed
- 3.2.3 Group Ticketing — one buyer, multiple QRs, payment requests to crew
- 3.2.4 Party Goer Profile & Reputation — verified badge, fast-track at door
- 3.2.5 "I'm Going" Social Layer — friends going, "347 going" count
- 3.2.6 Waitlist System — WhatsApp notify when seats free up

### 3.3 PROMOTER TOOLS
- 3.3.1 Promoter CRM — own your crowd, segments, direct WhatsApp message
- 3.3.2 Affiliate / Street Team Tools — referral links, commissions, leaderboard
- 3.3.3 Event Series & Season Passes — Carnival 2027 bundles
- 3.3.4 Promoter Brand Page — permanent profile, follow button
- 3.3.5 Pre-Event Hype Tools — countdowns, drops, waitlist notify
- 3.3.6 Promoter-to-Venue Booking — venue profiles + booking requests

### 3.4 PAYMENT INFRASTRUCTURE
- 3.4.1 Real-Time Bank Feed Integration (Republic, Scotiabank, First Citizens)
- 3.4.2 Installment Payments — 2–3 installments, ticket locked until paid
- 3.4.3 WeFetePass Wallet / Credit System
- 3.4.4 Multi-Currency Foundation — TTD, BBD, JMD, GYD, USD

### 3.5 PLATFORM NETWORK EFFECTS
- 3.5.1 The Event Graph (proprietary data layer)
- 3.5.2 Brand & Sponsor Integrations (Digicel, Carib Beer, Angostura)
- 3.5.3 Promoter Trust Score (public)
- 3.5.4 CashConnect API Ecosystem (B2B, separate from consumer)

---

## SECTION 4: PHASE ROADMAP

### Phase 1 — Own T&T (0–3 months) — TODAY'S BUILD SCOPE
- Remove placeholder copy, MARKET FEE SIGNAL, developer instruction text
- Remove CashConnect B2B section from homepage
- Rewrite all copy per Section 2
- Fix party goer nav and Sign Up flow
- Add WhatsApp-based lead capture to Events empty state
- Digital ticket wallet
- WhatsApp-native ticket delivery
- Group ticketing (basic)
- Promoter Readiness Score
- Post-Event AI Debrief Report

### Phase 2 — Become Unmovable (3–9 months)
- Promoter CRM, Predictive Intelligence, Dynamic Pricing, Affiliate, Waitlist, Installments, Trust Scores, "I'm Going"

### Phase 3 — Own the Region (9–24 months)
- Bank Feed Integration, Multi-currency, Venue partnerships, Brand integrations, Series passes, CashConnect API, regional expansion

---

## SECTION 6: QUICK WINS (IMMEDIATE)
1. Remove "AI feature 1–6" labels on Compare page
2. Remove "MARKET FEE SIGNAL" header on Compare page
3. Remove the developer methodology instruction from Compare page
4. Remove entire CashConnect/API/enterprise section from homepage
5. Replace "Legal onboarding" with "Apply to sell tickets"
6. Replace Events empty state with WhatsApp lead capture
7. Fix/remove placeholder phone on Support page
8. Add party goer Sign Up route

---

## SECTION 7: THE 5 COMPETITIVE KILL SHOTS
1. Promoter CRM with audience ownership
2. Predictive event intelligence
3. WhatsApp-native ticket delivery + group buying
4. Direct bank feed integration
5. Promoter trust scores + buyer reputation
