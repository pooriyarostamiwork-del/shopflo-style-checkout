
# True Root Cause: `addressShipping` Messages Persist In-Memory When Switching Baskets

## What Is Actually Happening (Confirmed by Live Test)

When the user switches to a basket that **previously had an address/shipping message injected** (during the same browser session), the shipping component reappears because:

1. `handleBasketSelect` correctly resets `agenticState.step` to `'idle'` — ✅ done
2. But `handleBasketSelect` does NOT filter `addressShipping` messages out of the basket's `messages` array — ❌ missing

The `ChatThread` renders the `AddressShippingSelector` component whenever it sees a message with `msg.addressShipping` in the messages array (line 199 in ChatThread.tsx):
```tsx
{msg.addressShipping && onAddressConfirm && onSelectShipping && onAddNewAddress && (
  <AddressShippingSelector ... />
)}
```

The DB restore and localStorage restore both correctly filter these messages out:
```ts
.filter((m: any) => !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation)
```

But `handleBasketSelect` in `GPTCommerceShell.tsx` only resets the agentic state — it never filters the messages:
```ts
// Current handleBasketSelect — missing message filter:
if (bs) return {
  ...prev,
  [basketId]: {
    ...bs,
    hasStartedChat: true,
    agenticState: { ...bs.agenticState, step: 'idle' },  // ✅ resets step
    selectedShippingByMerchant: {},
    selectedAddressId: null,
    // ❌ MISSING: messages: bs.messages.filter(m => !m.addressShipping && ...)
  }
};
```

## The Fix — One-Line Change in `GPTCommerceShell.tsx`

In `handleBasketSelect`, add the same message filter that DB restore and localStorage restore already use:

```ts
const handleBasketSelect = useCallback((basketId: string) => {
  setPendingNewChat(false);
  setActiveBasketId(basketId);
  setActiveSection('active-cart');
  setBasketStates(prev => {
    const bs = prev[basketId];
    if (bs) return {
      ...prev,
      [basketId]: {
        ...bs,
        hasStartedChat: true,
        agenticState: { ...bs.agenticState, step: 'idle' },
        selectedShippingByMerchant: {},
        selectedAddressId: null,
        // ADD THIS: filter checkout UI messages just like DB restore does
        messages: bs.messages.filter(
          (m: any) => !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation
        ),
      }
    };
    return prev;
  });
}, [setActiveBasketId, setBasketStates]);
```

## Why This Is The Only Change Needed

The root cause is purely in `handleBasketSelect` — the in-memory state cleanup on basket switch is incomplete. All other sanitization layers (localStorage, DB) already do this correctly.

No changes needed to:
- `useCheckoutFlow.ts` — the `useEffect` with `agenticState.step` is already correctly scoped
- `useCartPersistence.ts` — already saves `step: 'idle'` to DB
- `useBasketState.ts` — localStorage sanitization already filters these messages

## Files to Change

| File | Change |
|---|---|
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Add message filter in `handleBasketSelect` to strip `addressShipping`, `paymentOptions`, `addressSelector`, `addressConfirmation` messages when switching baskets |

One surgical, single-line fix.
