# ScriptSnap — Handoff (historical: Razorpay payment bug, now resolved)

**Status: RESOLVED.** This document originally described a live-blocking bug
where clicking "Upgrade" on `/pricing` did nothing. That bug — and several
others found while chasing it — has been fixed and verified live. Kept here
as a record of the root causes, since the debugging trail is useful context
for anyone touching auth or payments in this codebase again.

## Root causes found (in the order they were actually the problem)

1. **`@supabase/ssr` was pinned to `^0.0.10`**, a pre-1.0 release whose cookie
   adapter only supported the old `get`/`set`/`remove` shape. Every server
   client in this repo was already written against the modern `getAll`/
   `setAll` interface — against `0.0.10` that code path was silently never
   invoked, so the server could never read or write a session cookie at all.
   This was the actual root cause of Google OAuth failing unconditionally
   (`AuthPKCECodeVerifierMissingError` on every attempt) and of
   `/api/razorpay/checkout` always seeing "no user" regardless of login
   state. **Fixed** by upgrading to `@supabase/ssr@^0.12.4` and
   `@supabase/supabase-js@^2.112.3`.
2. **`NEXT_PUBLIC_RAZORPAY_KEY_ID` was a server-only var wearing a
   client-only prefix.** Next.js inlines every `NEXT_PUBLIC_*` reference at
   build time across the whole compilation, so a build that ran before the
   var was set in Vercel baked in `undefined` permanently — adding the var
   afterward did nothing until a fresh build ran. **Fixed** by renaming to
   plain `RAZORPAY_KEY_ID`, read fresh per request like every other secret.
3. **No viewport meta tag anywhere in the app** — mobile browsers fell back
   to a legacy ~980px virtual viewport and optically scaled the page down,
   so every Tailwind `md:`/`sm:` breakpoint was always "desktop" on a real
   phone. **Fixed** via a standard Next.js 14 `viewport` export in
   `app/layout.tsx`.
4. **Razorpay webhook verified against the wrong secret** (`RAZORPAY_KEY_SECRET`
   instead of a dedicated webhook secret) — real webhook deliveries always
   failed HMAC verification. **Fixed** by reading `RAZORPAY_WEBHOOK_SECRET`.
5. **Tier could be spoofed at `/api/razorpay/verify`** — it trusted a
   client-supplied `tier` field after only checking the payment signature.
   **Fixed**: tier is now read server-side from the Razorpay order's own
   `notes.tier` (set authoritatively at order-creation time), the same
   source of truth the webhook path already used correctly.
6. **`public.users` had RLS enabled with zero policies** — silently
   deny-all, so a paying user's tier upgrade would match 0 rows and never
   persist. **Fixed** via an ownership-scoped SELECT/UPDATE policy matching
   the pattern already used on `scripts`/`script_ratings`.
7. Several smaller bugs fixed alongside these: an uncaught exception inside
   `RazorpayButton`'s `script.onload` that left the button stuck on
   "Processing…" forever with no visible error; the OAuth callback route
   falling through to a success-looking redirect when neither `code` nor
   `error` was present in the query string; the login page never rendering
   the `error` query param even when the server correctly set one; an
   open-redirect via a leading backslash in `getSafeRedirect()`; and
   `tailwind.config.js` missing `./lib/**` from its `content` array, which
   silently purged classes used only in `lib/components/*`.

## Current state (verified live)

- Google sign-in works end to end.
- Clicking "Upgrade" opens the Razorpay modal, a test/real payment
  completes, `users.subscription_tier` updates, and quota enforcement
  (`increment_script_usage` RPC, atomic check-and-increment) is live.
- Mobile rendering respects the actual viewport.

## Still open (not this bug, tracked separately)

- Confirm the Razorpay account is fully activated for **live** (not test)
  mode — this is a manual check in the Razorpay dashboard, not something
  fixable from the repo.
- No error monitoring (Sentry) wired up yet.
- No automated test suite.

See `SCRIPTSNAP_PROJECT_PLAN.md` for the current overall project status.
