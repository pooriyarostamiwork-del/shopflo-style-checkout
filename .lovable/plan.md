

# Fix 4 Issues: Basket Zones, Quick Replies, Smart Naming, Landing Page Redirect

## Issue 1: Basket Zone Logic (Active 7 / Recent 14 / Finalized Orders)

**Current state**: Baskets are split into `isSaved: false` (active) and `isSaved: true` (saved/archived). "Recent baskets" zone is always empty placeholder. No limit on active baskets.

**Changes**:

### Sidebar.tsx
- **Active baskets**: Show the most recent 7 non-saved baskets (sorted by activity). If there are more than 7, the overflow goes to "Recent".
- **Recent baskets**: Show baskets 8-21 (max 14). Currently this zone is a static empty placeholder -- populate it with real overflow baskets. Users can click to reactivate.
- **Rename "ذخیره‌شده‌ها" to "سبدهای نهایی شده"**: Change section title and icon color to pastel green (`text-emerald-400`). Only the icon next to each basket title gets the green color, not the section icon.
- **Finalized baskets**: Baskets where a successful order was placed get `isSaved: true` automatically. They appear in the renamed zone.

### Basket interface changes
- No schema changes needed. The `isSaved` flag already exists. We use array position/index to determine active vs recent.
- Active = first 7 unsaved baskets; Recent = baskets 8-21 unsaved; anything beyond 21 stays but is deprioritized.

### GPTCommerceShell.tsx
- After a successful order (in `handleCheckoutSuccess` or the checkout flow), automatically mark the basket as `isSaved: true` so it moves to "سبدهای نهایی شده".

---

## Issue 2: "More Results" Quick Reply Not Visible

**Root cause**: The `assistantMessage` built in `useAgentMessages.ts` (line 333-340) never attaches a `quickReplies` array when products are returned. The `handleMoreResults` function exists but there's no UI trigger because no quick reply button is rendered.

**Fix in `useAgentMessages.ts`**:
- When `mappedProducts.length > 0`, attach `quickReplies` to the assistant message:
```
quickReplies: [
  { id: 'more', label: 'نتایج بیشتر', type: 'custom' as QuickReplyType, action: 'more_results' },
]
```
- Do the same in `sendMessageToBasket` (line 390-397).

---

## Issue 3: Smart Naming Uses Raw User Message

**Current code** (line 325-330): Takes `content` (the raw user message) and truncates to 20 chars. This produces ugly names like "هدفون بی‌سیم خوب با ا…".

**Fix**: Instead of using the raw user message, extract a clean product-intent name. Two approaches:
1. Use the agent's response: parse the first product category/name from `mappedProducts[0]` subcategory or name keywords.
2. Better: extract keywords from the user query by removing filler words (می‌خوام, خوب, بهترین, نشون بده, etc.) and keeping the product-relevant terms.

**Implementation**: Create a `extractSmartName(userMessage: string, products: Product[]): string` helper that:
- If products exist, try to use the first product's subcategory or brand + short category
- Fallback: strip common filler words from user message and take first 2-3 meaningful words
- Truncate to 25 chars max

Also apply this in `sendMessageToBasket` which currently has no naming logic at all.

---

## Issue 4: Landing Page Redirects Authenticated Users on Click

**Root cause**: In `GPTCommerceShell.tsx` line 367-375, `handleSignInClick` is called when authenticated users click the sign-in/profile button on the landing page. It sets `hasStartedChat: true`, which switches the view from `ChatLanding` to `ChatThread`. The user reports clicking on the "prompt area" redirects them -- this is because the sign-in button is visually close to or overlapping the input area, and authenticated users see "ورود به فضای خرید" which they click thinking it's related to the input.

**Fix in `GPTCommerceShell.tsx`**:
- When `isAuthenticated`, `handleSignInClick` should NOT set `hasStartedChat: true`. Instead it should do nothing (user is already logged in) or navigate to account.
- The transition to chat mode should ONLY happen via `handleStartChat` which is called from `ChatLanding.handleSubmit` (when user actually sends a message).

**Fix in `ChatLanding.tsx`**:
- When `isAuthenticated`, the sign-in button should show user info but NOT trigger chat mode entry. Change the button behavior: if authenticated, navigate to account panel instead, or simply do nothing.

---

## Files Modified

| File | Changes |
|---|---|
| `src/components/gpt-commerce/Sidebar.tsx` | Split baskets into active (max 7), recent (overflow, max 14), finalized (isSaved). Rename saved section to "سبدهای نهایی شده". Pastel green icon for finalized baskets. |
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | 1) Attach `quickReplies` with "نتایج بیشتر" to product response messages. 2) Fix smart naming to use AI-extracted product intent instead of raw message. 3) Add naming to `sendMessageToBasket`. |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | 1) Auto-mark basket as finalized after successful order. 2) Fix `handleSignInClick` to not enter chat mode for authenticated users. |
| `src/components/gpt-commerce/ChatLanding.tsx` | Update sign-in button behavior for authenticated users to not trigger chat mode. |

