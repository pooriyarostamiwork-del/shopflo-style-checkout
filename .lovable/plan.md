
# Root Cause: `handleOTPVerified` Always Injects Shipping UI, Even for Plain Sign-In

## What Is Actually Happening

The `addressShipping` component appears without prompting because `handleOTPVerified` in `useCheckoutFlow.ts` **unconditionally injects an `addressShipping` message** and sets `agenticState.step = 'address-confirmation'` every time OTP verification completes — regardless of whether the user was signing in for checkout or just logging in to their account.

This means: whenever an authenticated user signs in from the login button (top-left "ورود / ثبت‌نام") or the name-entry step completes, the `handleOTPVerified(false)` call fires, which pushes an `addressShipping` message into the active basket's chat and transitions the agentic state into the checkout flow — **even if the user hasn't clicked any checkout button**.

### The Two Valid Paths That Call `handleOTPVerified`

| Path | Should Show Shipping? | Current Behavior |
|---|---|---|
| User clicks "ورود / ثبت‌نام" → OTP → verified | ❌ No | ✅ Injects `addressShipping` — **BUG** |
| User is in checkout → clicks "✅ تأیید می‌کنم" quick reply → OTP required → verified | ✅ Yes | ✅ Injects `addressShipping` — correct |

### Why the Previous Fixes Didn't Solve It

All previous fixes addressed what happens **after** the `addressShipping` message is already in memory (filtering on basket switch, localStorage, DB). None of them prevented the message from being **incorrectly injected in the first place** when the user just wants to sign in.

---

## The Fix: Add a `context` Parameter to `onVerified` / `handleOTPVerified`

### Change 1: `GPTCommerceShell.tsx` — Pass checkout context to OTPModal

The `showOTPModal` is triggered from two places:
1. `handleCheckoutFlow` → `setShowOTPModal(true)` when user clicks confirm-cart without OTP
2. `handleSignInClick` → `setShowOTPModal(true)` when user clicks login button

We need to distinguish these. Add an `otpModalContext` state:

```ts
// New state in GPTCommerceShell.tsx
const [otpModalContext, setOtpModalContext] = useState<'checkout' | 'login'>('login');
```

Then pass a wrapped `onVerified` to `OTPModal`:
```ts
<OTPModal
  isOpen={showOTPModal}
  onClose={() => setShowOTPModal(false)}
  onVerified={(isNewUser) => {
    if (otpModalContext === 'checkout') {
      handleOTPVerified(isNewUser);
    } else {
      // Plain login — just close the modal, no checkout injection
      setShowOTPModal(false);
    }
  }}
/>
```

And update the two callers:
```ts
// In useCheckoutFlow.ts handleQuickReply when !isOTPVerified:
// (called via setShowOTPModal from GPTCommerceShell — needs context)
```

Actually, the cleaner approach: pass `context` down through the existing call chain:
- `handleSignInClick` → sets `otpModalContext('login')` then `setShowOTPModal(true)`
- `useCheckoutFlow.setShowOTPModal` calls → set `otpModalContext('checkout')` first

### Simpler Implementation: Pass `onVerifiedWithContext` directly

In `GPTCommerceShell.tsx`, wrap the OTPModal's `onVerified`:

```ts
// Replace:
<OTPModal onVerified={handleOTPVerified} ... />

// With:
const [otpContext, setOtpContext] = useState<'checkout' | 'login'>('login');

const handleOTPModalVerified = useCallback((isNewUser: boolean) => {
  if (otpContext === 'checkout') {
    handleOTPVerified(isNewUser);  // Inject addressShipping, set step
  } else {
    // Just close — user wanted to sign in, not checkout
    setShowOTPModal(false);
  }
}, [otpContext, handleOTPVerified]);
```

Then update the two `setShowOTPModal(true)` call sites:

**In `GPTCommerceShell.tsx` — `handleSignInClick`:**
```ts
const handleSignInClick = useCallback(() => {
  if (isAuthenticated) {
    updateCurrentBasket(s => ({ ...s, hasStartedChat: true }));
  } else {
    setOtpContext('login');      // ← Mark as plain login
    setShowOTPModal(true);
  }
}, [isAuthenticated, updateCurrentBasket]);
```

**In `useCheckoutFlow.ts` — where `setShowOTPModal(true)` is called from `handleQuickReply` and `handleSendMessage` shortcuts:**

The `setShowOTPModal` is passed in as a prop — we need a companion `setOtpContext` prop, or a combined helper.

Cleanest solution: replace `setShowOTPModal` prop with a `showOTPForCheckout` callback and a `showOTPForLogin` callback — or simply add `setOtpContext` as an additional prop to `useCheckoutFlow`.

### Files to Change

| File | Change |
|---|---|
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Add `otpContext` state (`'checkout'` or `'login'`). Wrap OTPModal's `onVerified` to only call `handleOTPVerified` when context is `'checkout'`. Set context to `'login'` in `handleSignInClick`. Pass `setOtpContext` (or a `showOTPForCheckout` helper) to `useCheckoutFlow`. |
| `src/features/gpt-commerce/hooks/useCheckoutFlow.ts` | Accept `setOtpContext` (or use a `openCheckoutOTP` callback) and set context to `'checkout'` before calling `setShowOTPModal(true)`. |
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | Same — when `setShowOTPModal(true)` is triggered from agent message flow (buy-and-send, direct-payment shortcuts), set context to `'checkout'` first. |

### Why This Is The Only Correct Fix

The root cause is architectural: `handleOTPVerified` was designed as a single handler for all OTP completions, but it has checkout-specific side effects (inject `addressShipping`, set step). These side effects must only fire when the OTP was triggered by a checkout action.

All previous fixes were downstream patches (filtering stale messages). This fix prevents the message from being incorrectly injected at the source.

### What Changes in User Experience

- **Login via "ورود / ثبت‌نام" button**: OTP completes → user is signed in → chat continues normally. No shipping component appears.
- **Login via checkout flow** (user clicks ✅ to confirm cart without being signed in): OTP completes → shipping component appears as expected. ✅
- **Switching baskets**: Already fixed in the previous session — the filter remains as a safety net.
