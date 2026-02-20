
# Root Cause: Two-Pronged Fix Needed

## The Actual Bug (Still Surviving Our Previous Fix)

The previous fix correctly filters `addressShipping` messages **when reading** from localStorage and DB. But there are two remaining gaps:

### Gap 1: The DB upsert saves messages WITHOUT filtering

`useCartPersistence.ts` lines 143-146 saves `currentState.messages` raw to the database:

```ts
const messagesForDb = currentState.messages.map(m => ({
  ...m,
  timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
}));
```

No filter is applied. So `addressShipping` messages are persisted in the DB. On the next load:
- DB restore: stripped ✅ (our previous fix)
- But the DB debounce timer **fires again** because `currentState.messages` changed after the DB restore overwrites state → it re-saves the now-clean messages. But between the DB load and the debounce timer (1 second), the old stale DB row still exists.

### Gap 2: The storage version key was not bumped after our fix

`CURRENT_VERSION = '4'` in `useBasketState.ts`. Any user who had this data cached BEFORE our filtering fix was deployed still has the old unfiltered localStorage. Since the version hasn't changed, the migration guard does NOT clear and re-initialize their storage. Their old `addressShipping` message survives in localStorage because the version check thinks the storage is already "current".

## Two Fixes

### Fix 1 — Bump storage version to `'5'` (`useBasketState.ts`)

Change `const CURRENT_VERSION = '4'` to `'5'`. This forces a one-time clear of all existing localStorage basket data for every user on next load. Since our filtering is now correct, new data written to localStorage will never contain `addressShipping` messages again.

```ts
const CURRENT_VERSION = '5';
```

This is the most important fix. It ensures all users get a clean slate.

### Fix 2 — Filter `addressShipping` messages before saving to DB (`useCartPersistence.ts`)

Add a filter in the debounced DB upsert so that `addressShipping`, `paymentOptions`, `addressSelector`, and `addressConfirmation` messages are never written to the database column in the first place. This prevents future re-introduction of the problem:

```ts
const messagesForDb = currentState.messages
  .filter(m => !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation)
  .map(m => ({
    ...m,
    timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
  }));
```

## Files to Change

| File | Change |
|---|---|
| `src/features/gpt-commerce/hooks/useBasketState.ts` | Bump `CURRENT_VERSION` from `'4'` to `'5'` |
| `src/features/gpt-commerce/hooks/useCartPersistence.ts` | Filter checkout messages before DB upsert |

**Total: 2 tiny edits. No database or UI changes.**

## Why This Works

- Version bump `'5'` → forces localStorage wipe for all users → no stale data survives
- DB filter → `addressShipping` messages never written to DB → DB restore has nothing to strip
- Both read and write paths are now consistently clean
