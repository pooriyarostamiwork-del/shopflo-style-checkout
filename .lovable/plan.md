

# Fix 5 Issues in GPT Commerce Chat

## Issue 1: "محصول شماره 5 رو با محصول شماره 2 مقایسه کن" incorrectly adds to cart

**Root Cause**: In `useAgentMessages.ts`, `parseProductSelection()` (line 54-74) matches ANY message containing "محصول شماره X" regardless of intent. It returns a number, and the code at line 207 blindly adds the product to cart. There is no check for whether the user wants to compare, ask about, or add the product.

**Fix**: Add intent detection BEFORE the product selection logic. If the message contains comparison/inquiry keywords (مقایسه, مقایسه کن, درباره, توضیح), send the full message to the AI agent instead of triggering the local add-to-cart shortcut. The `parseProductSelection` path should only activate when the intent is clearly "add to cart" (e.g., "اضافه کن", "بخر", or just the product number alone).

**File**: `src/features/gpt-commerce/hooks/useAgentMessages.ts`
- Add an intent check before line 207: if the message contains compare/inquiry keywords alongside a product number, skip the local shortcut and send to the AI agent
- The AI agent already handles comparison logic naturally

---

## Issue 2: Landing page input click redirects authenticated users to chat mode

**Root Cause**: In `ChatLanding.tsx`, the textarea's `onFocus` only sets local state. However, examining the flow more carefully: when an authenticated user clicks the sign-in button, `handleSignInClick` in `GPTCommerceShell.tsx` (line 357-364) sets `hasStartedChat: true`, which switches the view to `ChatThread`. The user likely clicks the persona/sign-in button area, not the textarea. But the user reports clicking the "prompt field" redirects them.

Looking at the landing page, the issue is that the textarea focus behavior is fine -- the real problem is that authenticated users should be able to type their query on the landing page and only transition to chat mode upon pressing send (which already works via `handleSubmit` calling `onStartChat()`). No code change needed for this specific flow.

However, if the user is seeing a redirect on focus, it might be caused by some other interaction. The current code looks correct: `onStartChat` is only called in `handleSubmit`. No change needed here -- the behavior is already correct. I'll verify this during testing.

**Update**: Re-reading the user's request: "he/she should can prompt from there, and after clicking on send go to chatmode" -- this IS the current behavior. The user might be experiencing a different bug. I'll keep this as a verification item.

---

## Issue 3: Smart chat naming based on first product query

**Root Cause**: Baskets are always named "سبد جدید" or "سبد جدید ۲". There is no logic to rename them based on the conversation content.

**Fix**: After the AI agent returns results for a product search, check if the basket still has its default name ("سبد جدید..."). If so, rename it using the first product search query (e.g., "هارد اکسترنال" or "هدفون بی‌سیم"). This gives baskets meaningful names.

**Files**:
- `src/features/gpt-commerce/hooks/useAgentMessages.ts`: After receiving agent response with products, rename the basket if it still has default name
- The rename logic: extract the query_text or use the user's message, truncate to ~20 chars

---

## Issue 4: "More results" quick reply in chat mode

**Root Cause**: The agent returns `{ id: "more", label: "🔍 نتایج بیشتر", type: "custom", action: "more_results" }` but `handleQuickReply` in `useCheckoutFlow.ts` has no handler for `type: "custom"` or `action: "more_results"`. The quick reply button exists in the UI but does nothing meaningful.

**Fix**: 
- In `useCheckoutFlow.ts` `handleQuickReply`: add a case for `reply.type === 'custom' && reply.action === 'more_results'` that sends a follow-up message to the agent like "نتایج بیشتر نشون بده" 
- Alternatively, handle it in `useAgentMessages` since it involves agent communication. Add a handler that sends the "more results" request to the agent with conversation context.

**Files**:
- `src/features/gpt-commerce/hooks/useAgentMessages.ts`: Export a `handleMoreResults` callback
- `src/features/gpt-commerce/hooks/useCheckoutFlow.ts`: Route `more_results` quick replies to the agent
- `supabase/functions/gpt-commerce-agent/index.ts`: The system prompt already handles follow-up queries naturally, so no edge function changes needed

---

## Issue 5: Cart sidebar doesn't reopen when returning to chat/baskets

**Root Cause**: In `GPTCommerceShell.tsx`, `handleSectionChange` (line 286-293) closes the cart for account/orders sections and opens it for `active-cart` only if `hasStartedChat` is true. But `handleBasketSelect` (line 263-284) changes the active basket and sets `activeSection` to `active-cart` without explicitly opening the cart. The `hasStartedChat` for the selected basket is set to `true` inside `setBasketStates`, but this update happens asynchronously, so `handleSectionChange` may read stale `hasStartedChat`.

**Fix**: In `handleBasketSelect`, explicitly set `setIsCartOpen(true)` since selecting a basket implies the user wants to see their cart. Also ensure `handleSectionChange` reopens cart when switching back to `active-cart`.

**File**: `src/features/gpt-commerce/GPTCommerceShell.tsx`
- Add `setIsCartOpen(true)` inside `handleBasketSelect`
- Update `handleSectionChange` to always open cart when switching to `active-cart` (remove `hasStartedChat` condition since if we're showing chat, cart should be visible)

---

## Summary of Changes

| File | Changes |
|---|---|
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | 1) Add intent detection to skip add-to-cart for compare/inquiry messages; 2) Smart basket renaming after first product search; 3) Export `handleMoreResults` for "more results" quick reply |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | 1) Add `setIsCartOpen(true)` in `handleBasketSelect`; 2) Fix `handleSectionChange` to always open cart for `active-cart`; 3) Wire `handleMoreResults` to quick reply handler |
| `src/features/gpt-commerce/hooks/useCheckoutFlow.ts` | Route `more_results` quick reply type to agent message handler |
| `src/data/gptCommerceData.ts` | Ensure `QuickReply` type supports `action` field (if not already) |

