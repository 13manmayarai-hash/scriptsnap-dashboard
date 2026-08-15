# ScriptSnap — Razorpay Payment Integration Handoff

## Who's asking
Rajiv, works entirely from an Android phone (no local dev environment), using
GitHub mobile web + Claude Code cloud sessions for all development. He is
frustrated — a previous chat-based Claude session made ~19 unverified pushes
to production trying to fix this, guessing from screenshots instead of real
logs. **Do not repeat that pattern.** Test with real tool output before
telling him something is fixed.

## Project
- **Repo:** https://github.com/13manmayarai-hash/scriptsnap-dashboard (branch `main`)
- **Stack:** Next.js 14.2.35 (App Router) + Supabase (auth + Postgres) + Razorpay + Anthropic API
- **Host:** Vercel, project `scriptsnap-dashboard`, team `13manmayarai-3872`
  (Vercel project ID: `prj_rWPNwsF3Uo7SewCg6rQelORwXExI`,
  team ID: `team_kBH7WDS0RoW4u9WtdLRWGjYv`)
- **Production URL pattern:** `https://scriptsnap-dashboard-git-main-13manmayarai-3872s-projects.vercel.app`
- Latest commit as of handoff: `e5042b8`

## What ScriptSnap is
A YouTube Shorts script generator SaaS for the @technosaze channel. Free/Basic
(₹10/mo)/Pro (₹25/mo) tiers. Free tier and script generation via Anthropic API
are working. **The Razorpay payment flow is the only broken piece.**

## THE ACTUAL BUG — reproduce this first
1. User is on `/pricing`, logged in (confirmed via dashboard working).
2. User clicks "Upgrade to Basic" (or Pro).
3. **Expected:** Razorpay checkout modal opens.
4. **Actual:** Nothing happens / payment page does not open. No modal, no visible error on screen.

This has gone through many iterations already (see "Already tried" below).
**We do not have confirmed root cause** — every previous fix was pushed
without seeing real browser console output or real Vercel logs, because the
chat-based Claude session's Vercel MCP connector returned 403 Forbidden on
`get_runtime_logs`, `get_runtime_errors`, and `list_deployments`, despite
`list_projects` working. If you have working Vercel CLI/API access, use it —
don't repeat the blind-guessing pattern.

## First steps (do these before changing any code)
1. `git clone` the repo, `npm install`, `npm run build` locally to confirm current state actually compiles (it did as of `e5042b8`).
2. Get **real browser console output**: run the app (or ask Rajiv to open
   Chrome DevTools on the live Vercel URL), navigate to `/pricing` while
   logged in, click "Upgrade to Basic", and capture the actual console
   output/network tab. The `RazorpayButton` component already has
   `console.error` calls on failure paths — check if `/api/razorpay/checkout`
   is even being called, and what status code comes back.
3. Pull real Vercel logs if you have CLI access: `vercel logs <deployment-url>`
   or check the Vercel dashboard's Function Logs for `/api/razorpay/checkout`
   directly — do not assume, verify.
4. Check Supabase: confirm the `users` table actually has the
   `subscription_tier`, `razorpay_payment_id`, `razorpay_order_id`,
   `next_billing_date` columns (migration SQL is at
   `lib/database/migrations/add_subscription_fields.sql` — **it is unconfirmed
   whether this was ever actually run against the live Supabase project**).

## Key files
- `lib/components/RazorpayButton.tsx` — client component, calls
  `/api/razorpay/checkout`, loads the Razorpay checkout.js script, opens the
  modal, then calls `/api/razorpay/verify` on payment success.
- `app/api/razorpay/checkout/route.ts` — creates a Razorpay order server-side.
  Requires `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` env vars.
  Gets the user via `createServerClient` + `next/headers cookies()`. Returns
  401 if `supabase.auth.getUser()` finds no user.
- `app/api/razorpay/verify/route.ts` — verifies the Razorpay signature via
  HMAC SHA256, then updates `subscription_tier` on the `users` row.
- `app/api/webhooks/razorpay/route.ts` — async webhook handler (not yet
  configured in the Razorpay dashboard as far as we know — unverified).
- `app/pricing/page.tsx` — renders three tiers; Free links to `/auth/signup`,
  Basic/Pro render `<RazorpayButton tier={...} tierName={...} />`.
- `middleware.ts` — **just added, unverified in production.** Refreshes the
  Supabase session on every request via `supabase.auth.getUser()` in
  middleware. This is a standard requirement for Next.js App Router +
  `@supabase/ssr` that was missing until this commit. It may or may not be
  the actual root cause of the button doing nothing — treat as an unverified
  hypothesis, not a confirmed fix.
- `lib/supabase/client.ts` — browser client via `createBrowserClient`.
- `app/auth/login/page.tsx` — calls `supabase.auth.signInWithPassword`, then
  `router.push('/dashboard')` (client-side nav, not a full reload).
- `app/auth/callback/route.ts` — OAuth/magic-link callback, exchanges code
  for session server-side.

## Environment variables (must exist in Vercel → Settings → Environment Variables)
Confirmed present as of last check (user added them to Production + Preview + Development):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — user confirmed added
- `RAZORPAY_KEY_SECRET` — user confirmed added
- `ANTHROPIC_API_KEY`

**Verify these are still correct/not typo'd** — this was never independently
confirmed by inspecting Vercel directly (only by the user's screenshot of the
"all checkboxes" env var form, not the actual key values).

## Already tried (do not blindly repeat these)
1. Installed missing `razorpay` npm package (was causing build failure) — done, confirmed in `package.json`.
2. Installed missing `@anthropic-ai/sdk` (separate build failure) — done.
3. Fixed multiple template-literal/escaped-backtick syntax errors in `app/api/generate-script/route.ts` — done, build passes.
4. Fixed a TypeScript error: `tier` prop needed `as 'basic' | 'pro'` cast in `app/pricing/page.tsx` — done.
5. Moved `new Razorpay(...)` initialization from module scope into the route
   handler (was crashing the build because env vars aren't available at build
   time, only at request time) — done, for both checkout and the earlier
   webhook route's Supabase client.
6. Wired `RazorpayButton` into `app/pricing/page.tsx` (it was previously just
   a `<Link href="/dashboard">`, which is why early tests "worked" but never
   opened Razorpay — the button wasn't even calling the payment API at all).
7. Added a `needsLogin` state to show "Log In to Upgrade" on 401 — **this
   got stuck permanently true and never reset after login; removed it.**
8. Simplified to: on 401, just `router.push('/auth/login')` directly.
9. Added console.log instrumentation throughout the payment flow (still in
   the code as of `06441ec`, may have been overwritten in `e5042b8` — check).
10. **Just added:** `middleware.ts` for Supabase session refresh (commit `e5042b8`) — **unverified, this is the current unproven hypothesis.**

## Known unknowns / things to independently verify, not assume
- Is `/api/razorpay/checkout` actually being hit when the button is clicked,
  or is the click handler failing silently before the fetch call?
- Does the Razorpay account have live-mode keys activated, or are they still
  in a state requiring KYC/activation on Razorpay's side? (Never checked —
  worth ruling out.)
- Was the SQL migration in `lib/database/migrations/add_subscription_fields.sql`
  ever actually executed against the live Supabase database?
- Is there a Content Security Policy or `next.config.js` setting blocking the
  `https://checkout.razorpay.com/v1/checkout.js` script from loading?
- `next.config.js` earlier logged a warning: `Invalid next.config.js options
  detected: Unrecognized key(s) in object: 'api'` — non-fatal but worth
  checking there isn't a leftover `api` config block causing route confusion.

## What "done" looks like
1. Logged-in user on `/pricing` clicks "Upgrade to Basic" → Razorpay modal
   opens with ₹10 INR order.
2. Test card `4111 1111 1111 1111`, any future expiry, CVV `123` → payment
   succeeds.
3. Redirects to `/dashboard?payment=success`.
4. `users.subscription_tier` in Supabase is updated to `basic`.
5. Confirmed via **actual Vercel function logs or real browser network tab**
   — not by pushing a commit and asking the user to click a button again.
