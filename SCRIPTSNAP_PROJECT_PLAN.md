# ScriptSnap — Project Plan (Mission, Vision, Roadmap, Current Status)

**Owner:** Rajiv (@technosaze)
**Last reconciled:** August 30, 2026
**Companion doc:** `CLAUDE_CODE_HANDOFF.md` (historical — the Razorpay
payment bug it was written for is resolved; kept as a root-cause record)

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
- ✅ AI script generation (Anthropic API, `claude-sonnet-5`) — **working**
- ✅ Topic + Context + Keywords personalization — **working**
- ✅ Tone options + custom tone presets — **working**
- ✅ User authentication (email + Google OAuth via Supabase) — **working**
- ✅ Free tier + paid tiers — **working**
- ✅ **Razorpay payment integration — working, verified live** (see
  `CLAUDE_CODE_HANDOFF.md` for the root causes that were fixed)
- ✅ Usage tracking / tier enforcement — **working**, enforced atomically via
  the `increment_script_usage` Postgres RPC (check-and-increment in one
  transaction, closes the race condition where two concurrent requests
  could both bypass the monthly limit)

### Since MVP: shipped ahead of the original phase order
- ✅ YouTube OAuth integration (Pro tier) — connect a channel, cached
  analytics summary feeds into script generation, trending-videos-in-your-
  category + Claude-extracted recurring topics surfaced on `/dashboard/ideas`
- ✅ Privacy Policy, Terms of Service, data export (JSON), account deletion
  (`/dashboard/settings`)
- ✅ Script library, ratings (thumbs up/down feeding tone/keyword
  performance stats on the dashboard), PDF export, calendar, categories

### Explicitly deferred (not MVP)
- ❌ Auto-publish to YouTube
- ❌ Team collaboration
- ❌ Advanced analytics dashboard beyond what shipped above

**Why this scope:** users can get value (better scripts, saved time) and pay
for it without YouTube integration — that was true at launch, and the
YouTube/analytics work above shipped as a fast-follow once the payment flow
was actually working.

---

## 6. PRICING (current, corrected to INR/Razorpay)

```
FREE
₹0/month — 5 scripts/month, basic personalization, all 3 tones

BASIC — ₹199/month
50 scripts/month, full AI personalization, context & keyword support,
export to PDF, script history, email support

PRO — ₹499/month
200 scripts/month, all Basic features, YouTube analytics (future),
trending keywords (future), priority support, API access
```

> Repriced from the original ₹10/₹25 flat tiers on Aug 15, 2026, after a
> unit-economics review: at ₹10/₹25, Basic and Pro were losing money on
> Anthropic API cost alone, before Razorpay fees or hosting were even
> counted. ₹199/₹499 covers real cost at ~85-90% gross margin on the AI line
> while staying well under comparable creator tools (VidIQ/TubeBuddy run
> ₹600-3,250/month). Treat these as a starting hypothesis to validate with
> real willingness-to-pay, not a final answer.

Flat monthly tiers were chosen over pay-as-you-go because flat pricing is
easier to understand and gives predictable revenue; usage-based billing was
considered and rejected (see original spec §3 for the tradeoff discussion).

---

## 7. TECHNICAL ARCHITECTURE (current, actual)

- **Frontend:** Next.js 14.2.35 (App Router) + Tailwind CSS
- **Backend:** Vercel Serverless Functions (Next.js API routes)
- **Database + Auth:** Supabase (Postgres + Supabase Auth, email + Google OAuth)
- **AI:** Anthropic API (`claude-sonnet-5` in `app/api/generate-script/route.ts`)
- **Payment:** **Razorpay** (not Stripe — India-only constraint) — working,
  verified live; tier is sourced server-side from the Razorpay order's own
  `notes.tier`, never trusted from client input
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) — `npm ci` / lint /
  build on every push and PR
- **Hosting/deploy:** GitHub → Vercel, auto-deploy on push to `main`
- **Dev environment:** Rajiv has **no local machine** — all development
  happens via GitHub's mobile web interface + Claude Code cloud sessions.
  Any workflow you set up must not assume a local terminal on Rajiv's end.

### Database schema (confirmed live, RLS-scoped ownership policies on every
user-owned table — `(select auth.uid()) = user_id`, or `= id` on `users`)
Core tables in active use: `users` (subscription_tier, last_reset_date,
scripts_generated_month), `scripts`, `script_ratings`, `ideas`,
`calendar_entries`, `tone_presets`, `categories`, `youtube_connections`.
`subscriptions` and `api_usage` from the original spec were never wired up —
confirmed dead, not referenced anywhere in the app code.

### Error handling philosophy (from original spec)
- If Anthropic API is rate-limited or fails → the atomic quota reservation
  is refunded so a failed generation doesn't cost the user a script; a
  readable error message is returned, not a blank crash.
- If Razorpay is down → doesn't block free-tier usage.
- **Sentry/error monitoring is still not wired up** — this is a real,
  outstanding gap (see §9, §13).

---

## 8. FEATURE ROADMAP

### Phase 1 — MVP Launch — ✅ DONE
1. ✅ Razorpay payment integration
2. ✅ Subscription tier enforcement (atomic RPC, blocks generation past
   monthly limit)
3. ✅ Usage tracking accuracy

### Phase 2 — User Engagement — ✅ DONE
1. ✅ Script library (`/dashboard/library`)
2. ✅ Script ratings, feeding tone/keyword performance stats
3. ✅ Export to PDF

### Phase 3 — YouTube Intelligence — ✅ DONE
1. ✅ YouTube OAuth integration (Pro tier, `/dashboard/settings`)
2. ✅ Channel analytics summary feeds into script generation prompt
3. ✅ Trending videos (by content category) + Claude-extracted recurring
   topics from the creator's own channel, surfaced on `/dashboard/ideas`

### Phase 4 — Advanced (not started)
1. Auto-publish to YouTube Shorts
2. A/B script testing (generate 3 versions, track which performs)
3. Team collaboration
4. Proactive AI suggestions based on channel data

---

## 9. QUALITY, MONITORING, ROLLBACK

- **No automated tests currently exist.** Original spec proposed Jest + RTL
  with an 80% coverage target — this was never implemented. Still a real gap.
- **No Sentry or error monitoring wired up.** `console.error` calls exist in
  the API routes but nothing aggregates or alerts on them. Requires the
  owner to create a Sentry account and provide a DSN before this can be
  wired up.
- **CI now exists**: `.github/workflows/ci.yml` runs `npm ci` / lint / build
  on every push and PR, catching build breaks before merge — this closes the
  "no CI gate" gap that used to let broken builds reach `main` unnoticed.
- **Rollback plan:** Vercel's one-click "redeploy previous deployment" is the
  de facto rollback mechanism (no formal process beyond that yet).

**Recommendation for Claude Code:** verify things actually work (real logs,
real tool output, direct DB queries) before declaring a fix complete —
several past bugs in this project were caused by fixes pushed on assumption
rather than verified evidence.

---

## 10. DATA & COMPLIANCE — ✅ DONE

- Scripts stored indefinitely (user-owned data), deleted via cascade on
  account deletion.
- Payment data handled by Razorpay (ScriptSnap doesn't store card details).
- ✅ Privacy Policy (`/privacy`) and Terms of Service (`/terms`) — AI-drafted
  from the app's actual data practices, **not a substitute for real legal
  review**; contains `[PLACEHOLDER]` brackets for business legal name/
  address, support contact, governing-law jurisdiction, and refund policy
  specifics that only the owner can fill in.
- ✅ User-initiated data export (JSON) and account deletion —
  `/dashboard/settings`, backed by `/api/account/export` and
  `/api/account/delete`.

---

## 11. SUCCESS METRICS

### Month 1
- 20 paying users, ≥50% sourced from @technosaze channel
- ₹2,000+ MRR (10 users × ₹199, roughly — scale with actual tier mix). Note:
  at the repriced ₹199/₹499 tiers this target is now cleared by ~10 Basic
  conversions instead of ~200 — worth revisiting whether ₹2,000 is still the
  right Month 1 bar now that unit price is ~20x higher, rather than treating
  it as untouched.
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
| Creator doesn't see value from free tier | Free tier is trial; YouTube analytics/trending (Phase 3, shipped) is the real hook |
| Payment processing fails | Resolved — see `CLAUDE_CODE_HANDOFF.md` for root causes |
| Wrong pricing | Survey users after Month 1, adjust Month 2 |
| Competitors | YouTube-data integration (shipped) is the differentiator, not the generator alone |

---

## 13. CURRENT STATE SUMMARY

**Working:**
- Script generation end-to-end (Anthropic API, current model)
- Auth (signup/login + Google OAuth via Supabase)
- Razorpay payment flow, tier enforcement, quota tracking
- YouTube channel connection, analytics-informed generation, trending/ideas
- Privacy policy, TOS, data export, account deletion
- CI (build/lint gate on every push and PR)

**Genuinely open gaps:**
- Confirm the Razorpay account is fully activated for **live** (not test)
  mode — manual check in the Razorpay dashboard.
- No error monitoring (Sentry) — needs the owner to create an account and
  provide a DSN.
- No automated test suite.
- Legal pages need real legal review before the `[PLACEHOLDER]` fields are
  filled in and the drafts are relied on as compliance-complete.

**Not started:**
- Phase 4 features (auto-publish, A/B script testing, team collaboration)

---

## 14. WHAT "DONE WITH MVP" LOOKS LIKE — ✅ REACHED

A user can: sign up → generate free scripts → hit the 5/month limit → click
Upgrade → pay via Razorpay → get bumped to Basic/Pro → generate more scripts
within the new limit. Confirmed live, not just by code inspection.

Phase 1–3 are done. What's left is Phase 4 (genuinely next, not urgent) plus
the open gaps in §13 above (Sentry, tests, live-Razorpay-activation check,
legal review) — none of which block the product from being used and paid
for today.
