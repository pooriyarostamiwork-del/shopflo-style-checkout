

# Fix: Payment Finalization Redirects to Landing Page

## Root Cause

When a user selects a payment method, `handlePaymentSelect` calls `onFinalizeBasket()` after 2 seconds. This callback:
1. Marks the current basket as `isSaved: true`
2. Creates a brand new basket with `createDefaultBasketState()` -- which has `hasStartedChat: false`
3. Sets this new basket as the active one

Since `hasStartedChat` is `false` on the new basket, the UI immediately switches from `ChatThread` back to `ChatLanding` (the landing page). The user never sees the success message.

## Fix

In `GPTCommerceShell.tsx`, the `onFinalizeBasket` callback should NOT immediately switch to the new basket. Instead, it should:
1. Mark the current basket as finalized (`isSaved: true`)
2. Create a new basket in the background (add it to the list)
3. Stay on the current (finalized) basket so the user can see the order success message and quick replies ("Track Order" / "Continue Shopping")
4. Only switch to the new basket when the user explicitly clicks "Continue Shopping" or selects another basket from the sidebar

Alternatively, the simpler fix: delay the basket switch, or set `hasStartedChat: true` on the new basket so the user stays in chat mode.

The simplest safe fix: keep the active basket on the finalized one (don't call `setActiveBasketId` in `onFinalizeBasket`). The new basket is created and available in the sidebar, but the user remains viewing the completed order conversation.

## Technical Changes

**`src/features/gpt-commerce/GPTCommerceShell.tsx`** (lines 100-114)
- Remove `setActiveBasketId(newBasket.id)` from `onFinalizeBasket`
- Remove `setBasketStates(prev => ({ ...prev, [newBasket.id]: createDefaultBasketState() }))` being tied to active switch
- Keep the new basket creation so it appears in sidebar, but don't activate it
- The user stays on the finalized basket viewing their success message

| File | Change |
|---|---|
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Remove automatic basket switch in `onFinalizeBasket` -- keep user on current basket after order completion |

