
Goal: fix the landing-to-chat flow so authenticated users always get a brand-new basket when they send from landing, and both the user message + agent response render immediately in that new thread without requiring any manual basket click.

What I reviewed:
- `src/features/gpt-commerce/GPTCommerceShell.tsx`
- `src/features/gpt-commerce/hooks/useCartPersistence.ts`
- `src/features/gpt-commerce/hooks/useAgentMessages.ts`
- `src/features/gpt-commerce/hooks/useBasketState.ts`
- `src/components/gpt-commerce/ChatLanding.tsx`
- `src/components/gpt-commerce/ChatInterface.tsx`
- `src/components/gpt-commerce/ChatThread.tsx`
- `src/components/gpt-commerce/Sidebar.tsx`
- backend basket data shape + policies (read-only check)

Confirmed root cause chain:
1) Hydration race in authenticated sessions:
   - `useCartPersistence` loads baskets async and always does:
     - `setBaskets(...)`
     - `setBasketStates(...)`
     - `setActiveBasketId(data[0].id)` (latest DB basket)
   - If user sends from landing before hydration finishes, a new basket is correctly created and receives messages, but hydration later force-switches active basket back to latest DB basket.
   - Result: UI appears to “resume latest basket”, and new message/agent response are hidden until user clicks the new basket manually.

2) State clobber risk during hydration:
   - `setBasketStates(prev => ({ ...prev, ...dbBasketStates }))` can overwrite freshly-created local basket state if IDs overlap or if fresh local state should win.
   - This contributes to inconsistent immediate rendering.

3) Entry UX expectation mismatch:
   - Current flow already supports `forceNew`, but hydration can still hijack active context after creation, breaking the intended behavior.

Implementation plan

Phase 1 — Make hydration non-destructive and non-hijacking
File: `src/features/gpt-commerce/hooks/useCartPersistence.ts`

1. Remove forced active-basket reassignment on DB load:
   - Delete/replace logic that always sets `setActiveBasketId(data[0].id)`.
   - Preserve currently active local basket unless it no longer exists after merge.

2. Add conflict-safe merge strategy for `basketStates`:
   - Introduce helper `isLocallyDirty(state)`:
     - true if `isProcessing` OR `hasStartedChat` OR `messages.length > 1` OR `cartItems.length > 0`.
   - During DB restore:
     - if local state is dirty, keep local.
     - if local state is clean/missing, hydrate from DB.
   - Prevents overwriting in-flight landing-created conversations.

3. Keep local-first active context on initial load:
   - If active basket ID is valid after merge, keep it.
   - Only fallback to first available basket if active ID is missing.
   - This ensures landing-originated basket remains active.

4. Harden debounced sync key (reliability improvement):
   - include `activeBasketId` + last message id in sync key (not only `msgCount/cart`) to avoid accidental “no-op” across basket switches with identical counts.

Phase 2 — Make “new basket + first message” atomic
File: `src/features/gpt-commerce/GPTCommerceShell.tsx`

1. Centralize new-thread creation into one helper (used by pending/forceNew paths):
   - Create basket object
   - Insert into basket list
   - Seed basket state with `hasStartedChat: true`
   - Set active basket to new ID
   - Clear `pendingNewChat`
   - Ensure chat section/cart panel are open
   - Immediately call `sendMessageToBasket(newId, message)`

2. Keep `forceNew` authoritative:
   - In `handleSendMessageWithPending`, `forceNew` should bypass any current active context.
   - No fallback to old basket when force flag exists.

3. Add duplicate-submit guard (small but useful):
   - ref-based guard against rapid double Enter/click creating two baskets for one landing prompt.

Phase 3 — Keep UI contract explicit
Files:
- `src/components/gpt-commerce/ChatLanding.tsx`
- `src/components/gpt-commerce/ChatInterface.tsx`

1. Keep current behavior of `onSendMessage(message, true)` for landing submit and quick “ask about”.
2. Keep type contract aligned (`forceNew?: boolean`) across all chat entry points.
3. Remove dead/unused `onStartChat` coupling from landing submit path (already mostly done), so “send from landing” has one deterministic trigger.

Technical details (implementation-focused)

Current broken sequence:
```text
Landing submit
  -> handleSendMessageWithPending(forceNew=true)
      -> create basket N, set active=N, sendMessageToBasket(N)
  -> async DB hydration finishes later
      -> setActiveBasketId(latestOldBasket)   <-- hijack
  -> user sees old basket
  -> basket N has messages, but hidden until manual click
```

Target sequence:
```text
Landing submit
  -> atomic create+activate basket N
  -> sendMessageToBasket(N)
  -> hydration merges only missing/clean states
  -> active basket remains N
  -> user message + agent response render immediately in open thread
```

Backend/database scope:
- No schema migration required.
- No policy changes required.
- Fix is purely frontend state orchestration + safer merge logic with existing backend data.

Acceptance criteria

1) Authenticated user opens GPT commerce landing and sends prompt:
- A brand-new basket is created.
- User message appears immediately in the visible thread.
- Agent reply appears in same visible thread.
- No manual basket click needed.

2) Even under slow network/hydration timing:
- Active thread never jumps back to latest old basket after first landing prompt.

3) Sidebar behavior:
- New basket appears at top and remains selected.
- Existing baskets remain intact.

4) Regression checks:
- CTA-to-chat for authenticated users still works.
- Manual “new basket” from sidebar still works.
- Restored baskets still load and remain selectable.
- Finalized/active zone behavior unchanged.

Files expected to change
- `src/features/gpt-commerce/hooks/useCartPersistence.ts` (primary fix)
- `src/features/gpt-commerce/GPTCommerceShell.tsx` (atomic creation flow hardening)
- `src/components/gpt-commerce/ChatLanding.tsx` (keep deterministic forceNew entry, cleanup if needed)
- `src/components/gpt-commerce/ChatInterface.tsx` (type/interface consistency only if needed)

Execution order
1. Patch `useCartPersistence` merge + active preservation.
2. Patch `GPTCommerceShell` atomic new-basket helper and forceNew path.
3. Align landing/interface contracts.
4. Run full manual E2E on authenticated flow with normal + slow conditions.
