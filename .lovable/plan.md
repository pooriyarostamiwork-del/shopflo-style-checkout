
# GPTCommerce UX & Architecture Fix Plan

## Issues Being Fixed (6 items)

---

## Issue 1 — OTP Modal: Dynamic Name Step for New Users

**Root cause:** `OTPModal` currently has only two steps: `phone` and `otp`. After OTP verification, it calls `onVerified(isNewUser)` and closes. There is no `name` step at all.

**Fix:** Add a third step `'name'` to `OTPModal`. The flow becomes:

```
phone → otp → [if isNewUser] name → onVerified(isNewUser)
              [if existing]  skip  → onVerified(false)
```

**Changes to `src/components/gpt-commerce/OTPModal.tsx`:**
- Add `'name'` to the `Step` type: `type Step = 'phone' | 'otp' | 'name'`
- Add `fullName` state: `const [fullName, setFullName] = useState('')`
- In `handleOtpVerify`: after successful verification, if `data.isNewUser === true`, set step to `'name'` instead of calling `onVerified()` immediately. Keep the session established.
- Add the `name` step UI: a warm welcome heading (e.g. "خوش اومدی! 🎉"), a subtitle ("اسمت رو وارد کن تا بهتر بشناسمت"), a text input for full name, and a submit button.
- On name submit: call `updateProfileName(fullName)` (already available from `AuthContext`), then call `onVerified(true)`. If name is blank, allow skip with a "بعداً تکمیل می‌کنم" link.
- The `useAuth()` import already exposes `updateProfileName`. Call it directly inside the modal rather than threading it through props.

**No changes needed to `OTPModal` props** — the `onVerified` contract stays the same.

---

## Issue 2 — Landing Header Button: Auth-Aware Greeting

**Root cause:** The "ورود / ثبت‌نام" button in `ChatLanding.tsx` is static — it never knows if the user is authenticated.

**Current state (line 178 of `ChatLanding.tsx`):**
```tsx
<button onClick={onSignIn} ...>
  <User className="w-4 h-4" />
  <span>ورود / ثبت‌نام</span>
</button>
```

**Fix:** `ChatLanding` needs to receive auth state as props:
- Add `isAuthenticated: boolean` and `userFirstName?: string` to `ChatLandingProps`
- When `isAuthenticated === true`, render: `😊 {firstName} جان خوش اومدی، ورود به فضای خرید`
- When `isAuthenticated === false`, render: existing `ورود / ثبت‌نام`

**Where to wire it:** In `GPTCommerceShell.tsx`, `handleSignInClick` is already passed as `onSignIn`. Pass `isAuthenticated` and `profile?.full_name?.split(' ')[0]` as new props to `ChatInterface` → `ChatLanding`.

**Chain of prop additions:**
1. `GPTCommerceShell` → `ChatInterface`: add `isAuthenticated` and `userFirstName`
2. `ChatInterface.tsx` → `ChatLanding`: pass them through
3. `ChatLanding`: use them in the button render

---

## Issue 3 — "Enter Chat Mode" CTA Should Open Chat, Not Account

**Root cause:** In `GPTCommerceShell.tsx` line 297–304, `handleSignInClick` does this:
```ts
if (isAuthenticated) {
  handleSectionChange('account'); // ← WRONG: navigates to account panel
  if (!hasStartedChat) updateCurrentBasket(s => ({ ...s, hasStartedChat: true }));
}
```

The intent was probably to redirect authenticated users to their account, but the actual desired behavior is: clicking the button should always open/continue the chat.

**Fix in `GPTCommerceShell.tsx`:**
```ts
const handleSignInClick = useCallback(() => {
  if (isAuthenticated) {
    // Just start chat — don't navigate to account
    updateCurrentBasket(s => ({ ...s, hasStartedChat: true }));
  } else {
    setShowOTPModal(true);
  }
}, [isAuthenticated, updateCurrentBasket]);
```

The basket is created lazily on first message send (already works via `handleSendMessage`). The user enters chat mode, and if they send a message a basket is created. This is exactly the right behavior.

---

## Issue 4 — Right Sidebar Default State Per Context

**Root cause:** In `GPTCommerceShell.tsx`:
- `isCartOpen` starts as `false` (line 41)
- `useEffect` sets it to `true` when `hasStartedChat` becomes true (line 116–118)
- But `handleSectionChange` sets it to `false` for account/orders/flowclub (line 241–245)

The problem: it starts closed on landing. It should start open in chat mode and closed in non-chat sections. The current behavior is the reverse.

**Fix:**
- The cart sidebar open/close logic in `GPTCommerceShell.tsx` needs to be inverted for landing:
  - In chat mode (`hasStartedChat === true`): default `isCartOpen` to `true`
  - In non-chat sections (account, orders): keep it closed

The existing `useEffect` on line 116–118 already handles the chat→open transition. The gap is the initial default. Change `useState(false)` to:
```ts
const [isCartOpen, setIsCartOpen] = useState(false); // stays false until hasStartedChat
```
This is already correct. The missing piece is: when the user switches FROM account/orders BACK to chat (via `handleSectionChange('active-cart')`), the cart should re-open. Fix `handleSectionChange`:

```ts
const handleSectionChange = useCallback((section: string) => {
  setActiveSection(section);
  if (section === 'account' || section === 'orders' || section === 'flowclub') {
    setIsCartOpen(false);
  } else if (section === 'active-cart' && hasStartedChat) {
    setIsCartOpen(true); // restore cart when returning to chat
  }
}, [hasStartedChat]);
```

---

## Issue 5.1 — Remove All Mock Data (Addresses, Names, Orders)

This is the biggest data consistency fix. The mock data permeates multiple files.

### 5.1a — `mockAddresses` in `useUserData.ts` (line 15)

**Current:**
```ts
return [...mockAddresses]; // ← fallback to mock if nothing in localStorage
```

**Fix:** For unauthenticated users, start with an **empty array**, not mock addresses:
```ts
return []; // fresh start — user must add their own addresses
```

Remove the `mockAddresses` import from `useUserData.ts`.

### 5.1b — `checkoutAddresses: [...mockAddresses]` in `useBasketState.ts` (line 48)

The `BasketState.checkoutAddresses` field is populated with `mockAddresses`. This field appears to be a legacy field (not actively used — `globalAddresses` from `useUserData` is the real source). Replace with an empty array:
```ts
checkoutAddresses: [], // was: [...mockAddresses]
```

Remove the `mockAddresses` import from `useBasketState.ts`.

### 5.1c — `defaultUserProfile` in `AccountPanel.tsx` (lines 32–36)

**Current:**
```ts
const defaultUserProfile: UserProfileData = {
  name: 'ایمان صادق‌زاده',
  phone: '۰۹۱۲۲۷۵۲۵۴۰',
  email: 'iman@example.com',
};
```

**Fix:** Replace with truly empty defaults:
```ts
const defaultUserProfile: UserProfileData = {
  name: '',
  phone: '',
  email: '',
};
```

The `AccountPanel` already handles the case where `userProfile` prop is passed (from real auth data in `GPTCommerceShell`). The `defaultUserProfile` is only the fallback when not authenticated — making it empty is correct.

### 5.1d — `mockOrders` fallback in `AccountPanel.tsx` (line 333)

**Current:**
```ts
const displayOrders = orders || mockOrders; // ← falls back to fake orders
```

**Fix:**
```ts
const displayOrders = orders || []; // show empty state for unauthenticated users
```

Remove the `mockOrders` import from `AccountPanel.tsx`.

### 5.1e — `handleTransferToCart` uses `mockProducts` in `GPTCommerceShell.tsx` (line 257)

```ts
const product = mockProducts.find(p => p.id === item.productId);
```

This is only relevant for saved items from the sidebar. Since products from DB have UUID-style IDs and `mockProducts` have `p1`, `p2` IDs, this lookup will simply return `undefined` for real DB products. The fix: remove `mockProducts.find()` and instead look up the product info from the saved item itself (the `SavedItem` already stores `name`, `price`, `image`):

```ts
// Build a minimal product from the saved item data
const product: Product = {
  id: item.productId,
  name: item.name,
  price: item.price,
  image: item.image,
  // fill minimal required fields
  merchant: merchants[0],
  rating: 4.0,
  fastDelivery: false,
  returnGuarantee: false,
  inStock: true,
};
```

Remove the `mockProducts` import from `GPTCommerceShell.tsx`.

### 5.1f — Storage version bump

After removing `mockAddresses` as the default, bump `CURRENT_VERSION` from `'3'` to `'4'` in `useBasketState.ts` to clear stale localStorage data (which may still have mock addresses embedded in basket states).

---

## Issue 5.2 — Consistency: Name in Orders Matches Real Profile

**Root cause:** The order `deliveryAddress.recipientName` is populated from `globalAddresses[0]?.fullAddress` in the checkout flow, which previously defaulted to mock data (`'ایمان صادق‌زاده'`). Once mock data is removed (5.1), this will automatically use the real authenticated user's data.

Additionally, in `useCheckoutFlow.ts` the `handlePaymentSelect` function saves the order with `delivery_address` from `currentBasketState.selectedAddressId`. This address now comes exclusively from `user_addresses` DB table for authenticated users, which always has the correct `recipient_name`. So fixing 5.1 directly resolves 5.2.

One remaining inconsistency: `handleAddNewAddress` in `useCheckoutFlow.ts` creates a `DeliveryAddress` with `recipientName: addr.recipientName || ''` which is correct — it never hardcodes names.

---

## Issue 6 — `useCartPersistence` Hook: DB Sync for Authenticated Users

This is a new hook: `src/features/gpt-commerce/hooks/useCartPersistence.ts`

**Behavior:**
- For **authenticated users**: sync the active basket's cart items to the `baskets` table in the database on every cart change (debounced). On mount, load baskets from DB.
- For **guest users**: rely on existing `localStorage` already handled by `useBasketState`.

**The `baskets` table already exists** in the database with the correct schema: `id`, `user_id`, `cart_items` (jsonb), `messages` (jsonb), `agentic_state` (jsonb), `selected_address_id`, `shipping_selections`, `status`, `title`, `last_activity`.

**Hook design:**
```typescript
// src/features/gpt-commerce/hooks/useCartPersistence.ts

export const useCartPersistence = ({
  isAuthenticated,
  activeBasketId,
  currentState,
  updateCurrentBasket,
  baskets,
  basketStates,
  setBaskets,
  setActiveBasketId,
  setBasketStates,
}: UseCartPersistenceProps) => {
  // 1. On auth change: load baskets from DB for this user
  // 2. On cart change (debounced 1s): upsert to DB
  // 3. Return: isSyncing state for UI feedback if needed
}
```

**DB operations:**
- **Load:** On `isAuthenticated` becoming `true`, query `baskets` table for this user's active baskets, merge with local state
- **Save:** On `cartItems` change (debounced), `upsert` into `baskets` table:
  ```sql
  INSERT INTO baskets (id, user_id, cart_items, messages, agentic_state, ...)
  ON CONFLICT (id) DO UPDATE SET cart_items = EXCLUDED.cart_items, ...
  ```

**Integration:** Call `useCartPersistence` inside `GPTCommerceShell.tsx` after `useBasketState` and `useUserData`.

**No database schema changes needed** — the `baskets` table already has everything required and RLS policies are already set for `user_id = auth.uid()`.

---

## Complete File Change List

| File | Change Type | Issue(s) |
|---|---|---|
| `src/components/gpt-commerce/OTPModal.tsx` | Edit | #1 |
| `src/components/gpt-commerce/ChatLanding.tsx` | Edit | #2 |
| `src/components/gpt-commerce/ChatInterface.tsx` | Edit | #2 (prop passthrough) |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Edit | #2, #3, #4, #5.1e |
| `src/features/gpt-commerce/hooks/useUserData.ts` | Edit | #5.1a |
| `src/features/gpt-commerce/hooks/useBasketState.ts` | Edit | #5.1b, #5.1f |
| `src/components/gpt-commerce/AccountPanel.tsx` | Edit | #5.1c, #5.1d |
| `src/features/gpt-commerce/hooks/useCartPersistence.ts` | **New** | #6 |

**Total: 7 edits + 1 new file. No database schema changes needed.**
