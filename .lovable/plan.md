
# Fix: Message Sent to Wrong Basket After "New Chat"

## Root Cause

In `handleSendMessageWithPending`, a new basket ID is generated and set via `setActiveBasketId(newId)`, but then the message is sent using `setTimeout(() => handleSendMessage(message), 0)`.

The problem: `handleSendMessage` is a `useCallback` that closed over the **old** `activeBasketId` at the time it was created. React's `setState` is asynchronous — `setActiveBasketId(newId)` hasn't re-rendered yet when the timeout fires. So `handleSendMessage` still uses the previous basket's ID.

This is a classic stale closure problem. `setTimeout` does not help here.

## The Fix

Pass the new basket ID **directly** into `handleSendMessage` as an optional parameter, bypassing the stale closure entirely. Instead of relying on `activeBasketId` from state, `handleSendMessage` can accept an explicit `basketId` override to use for that specific call.

### Changes Required

#### 1. `src/features/gpt-commerce/hooks/useAgentMessages.ts`

Add an optional `overrideBasketId` parameter to `handleSendMessage`. When provided, use it directly for `updateCurrentBasket` calls instead of relying on the closed-over `activeBasketId`.

The `updateCurrentBasket` function in `useBasketState` already reads from `activeBasketId` internally — so the fix is to also accept an optional direct state key. Looking at how `updateCurrentBasket` works, it uses `setBasketStates` with `activeBasketId`. We need a way to target a specific basket.

The cleanest approach: add an `overrideBasketId` to `useAgentMessages` props and expose a `handleSendMessageToBasket(message, basketId)` variant, OR pass `setBasketStates` and `activeBasketId` into a separate function that can be called with a specific ID.

Actually the simplest fix: expose `handleSendMessage` so it can be called with a target basket ID, and inside the function, use that ID directly to call `setBasketStates` instead of going through `updateCurrentBasket` (which uses a closed-over active ID).

#### Concrete Implementation

**In `useAgentMessages.ts`**, change `handleSendMessage` signature:

```ts
const handleSendMessage = useCallback(async (content: string, targetBasketId?: string) => {
  const basketId = targetBasketId ?? activeBasketId;
  
  // Use basketId instead of activeBasketId everywhere:
  // Instead of updateCurrentBasket(s => ...) — use setBasketStates directly:
  setBasketStates(prev => {
    const current = prev[basketId] || createDefaultBasketState();
    return {
      ...prev,
      [basketId]: {
        ...current,
        messages: [...current.messages, userMessage],
        isProcessing: true,
      }
    };
  });
  // ... and same pattern for all subsequent updateCurrentBasket calls inside this function
}, [...]);
```

But this is a big refactor of `handleSendMessage`. A simpler, less invasive path:

**Alternative (minimal change):** Pass `setBasketStates` and `createDefaultBasketState` into `useAgentMessages`, and add a `sendMessageToBasket(basketId, message)` function that does a targeted update without relying on `activeBasketId` from closure.

#### Simplest Safe Fix

In `GPTCommerceShell.tsx`, instead of `setTimeout(() => handleSendMessage(message), 0)`, directly construct the basket state update AND the initial user message in one go inside `handleSendMessageWithPending`, then let the AI response go through a new `sendMessageToBasket(id, message)` exported from `useAgentMessages`.

**Step 1** — Add `sendMessageToBasket` to `useAgentMessages.ts`:

```ts
// Takes an explicit basketId instead of using the closed-over activeBasketId
const sendMessageToBasket = useCallback(async (targetBasketId: string, content: string) => {
  // Exact same logic as handleSendMessage but all setBasketStates calls
  // use targetBasketId explicitly
}, [/* deps without activeBasketId */]);
```

**Step 2** — In `GPTCommerceShell.tsx`, replace the `setTimeout` call:

```ts
// BEFORE (broken):
setTimeout(() => handleSendMessage(message), 0);

// AFTER (correct):
sendMessageToBasket(newId, message);  // newId is the fresh UUID we just created
```

This completely avoids the stale closure because `newId` is a local variable passed directly.

#### Also: Welcome Message When Pending Chat Is Shown

The user also reported a blank page with no welcome message. Currently `ChatThread` with `messages={[]}` and `isProcessing={false}` shows nothing. The fix: when `isPendingNewChat` is true, `ChatInterface` should render `ChatThread` with an initial welcome message injected as the first message.

```tsx
// In ChatInterface.tsx, when isPendingNewChat:
const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'سلام! 👋 من دستیار خرید هوشمند فلوکارت هستم. چطور می‌تونم کمکت کنم؟\n\nمی‌تونی بگی دنبال چی می‌گردی، یا از من بخوای محصولات رو مقایسه کنم.',
  timestamp: new Date(),
};

return (
  <ChatThread
    messages={[welcomeMessage]}  // Show the greeting immediately
    ...
  />
);
```

## Summary of Changes

| File | Change |
|---|---|
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | Add `sendMessageToBasket(basketId, content)` that uses explicit basket ID, avoiding stale closure |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Call `sendMessageToBasket(newId, message)` instead of `setTimeout(() => handleSendMessage(message), 0)` |
| `src/components/gpt-commerce/ChatInterface.tsx` | Inject a static welcome message when `isPendingNewChat` is true so the thread is not blank |

Three focused changes. No hooks restructuring, no state logic overhaul.
