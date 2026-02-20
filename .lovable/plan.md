
# Root Cause: Name Entry Step Never Appears

## The Actual Problem

The name entry step in `OTPModal.tsx` exists and is correctly coded. It only shows when `data?.isNewUser === true` is returned from the `verify-otp` edge function. The edge function sets `isNewUser = true` **only** when `supabase.auth.admin.createUser()` succeeds (i.e., the user is brand new — never registered before).

The problem is: **once a phone number has been registered once (even in testing), `createUser` always returns a 422 "already registered" error, so `isNewUser` is always `false` and the name step is skipped forever for that phone number.**

This means:
- First time you sign up with a brand-new phone → name step shows ✅
- Every subsequent login (including test logins on the same phone) → name step never shows ❌
- Even if the user never entered their name → name step is skipped ❌

## Why It's Hard to Notice

If you're testing with the same phone number repeatedly, you never see the name step because you're no longer a "new user" from the server's perspective.

## The Correct Fix

The name step should appear not just for new auth users, but for **any user who hasn't set a name yet** (i.e., `profile.full_name` is null or empty). The `verify-otp` function already fetches the profile and returns it. We just need to use `profile.full_name` to decide whether to show the name step.

### Change 1: `supabase/functions/verify-otp/index.ts`

Return `isNewUser: true` if the user has no `full_name` set, regardless of whether the auth account is new:

```ts
// BEFORE:
return json({
  success: true,
  isNewUser,
  ...
});

// AFTER:
const needsName = !profile?.full_name || profile.full_name.trim() === '';
return json({
  success: true,
  isNewUser: isNewUser || needsName,  // Show name step if no name set
  needsName,
  ...
});
```

### Change 2: `src/components/gpt-commerce/OTPModal.tsx`

No change needed to the modal itself — it already correctly shows the name step when `data?.isNewUser` is `true`.

### Change 3: `src/features/gpt-commerce/hooks/useCheckoutFlow.ts`

The `handleOTPVerified(newUser: boolean)` function currently treats `newUser === true` as meaning "show empty address form (mode: 'new')". We need to separate this: a user who has an account but no name should still see their existing addresses.

Pass `needsName` separately from `isNewUser`:

```ts
// In OTPModal.tsx handleOtpVerify:
const newUser = data?.isNewUser ?? false;
const needsName = data?.needsName ?? false;
setIsNewUser(newUser);

if (newUser || needsName) {  // Show name step if either flag is true
  setPendingIsNewUser(newUser);  // Keep original isNewUser for address mode
  setStep('name');
} else {
  onVerified(false);
}
```

And when calling `onVerified` from `handleNameSubmit`, pass the correct `pendingIsNewUser` (whether it's a truly new user for address mode purposes).

## Summary of Changes

| File | Change |
|---|---|
| `supabase/functions/verify-otp/index.ts` | Return `isNewUser: true` if `profile.full_name` is empty/null, regardless of whether auth account is new. Also add `needsName` flag. |
| `src/components/gpt-commerce/OTPModal.tsx` | Use `needsName` flag to show name step for existing users without a name. Store a separate `pendingAddressMode` to pass correct mode to `onVerified`. |

Two small, precise changes. The name step will now appear whenever a user (new or returning) hasn't entered their name yet.
