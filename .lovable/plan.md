
## Root Cause: localStorage Restore Has No Message Filtering

The `useCartPersistence.ts` DB restore path correctly filters out stale checkout messages (`addressShipping`, `paymentOptions`, etc.) and resets `agenticState.step` to `'idle'`. **But the localStorage restore path in `useBasketState.ts` does not.**

Here is what happens for `basket-1` specifically:

1. User starts checkout on their first session → `basket-1` state gets `addressShipping` messages appended
2. The `useEffect` on line 118-120 of `useBasketState.ts` immediately persists the full `basketStates` to localStorage — including the `addressShipping` message
3. User refreshes or returns next session
4. `getInitialBasketStates()` (lines 86-102 of `useBasketState.ts`) restores from localStorage — it only parses timestamps and resets `hasStartedChat`. It does **not** filter checkout messages
5. The stale `addressShipping` message is now in memory for `basket-1`
6. `useCartPersistence` DB load runs async and may or may not overwrite it depending on timing

**Why only basket-1?** The default basket ID is always `'basket-1'` (hardcoded in `getInitialActiveBasketId()`). When a user creates a new basket, it gets a `basket-${Date.now()}` ID and always starts from `createDefaultBasketState()` which is always clean. Only `basket-1` accumulates stale checkout state across refreshes via localStorage.

---

## Fix: One File, One Function

Add the exact same filtering logic to `getInitialBasketStates()` in `src/features/gpt-commerce/hooks/useBasketState.ts` that already exists in the DB restore path of `useCartPersistence.ts`:

**Current code (lines 86-102):**
```ts
const getInitialBasketStates = (): Record<string, BasketState> => {
  try {
    const stored = localStorage.getItem(BASKET_STATES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const key of Object.keys(parsed)) {
        const bs = parsed[key];
        bs.hasStartedChat = false;
        if (bs.messages) {
          bs.messages = bs.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
      return parsed;
    }
  } catch (e) { console.error('Failed to load basket states:', e); }
  return {};
};
```

**Fixed code:**
```ts
const getInitialBasketStates = (): Record<string, BasketState> => {
  try {
    const stored = localStorage.getItem(BASKET_STATES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const key of Object.keys(parsed)) {
        const bs = parsed[key];
        bs.hasStartedChat = false;
        // Filter out stale interactive checkout messages — same logic as DB restore
        if (bs.messages) {
          bs.messages = bs.messages
            .map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
            .filter((m: any) => !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation);
        }
        // Reset abandoned checkout state so session resumes cleanly
        bs.agenticState = { ...(bs.agenticState || {}), step: 'idle' };
        bs.selectedAddressId = null;
        bs.selectedShippingByMerchant = {};
      }
      return parsed;
    }
  } catch (e) { console.error('Failed to load basket states:', e); }
  return {};
};
```

---

## What This Fixes

- Stale `addressShipping` / `paymentOptions` messages are stripped from ALL baskets on localStorage restore, not just DB restore
- `agenticState.step` is reset to `'idle'` on localStorage restore, preventing the `useEffect` in `useCheckoutFlow` from re-triggering address population
- `selectedAddressId` and `selectedShippingByMerchant` are reset, giving a clean slate

**Total: 1 file edit, ~5 lines changed. No database changes needed.**
