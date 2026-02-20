
## Root Cause

`supabase.auth.admin.generateLink({ type: "magiclink" })` returns:
```
properties: {
  action_link: "...",
  hashed_token: "...",   ← this is what we need
  email_otp: "...",
  verification_type: "magiclink"
}
```

It does NOT return `access_token` or `refresh_token`. Those only exist when the link is actually visited (clicked) in a browser. The current code looks for `props.access_token` which is always `undefined`, so the function always fails.

## The Fix

After getting the `hashed_token` from `generateLink`, make a direct `fetch` POST call to the Supabase `/auth/v1/verify` endpoint with that token. This is equivalent to "clicking the magic link" server-side and returns a real session with `access_token` and `refresh_token`.

```
Step 4 (new):
  - Take hashed_token from generateLink response
  - POST to: ${SUPABASE_URL}/auth/v1/verify
    body: { token_hash: hashed_token, type: "magiclink" }
    headers: { apikey: SUPABASE_ANON_KEY }
  - This returns: { access_token, refresh_token, token_type, expires_in, user }
```

## Files to Change

### `supabase/functions/verify-otp/index.ts` — Targeted Fix

Only one block changes: step 4. Replace the current broken token extraction logic with a fetch call to the verify endpoint:

**Current (broken):**
```typescript
const props = linkData.properties;
const access_token = props?.access_token;   // always undefined!
const refresh_token = props?.refresh_token; // always undefined!

if (!access_token || !refresh_token) {
  console.error("No tokens in generateLink response:", ...);
  return json({ error: "Failed to extract session tokens" }, 500);
}
```

**Fixed:**
```typescript
const hashedToken = linkData.properties?.hashed_token;
if (!hashedToken) {
  console.error("No hashed_token in generateLink response");
  return json({ error: "Failed to generate session link" }, 500);
}

// Exchange the hashed token for a real session by calling the verify endpoint
const verifyResp = await fetch(
  `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
    },
    body: JSON.stringify({ token_hash: hashedToken, type: "magiclink" }),
  }
);

const sessionData = await verifyResp.json();

if (!verifyResp.ok || !sessionData.access_token) {
  console.error("Token exchange failed:", JSON.stringify(sessionData));
  return json({ error: "Failed to create session" }, 500);
}

const access_token = sessionData.access_token;
const refresh_token = sessionData.refresh_token;
```

This is the only change needed. The rest of the function (OTP lookup, mark used, find/create user, profile upsert, return shape) is all correct.

## Why This Works

The Supabase `/auth/v1/verify` endpoint is the same endpoint that magic link emails point to. It accepts a `token_hash` and `type`, verifies it, and returns a full session object. By calling it server-side we complete the "clicking the magic link" step programmatically and get real, valid tokens to return to the frontend.

No database changes are needed. No frontend changes are needed.
