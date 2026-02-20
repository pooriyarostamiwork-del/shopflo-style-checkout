
# Diagnosis & Fix Plan: 4 Critical Bugs

## Root Cause Analysis

### Bug 1: Two Accounts Share the Same Chat/Cart Data

**Root cause: `localStorage` is never cleared on sign-out or user switch.**

`useBasketState` reads from `localStorage` keys (`flowcart-baskets`, `flowcart-basket-states`, `flowcart-active-basket`) on mount. These are **shared across all users on the same browser**. When User A signs out and User B signs in:
- `useCartPersistence` loads User B's DB baskets correctly
- BUT: the `hasLoadedFromDb` ref starts as `false` on first mount then stays `true` — meaning if User B signs in without a full page reload, the DB load won't re-run
- More critically: `useBasketState` still initializes from `localStorage` which contains User A's basket data. Even if DB load runs, it merges on top (line 82-86 in `useCartPersistence`), preserving User A's local-only baskets

**Fix locations:**
1. `AuthContext.tsx` `signOut()`: after `supabase.auth.signOut()`, clear all `flowcart-*` localStorage keys and force a redirect to `/gptcommerce` (full page reload)
2. `useCartPersistence.ts`: when `isAuthenticated` transitions from `true` to `false`, clear basket localStorage
3. `useCartPersistence.ts`: reset `hasLoadedFromDb.current = false` AND clear localStorage when `isAuthenticated` goes false (already partially done on line 110-114, but localStorage is not cleared)

---

### Bug 2: New User Sees Mock Addresses

**Root cause: `mockAddresses` still hardcoded in `CheckoutModalLocalized.tsx` and `gptCommerceData.ts` still exports them.**

Two separate places:
1. **`src/components/CheckoutModalLocalized.tsx` lines 124-134**: The `addresses` state is initialized with a hardcoded mock address object containing `"ایمان صادق‌زاده"`. This is the `/farsi` checkout modal. It NEVER reads from the database — it's purely local state.
2. **`src/data/gptCommerceData.ts` lines 438-492**: `mockAddresses` is still exported. While `useUserData.ts` no longer uses it, it remains available for accidental re-import.

The new user at `09024512785` — when they go through `/farsi` checkout, they see the hardcoded address in `CheckoutModalLocalized.tsx`. This is **not** connected to real addresses at all; it's pure hardcoded UI state.

**Fix:**
- `CheckoutModalLocalized.tsx`: Change the `addresses` initial state from a hardcoded mock to `[]` (empty array), and `selectedAddress` to `null`. The empty state UI already exists — it will show the "add address" flow instead.
- `gptCommerceData.ts`: Remove the `mockAddresses` export entirely (along with `mockOrders`) to prevent future accidental use.

---

### Bug 3: Account Name ≠ Order Name

**Root cause: `AccountPanel.tsx` initializes `profileData` from `resolvedProfile` (a prop), but this prop value is captured once at render time and not updated reactively. Also `CheckoutModalLocalized.tsx` still hardcodes `"ایمان"` as the `userName`.**

Two sub-issues:
1. **`AccountPanel.tsx` line 283-286**: `const resolvedProfile = userProfileProp || defaultUserProfile` + `useState(resolvedProfile)` — the `profileData` state is initialized from the prop **once** at mount. If the profile loads asynchronously (which it does — `fetchProfile` runs after auth state resolves), the initial render uses stale/empty data. The `useState` never re-syncs with the prop after mount.
2. **`CheckoutModalLocalized.tsx` line 108**: `const [userName] = useState(isRTL ? "ایمان" : "Alex")` — hardcoded name displayed in the checkout greeting, never connected to the real user's name.

**Fix:**
- `AccountPanel.tsx`: Add a `useEffect` to sync `profileData` when `userProfileProp` changes:
  ```ts
  useEffect(() => {
    if (userProfileProp) {
      setProfileData(userProfileProp);
      setPendingProfileData(userProfileProp);
    }
  }, [userProfileProp?.name, userProfileProp?.phone]);
  ```
- `CheckoutModalLocalized.tsx` line 108: Remove the hardcoded `userName` state entirely — this field is used for the animated greeting. Replace with an empty string or remove the greeting animation referencing it.

---

### Bug 4: Sign Out Stays on Page with Stale Data

**Root cause: `signOut()` in `AuthContext.tsx` only calls `supabase.auth.signOut()` and clears React state, but:**
1. Does NOT clear `localStorage` basket data
2. Does NOT navigate away from the current page
3. The shell stays mounted with the previous basket state in React memory

**Fix — `AuthContext.tsx` `signOut()`:**
```ts
const signOut = useCallback(async () => {
  await supabase.auth.signOut();
  // Clear all basket localStorage to prevent data leaking to next user
  localStorage.removeItem('flowcart-baskets');
  localStorage.removeItem('flowcart-active-basket');
  localStorage.removeItem('flowcart-basket-states');
  localStorage.removeItem('flowcart-global-addresses');
  localStorage.removeItem('flowcart-storage-version');
  setUser(null);
  setProfile(null);
  setIsNewUser(false);
  // Hard redirect to force full React tree remount and clear all in-memory state
  window.location.href = '/gptcommerce';
}, []);
```

The `window.location.href` redirect (not `useNavigate`) forces a full page reload, which clears all React in-memory state from the previous session. This is the correct pattern for multi-user scenarios on shared browsers.

---

## Complete File Change List

| File | Change | Bug |
|---|---|---|
| `src/contexts/AuthContext.tsx` | Clear localStorage + redirect in `signOut()` | #1, #4 |
| `src/components/CheckoutModalLocalized.tsx` | Remove hardcoded address (lines 124-134), remove hardcoded `userName` (line 108) | #2, #3 |
| `src/components/gpt-commerce/AccountPanel.tsx` | Add `useEffect` to sync `profileData` state when prop changes | #3 |
| `src/data/gptCommerceData.ts` | Remove `mockAddresses` export and `mockOrders` export | #2 |
| `src/features/gpt-commerce/hooks/useCartPersistence.ts` | Clear localStorage on sign-out (when `isAuthenticated` goes false) | #1 |

**Total: 5 file edits. No database schema changes needed.**

---

## What Does NOT Change

- No UI changes to any component visual design
- No routing structure changes
- No database schema changes
- No edge function changes
- The `/farsi` product is unaffected except for the hardcoded address removal in `CheckoutModalLocalized`
