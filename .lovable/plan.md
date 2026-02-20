
# Fix Plan: 2 Bugs

---

## Bug 1 — Hardcoded Address/Shipping After Welcome Message

### Root Cause

This is **not a hardcoded address** — it is a **stale persisted checkout message being restored from the database**.

Here is what happens:

1. User starts checkout → chat gets a `addressShipping` message appended to `messages[]`
2. `useCartPersistence` debounces and syncs the full `messages[]` array to the DB `baskets.messages` column
3. User closes the tab mid-checkout
4. Next session: `useCartPersistence` restores `messages` from DB, including the old address/shipping selector card — it appears right after the welcome message because that is where it was in the saved conversation

The welcome message is correct. The problem is the stale checkout-step messages from a prior session being displayed without context.

### Fix

**Two complementary changes:**

**1a — Filter stale agentic messages on DB restore (`useCartPersistence.ts`)**

When restoring messages from DB, strip out any messages that contain `addressShipping`, `paymentOptions`, `addressSelector`, or `addressConfirmation` fields. These are live-interactive UI elements that lose their meaning across sessions. Only content messages, product cards, order summaries, and quick replies that are already "done" (i.e., not awaiting user input) should be restored.

```ts
// In the DB load section of useCartPersistence.ts
const messages = rawMessages.map(...).filter(m =>
  !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation
);
```

**1b — Also reset `agenticState.step` to `'idle'` on restore**

If a session was abandoned mid-checkout (step = `'address-confirmation'` or `'payment-selection'`), restoring the `agenticState` would also re-trigger the `useEffect` in `useCheckoutFlow` that pre-populates shipping defaults, potentially generating new checkout messages. Reset the step to `'idle'` on DB restore:

```ts
dbBasketStates[b.id] = {
  ...defaultState,
  cartItems,
  messages, // filtered
  selectedAddressId: null, // reset: address may no longer exist
  selectedShippingByMerchant: {}, // reset
  agenticState: { ...defaultState.agenticState, step: 'idle' }, // always reset
  hasStartedChat: cartItems.length > 0 || messages.length > 1,
};
```

This makes restored sessions resume as a clean chat (with history) rather than dropping the user back into an abandoned checkout modal.

---

## Bug 2 — Empty Delivery Address in Order History

### Root Cause

In `useCheckoutFlow.ts`, `handlePaymentSelect` runs inside a `setTimeout(async () => { ... }, 2000)`. Inside this async closure:

```ts
const selectedAddr = globalAddresses.find(a => a.id === currentBasketState.selectedAddressId);
```

**`globalAddresses` is stale.** When an address was just added via `handleAddNewAddress`, it is:
1. Saved to the DB (`user_addresses` table) → gets a real UUID back
2. Added to `globalAddresses` state in `useUserData`

But `handlePaymentSelect` captures the `globalAddresses` array in its closure **at the time it was last created** (via `useCallback`). If the user added a new address *after* the last render that created `handlePaymentSelect`, that new address is **not in the captured closure**.

Additionally, the `selectedAddressId` stored in `basketStates[activeBasketId]` may point to the **old temp ID** (`addr-${Date.now()}`) before the DB returned the real UUID. Look at `handleAddNewAddress`: it first sets `created.id = addr-${Date.now()}`, calls `updateCurrentBasket` with that ID, then *after* the DB insert replaces `created.id = data.id` — but `updateCurrentBasket` was already called with the temp ID.

### Fix

**2a — Re-fetch the selected address from DB at payment time (`useCheckoutFlow.ts`)**

Inside the `setTimeout` in `handlePaymentSelect`, instead of looking up `selectedAddr` from the stale `globalAddresses` closure, directly read the address from the `user_addresses` table using the `selectedAddressId`:

```ts
// Inside setTimeout in handlePaymentSelect
const currentBasketState = basketStates[activeBasketId] || createDefaultBasketState();
let selectedAddr = null;

if (currentBasketState.selectedAddressId && isAuthenticated) {
  // Re-fetch from DB to guarantee freshness
  const { data: addrData } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('id', currentBasketState.selectedAddressId)
    .single();
  if (addrData) {
    selectedAddr = {
      title: addrData.title,
      fullAddress: addrData.full_address,
      recipientName: addrData.recipient_name,
      phone: addrData.phone,
    };
  }
} else {
  // Fallback: use the closure for unauthenticated users
  selectedAddr = globalAddresses.find(a => a.id === currentBasketState.selectedAddressId) || null;
}
```

This guarantees the address saved in the order is always the real, persisted data from the DB.

**2b — Fix the temp-ID race in `handleAddNewAddress` (`useCheckoutFlow.ts`)**

Currently, `handleAddNewAddress` calls `updateCurrentBasket` with the temp ID *before* the DB returns the real UUID:

```ts
const id = `addr-${Date.now()}`;
const created: DeliveryAddress = { id, ...addr };
// ... DB insert happens here, then created.id = data.id
// BUT updateCurrentBasket was already called before this!
```

Fix: move `updateCurrentBasket` to *after* the DB insert resolves:

```ts
const handleAddNewAddress = useCallback(async (addr) => {
  let created: DeliveryAddress = { id: `addr-${Date.now()}`, ...addr };

  if (isAuthenticated) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase.from('user_addresses').insert({...}).select().single();
    if (data) created = { ...created, id: data.id }; // use real DB ID before updating basket
  }

  updateCurrentBasket(s => {
    // update addressShipping message with new address
    // set selectedAddressId: created.id  ← now always the real UUID
    ...
  });
}, [isAuthenticated, updateCurrentBasket]);
```

---

## Files to Change

| File | Change | Bug |
|---|---|---|
| `src/features/gpt-commerce/hooks/useCartPersistence.ts` | Filter stale agentic messages (addressShipping, paymentOptions) and reset agenticState.step on DB restore | #1 |
| `src/features/gpt-commerce/hooks/useCheckoutFlow.ts` | Re-fetch address from DB inside `handlePaymentSelect` setTimeout; fix race in `handleAddNewAddress` | #2 |

**Total: 2 file edits. No database schema changes.**
