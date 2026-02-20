
# Fix the verify-otp Edge Function (Multiple Issues)

## Problems Identified

After direct testing and log inspection, there are 4 distinct bugs:

### Bug 1 - Deployed Function is a Stale Version
The live deployed `verify-otp` is trying to call `supabase.auth.admin.createUser()` with an email (a previous build), causing `AuthApiError: A user with this email address has already been registered`. The file in the codebase does NOT match what is deployed.

### Bug 2 - Custom JWT Cannot Be Used with Supabase Session
The current `verify-otp` code mints a custom JWT using `djwt` and returns it. The frontend then calls `supabase.auth.setSession({ access_token, refresh_token: null })`. Supabase's `setSession()` requires a valid `refresh_token` — passing `null` silently fails, so the user is never actually logged in despite OTP being verified.

### Bug 3 - The `profiles` Table Cannot Be Inserted Without an Auth User
The `profiles.id` column has no default value and is expected to match an `auth.users` UUID. Inserting a profile with just `{ phone }` (no id) fails silently. Creating a real Supabase auth user first solves this — the auth user's UUID becomes the profile's `id`.

### Bug 4 - OTP Lookup Times Out Between Function Calls
The fresh OTP code was already expired by the time verify was called in testing. This is partly because the deployed function is the stale version and doesn't even reach the DB lookup — it crashes earlier on `createUser`.

---

## The Fix

### Strategy
Replace the custom JWT approach with the proper Supabase Admin API flow:

1. Verify OTP from `otp_codes` table (unchanged, this works)
2. Mark OTP as used (unchanged, this works)
3. Use `supabase.auth.admin.createUser()` with `phone` + auto-generated email to create/find the Supabase auth user
4. Use `supabase.auth.admin.generateLink({ type: 'magiclink' })` to get a real session pair (access_token + refresh_token)
5. Upsert the `profiles` row with the real auth user UUID as `id`
6. Return the real session tokens so `setSessionFromOTP` works properly

### File 1: `supabase/functions/verify-otp/index.ts` (Full Rewrite)

The key logic change:

```
text
OLD (broken):
  - mint custom JWT with djwt
  - return refresh_token: null
  - insert profile without id

NEW (fixed):
  - find or create auth user via admin.createUser (with phone-derived email)
  - generate real session via admin.generateLink('magiclink')
  - upsert profile with real auth UUID as id  
  - return { access_token, refresh_token } both valid
```

Specifically:
- Remove `djwt` import entirely (it's what causes the deploy to pull a different compiled version)
- Use `admin.listUsers()` pattern to find existing user by phone metadata, OR use a deterministic phone-based email like `{phone}@phone.flowcart.app` as the lookup key
- Use `admin.createUser({ email, phone, email_confirm: true, phone_confirm: true })` — if user exists (422 error), call `admin.listUsers()` to get their UUID
- Call `admin.generateLink({ type: 'magiclink', email })` → extract `access_token` and `refresh_token` from the returned link's hash parameters
- Upsert the profile: `profiles.upsert({ id: authUserId, phone })`

### File 2: `src/contexts/AuthContext.tsx` (Minor Fix)

The `setSessionFromOTP` function signature says it takes `{ access_token, refresh_token }` — this is already correct. Once verify-otp returns a real refresh_token, this will work automatically. No change needed here IF the backend returns proper tokens.

However, the interface currently declares `refresh_token: string` but the old code returned `null`. We need to make sure the type is compatible. Small update to accept `refresh_token: string | null` safely.

---

## Files to Change

1. **`supabase/functions/verify-otp/index.ts`** — Full rewrite:
   - Remove `djwt` dependency
   - Use Supabase Admin API to find/create real auth users
   - Return real `access_token` + `refresh_token` from `admin.generateLink`
   - Upsert `profiles` with proper auth UUID

2. **`src/contexts/AuthContext.tsx`** — Small fix:
   - Update `setSessionFromOTP` to handle `refresh_token: string | null` gracefully (use empty string fallback if null, since `setSession` needs a string)

---

## What This Fixes End-to-End

```
text
User enters phone → send-otp (already works, sends SMS)
    ↓
User enters OTP code → verify-otp (FIXED)
    ↓
verify-otp:
  1. Looks up valid OTP in otp_codes ✓
  2. Marks it used ✓  
  3. Finds/creates real Supabase auth user ← FIXED
  4. Generates real session tokens ← FIXED
  5. Upserts profile with correct UUID ← FIXED
  6. Returns { access_token, refresh_token } ← FIXED
    ↓
Frontend setSessionFromOTP({ access_token, refresh_token }) ← Works once tokens are real
    ↓
User is logged in, profile loads, addresses/orders load from DB ✓
```

No database schema changes are needed — the existing tables are correct.
