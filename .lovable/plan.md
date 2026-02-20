
# Fix: Shipping Component Appearing Without User Prompting

## What Was Already Fixed (Previous Sessions)
- `ChatInterface.tsx`: Welcome message shows correctly in pending state
- `GPTCommerceShell.tsx`: `handleSendMessageWithPending` correctly uses `sendMessageToBasket(newId, message)`
- `useAgentMessages.ts`: `sendMessageToBasket` exists and targets baskets explicitly

## What Was NOT Applied (Previous Plan Was Approved But Not Implemented)
All three fixes from the last approved plan are missing from the actual files. Here is their current broken state and the fix for each.

---

## Bug 1: `useCheckoutFlow.ts` — Effect Re-fires on Every Cart Change

**Current broken code (line 97):**
```ts
}, [agenticState.step, getMerchantShipping, selectedShippingByMerchant, updateCurrentBasket]);
```

`getMerchantShipping` is a `useCallback` that depends on `cartItems`. Every time `cartItems` changes — including when switching baskets — it gets a new reference, causing the effect to re-fire. If `agenticState.step` happens to be `'address-confirmation'` at that moment (from a previous basket this session), the shipping UI gets injected into the wrong basket.

**Fix:** Use a `useRef` to hold `getMerchantShipping` so the effect only fires when `agenticState.step` actually changes to `'address-confirmation'`:

```ts
const getMerchantShippingRef = useRef(getMerchantShipping);
getMerchantShippingRef.current = getMerchantShipping;

useEffect(() => {
  if (agenticState.step !== 'address-confirmation') return;
  const merchantShipping = getMerchantShippingRef.current();
  // ... rest of logic
}, [agenticState.step]); // Only step — no more spurious re-fires
```

---

## Bug 2: `useCartPersistence.ts` — Saves Live Checkout Step to Database

**Current broken code (line 157):**
```ts
agentic_state: currentState.agenticState as any,
```

If the debounce fires while the user is mid-checkout (step = `'address-confirmation'`), that step gets written to the database. On the next page load or basket restore, that step could cause the address component to appear.

**Fix:** Always reset `step` to `'idle'` before writing to DB:
```ts
agentic_state: { ...currentState.agenticState, step: 'idle' } as any,
```

---

## Bug 3: `GPTCommerceShell.tsx` — Switching Baskets Doesn't Clear Checkout State

**Current broken code (lines 260–269):**
```ts
const handleBasketSelect = useCallback((basketId: string) => {
  setPendingNewChat(false);
  setActiveBasketId(basketId);
  setActiveSection('active-cart');
  setBasketStates(prev => {
    const bs = prev[basketId];
    if (bs) return { ...prev, [basketId]: { ...bs, hasStartedChat: true } };
    return prev;
  });
}, [setActiveBasketId, setBasketStates]);
```

When switching to a basket that had an in-progress checkout this session, the `agenticState.step` is still `'address-confirmation'` in memory. Switching to it keeps that step active, causing the shipping component to be visible immediately.

**Fix:** Reset `agenticState.step` to `'idle'` and clear shipping/address on basket switch:
```ts
if (bs) return {
  ...prev,
  [basketId]: {
    ...bs,
    hasStartedChat: true,
    agenticState: { ...bs.agenticState, step: 'idle' },
    selectedShippingByMerchant: {},
    selectedAddressId: null,
  }
};
```

---

## Files to Modify

| File | Change |
|---|---|
| `src/features/gpt-commerce/hooks/useCheckoutFlow.ts` | Use `useRef` for `getMerchantShipping`; only depend on `agenticState.step` in the effect |
| `src/features/gpt-commerce/hooks/useCartPersistence.ts` | Save `step: 'idle'` to DB instead of live step |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Reset `agenticState.step`, `selectedShippingByMerchant`, `selectedAddressId` in `handleBasketSelect` |

Three precise, surgical changes. No state restructuring.
