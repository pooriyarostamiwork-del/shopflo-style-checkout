
# Root Cause: Nothing Is Being Saved to the Database

## Confirmed by Database Logs

The database error logs show the exact failure, repeated every time:

```
invalid input syntax for type uuid: "basket-1"
invalid input syntax for type uuid: "basket-1"
invalid input syntax for type uuid: "basket-1"
```

The `baskets` table has a `uuid` column for `id`. Every upsert attempt silently fails with this error. The database has **zero rows** — all chat history and cart data has only ever lived in `localStorage`, which gets wiped on sign-out.

## Three Bugs to Fix

### Bug 1 — Default basket ID `'basket-1'` is not a valid UUID (CRITICAL)

In `useBasketState.ts` line 75:
```ts
return [{ id: 'basket-1', title: '...', ... }];
```
And line 83:
```ts
return 'basket-1';
```

These hardcoded strings are not UUIDs. Every database upsert with this ID fails.

**Fix:** Generate the default basket ID using `crypto.randomUUID()` and share it between both initializer functions so they stay in sync.

### Bug 2 — New baskets created with `basket-${Date.now()}` — also not a UUID

In `GPTCommerceShell.tsx` lines 141 and 170, 175:
```ts
id: `basket-${Date.now()}`,
```

And in `handleDeleteBasket`, `handleSaveBasket` — all new baskets use the same broken pattern.

**Fix:** Replace every `basket-${Date.now()}` with `crypto.randomUUID()`.

### Bug 3 — DB sync only fires when `cartItems` change, not messages

In `useCartPersistence.ts` lines 128-129:
```ts
const cartKey = JSON.stringify(currentState.cartItems);
if (cartKey === lastSyncedCartRef.current) return;
```

This early-exit guard means: if a user only chats (no products added to cart), the messages are **never saved to the database**. After sign-out/sign-in, those conversations are gone.

**Fix:** Remove the early-exit guard and instead track a combined key of both messages count and cart items. The debounce (1 second) already throttles the saves.

### Bug 4 — Active basket is not restored from DB after sign-in

In `useCartPersistence.ts` lines 98-100:
```ts
if (data[0] && (Array.isArray(data[0].cart_items) && (data[0].cart_items as any[]).length > 0)) {
  setActiveBasketId(data[0].id);
}
```

The most recent basket is only activated if it has cart items. Baskets with only message history are ignored. The user ends up on a blank fresh basket instead of their most recent conversation.

**Fix:** Always activate the most recent DB basket if any data exists.

## Files to Change

| File | Changes |
|---|---|
| `src/features/gpt-commerce/hooks/useBasketState.ts` | Use `crypto.randomUUID()` for default basket; bump version to `'6'` |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Replace all `basket-${Date.now()}` with `crypto.randomUUID()` |
| `src/features/gpt-commerce/hooks/useCartPersistence.ts` | Remove cart-only sync guard; always activate most recent DB basket |

## How the Fix Works End-to-End

After these changes:

1. User opens app → default basket gets a proper UUID (e.g. `a3f7c2d1-...`)
2. User chats → messages are saved to DB within 1 second (debounced), keyed to the UUID
3. User creates new baskets → each gets a UUID via `crypto.randomUUID()`
4. User signs out → `localStorage` is cleared (already working)
5. User signs back in → DB load finds all their baskets by `user_id`, restores all messages and cart items, and activates the most recent basket
6. All conversations and carts are fully restored

The version bump to `'6'` wipes any stale `localStorage` data (which previously had `'basket-1'` IDs that can never be restored from DB anyway).

## No Database Schema Changes Needed

The `baskets` table already has `id uuid DEFAULT gen_random_uuid()` — the schema is correct. Only the client-side ID generation was broken.
