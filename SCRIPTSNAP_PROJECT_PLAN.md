# ScriptSnap — Project Plan (Mission, Vision, Roadmap, Current Status)

**Owner:** Rajiv (@technosaze)
**Last reconciled:** August 15, 2026
**Companion doc:** `CLAUDE_CODE_HANDOFF.md` (the specific payment bug to fix first)

> Note: The original product spec (written earlier) specifies **Stripe** as
> the payment processor. That was superseded — **Stripe is not available in
> India**, so the project moved to **Razorpay**, with pricing in **₹ (INR)**
> instead of $. Everything below reflects the current, correct plan. Treat
> any mention of Stripe in old files as historical/outdated.

---

## 1. MISSION

Help small YouTube creators — starting with Rajiv's own @technosaze channel —
produce better Shorts scripts in minutes instead of hours, using AI that
understands their topic, context, and keywords, not a generic prompt.

## 2. VISION

ScriptSnap becomes the default script-generation layer for YouTube Shorts
creators in the 100–50K subscriber range: a tool that not only writes scripts
but eventually understands each creator's channel data well enough to suggest
what to make next.

## 3. TARGET CUSTOMER

- **Primary:** Small YouTubers, 100–50K subscribers, who post Shorts
  regularly and don't have a writer.
- **Secondary (future):** Small production companies / agencies managing
  multiple channels.
- **Acquisition channel:** @technosaze YouTube channel (~115K subscribers) —
  Rajiv's own audience is the initial funnel.

## 4. LAUNCH TIMELINE

- **MVP launch:** ASAP — originally targeted 2–4 weeks from spec approval (Aug 15, 2026)
- **First 20 paying users:** within 1 month of launch
- **Year 1 goal:** 100–1,000 users

---

## 5. MVP SCOPE

### In scope for launch (required to charge money)
- ✅ AI script generation (Anthropic API) — **working**
- ✅ Topic + Context + Keywords personalization — **working**
- ✅ Tone options: Meditative, Balanced, Energetic — **working**
- ✅ User authentication (email + Google OAuth via Supabase) — **working**
- ✅ Free tier + paid tiers — **working (free tier)**
- 🔴 **Razorpay payment integration — BROKEN, this is the current blocker**
- ⏳ Usage tracking / tier enforcement (limits per month) — **not yet enforced,
  UI shows a counter but backend enforcement is unconfirmed**

### Explicitly deferred (not MVP)
- ❌ YouTube OAuth / Analytics integration
- ❌ Auto-publish to YouTube
- ❌ Trending keywords engine
- ❌ Team collaboration
- ❌ Advanced analytics dashboard

**Why this scope:** users can get value (better scripts, saved time) and pay
for it without YouTube integration. That's a Phase 3 differentiator, not a
launch requirement.

---

## 6. PRICING (current, corrected to INR/Razorpay)

```
FREE
₹0/month — 5 scripts/month, basic personalization, all 3 tones

BASIC — ₹10/month
50 scripts/month, full AI personalization, context & keyword support,
export to PDF, script history, email support

PRO — ₹25/month
200 scripts/month, all Basic features, YouTube analytics (future),
trending keywords (future), priority support, API access
```

Flat monthly tiers were chosen over pay-as-you-go because flat pricing is
easier to understand and gives predictable revenue; usage-based billing was
considered and rejected (see original spec §3 for the tradeoff discussion).

---

## 7. TECHNICAL ARCHITECTURE (current, actual)

- **Frontend:** Next.js 14.2.35 (App Router) + Tailwind CSS
- **Backend:** Vercel Serverless Functions (Next.js API routes)
- **Database + Auth:** Supabase (Postgres + Supabase Auth, email + Google OAuth)
- **AI:** Anthropic API (`claude-3-5-sonnet-20241022` currently hardcoded in
  `app/api/generate-script/route.ts` — consider updating to a current model)
- **Payment:** **Razorpay** (not Stripe — India-only constraint)
- **Hosting/deploy:** GitHub → Vercel, auto-deploy on push to `main`
- **Dev environment:** Rajiv has **no local machine** — all development
  happens via GitHub's mobile web interface + Claude Code cloud sessions.
  Any workflow you set up must not assume a local terminal on Rajiv's end.

### Database schema (target — verify against actual live Supabase state)
```sql
users (
  id, email, subscription_tier default 'free',
  razorpay_payment_id, razorpay_order_id, razorpay_customer_id,
  next_billing_date, scripts_generated_month, created_at
)

subscriptions (
  id, user_id, tier, razorpay_order_id, razorpay_payment_id,
  razorpay_subscription_id, status, next_billing_date,
  created_at, updated_at
)

api_usage (
  id, user_id, date, scripts_generated, created_at
)
```
Migration file: `lib/database/migrations/add_subscription_fields.sql`.
**Unconfirmed whether this has actually been run against the live Supabase
project** — verify before assuming the columns exist.

### Error handling philosophy (from original spec, still valid)
- If Anthropic API is rate-limited → show "generating, high demand" message,
  don't crash.
- If Razorpay is down → don't block free-tier usage; log and retry rather
  than losing the transaction.
- Any API failure → log it (Sentry not yet wired up — see Phase 1 gaps below),
  return a helpful error to the user, never a blank crash.

---

## 8. FEATURE ROADMAP

### Phase 1 — MVP Launch (current phase, in progress)
1. 🔴 Razorpay payment integration — **broken, top priority, see handoff doc**
2. ⏳ Subscription tier enforcement (block generation past monthly limit)
3. ⏳ Usage tracking accuracy (the `api_usage` table exists in migration but
   is it actually being written to on each script generation?)

**Cannot launch/charge money until Phase 1 is fully working.**

### Phase 2 — User Engagement (after Phase 1)
1. Script library / saved scripts (UI exists at `/dashboard/library` —
   confirm it's reading real data, not a stub)
2. Script ratings
3. Export to PDF/text

### Phase 3 — YouTube Intelligence
1. YouTube OAuth integration
2. Basic analytics dashboard (last 30 days)
3. Trending keywords for the user's own channel

### Phase 4 — Advanced
1. Auto-publish to YouTube Shorts
2. A/B script testing (generate 3 versions, track which performs)
3. Team collaboration
4. Proactive AI suggestions based on channel data

---

## 9. QUALITY, MONITORING, ROLLBACK

- **No automated tests currently exist.** Original spec proposed Jest + RTL
  with an 80% coverage target — this was never implemented. Worth flagging
  to Rajiv as a gap, not silently skipping.
- **No Sentry or error monitoring currently wired up**, despite being in the
  original plan. `console.error` calls exist in the API routes but nothing
  aggregates or alerts on them.
- **Rollback plan:** Vercel's one-click "redeploy previous deployment" is the
  de facto rollback mechanism (no formal process beyond that yet).
- Manual QA has been the only testing method so far — and even that has been
  inconsistent (see handoff doc's list of unverified pushes).

**Recommendation for Claude Code:** don't add heavy test infrastructure
unprompted, but do verify things actually work (real logs, real console
output) before declaring a fix complete — that discipline gap is what caused
this handoff in the first place.

---

## 10. DATA & COMPLIANCE

- Scripts stored indefinitely (user-owned data).
- Payment data handled by Razorpay (ScriptSnap doesn't store card details).
- GDPR-style requirements from spec: privacy policy, TOS, user-initiated data
  deletion, data export as JSON — **status of these is unconfirmed; likely
  not yet built.** Not urgent for MVP launch but should be tracked.

---

## 11. SUCCESS METRICS

### Month 1
- 20 paying users, ≥50% sourced from @technosaze channel
- ₹2,000+ MRR (10 users × ₹10, roughly — scale with actual tier mix)
- <2% error rate on script generation
- <1 minute generation time

### Month 3
- 100 paying users
- YouTube analytics feature live (Phase 3)
- <1% error rate

### Year 1
- 500–1,000 users, meaningful MRR, first hire for support/dev

---

## 12. RISKS (from original spec, still relevant)

| Risk | Mitigation |
|---|---|
| Anthropic API rate limits | Queue/retry, show "high demand" message |
| Creator doesn't see value from free tier | Free tier is trial; Phase 3 YouTube integration is the real hook |
| Payment processing fails | Currently the active bug — see handoff doc |
| Wrong pricing | Survey users after Month 1, adjust Month 2 |
| Competitors | YouTube-data integration (Phase 3) is the differentiator, not the generator alone |

---

## 13. CURRENT STATE SUMMARY (as of this handoff)

**Working:**
- Script generation end-to-end (Anthropic API)
- Auth (signup/login via Supabase)
- Dashboard UI, pricing page UI

**Broken / blocking launch:**
- Razorpay payment flow (see `CLAUDE_CODE_HANDOFF.md` for full detail —
  clicking "Upgrade" does not open the payment modal, root cause unconfirmed)

**Unverified — check before assuming either way:**
- Whether the subscription DB migration has actually run
- Whether tier limits are enforced anywhere in the generate-script flow
- Whether the Razorpay account itself is fully activated for live payments

**Not started:**
- Phase 2, 3, 4 features
- Automated testing
- Error monitoring (Sentry)
- Privacy policy / TOS / GDPR data export

---

## 14. WHAT "DONE WITH MVP" LOOKS LIKE

A user can: sign up → generate free scripts → hit the 5/month limit → click
Upgrade → pay via Razorpay → get bumped to Basic/Pro → generate more scripts
within the new limit → all of this confirmed via real logs, not assumption.

That's the finish line for Phase 1. Everything in Phase 2+ is genuinely
next, not urgent.
