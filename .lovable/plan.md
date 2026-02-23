
# Three Fixes for GPT Commerce

## Issue 1: Replace Hardcoded Carousel Products with Real Database Products

Currently `ProductCarousels.tsx` uses ~270 lines of hardcoded product arrays (`hotDealsProducts`, `youMayLikeProducts`, `mostPopularProducts`). These will be replaced with real products fetched from the database (1,489 products across categories like headphones, wearables, mobiles, laptops, etc.).

### Changes

**`src/components/gpt-commerce/ProductCarousels.tsx`**
- Remove all hardcoded product arrays (`hotDealsProducts`, `youMayLikeProducts`, `mostPopularProducts`, `ecommerceImages`)
- Add a React Query hook (`useQuery`) to fetch products from the `products` table, grouped by subcategory
- Map database rows to the existing `Product` interface (id, name, price, originalPrice, image, merchant, rating, etc.)
- Carousel sections will be dynamically generated from the distinct subcategories:
  - "هدفون، هدست و هندزفری" (Headphones)
  - "ساعت و مچ‌بند هوشمند" (Wearables)
  - "گوشی موبایل" (Phones)
  - "لپ تاپ" (Laptops)
  - "لوازم جانبی گوشی موبایل" (Accessories)
  - "هارد اکسترنال" (External HDDs)
  - "دوربین دیجیتال" (Cameras)
  - "کیبورد و ماوس" (Keyboard/Mouse)
- Fetch ~15 products per subcategory (ordered by rating DESC) to populate each carousel
- Show loading skeletons while data loads
- Keep the existing `CarouselSection` component, banner system, and `HomepageSettings` integration unchanged

---

## Issue 2: Landing Page Prompt Should Open a New Basket

Currently when a user types in the ChatLanding prompt and submits, `handleStartChat` sets `hasStartedChat: true` on the **current active basket** (which is the last one). This resumes an old conversation instead of starting fresh.

### Changes

**`src/features/gpt-commerce/GPTCommerceShell.tsx`**
- Modify the `handleStartChat` callback: instead of just setting `hasStartedChat: true` on the current basket, it should trigger the same "pending new chat" flow used by `handleCreateBasket`
- Specifically: set `setPendingNewChat(true)` so the next message submission creates a brand new basket via `handleSendMessageWithPending`
- The ChatLanding's `onStartChat` + `onSendMessage` sequence will now create a new basket with the first message, exactly like clicking "New Basket" in the sidebar

**`src/components/gpt-commerce/ChatLanding.tsx`**
- No changes needed -- it already calls `onStartChat()` then `onSendMessage(message)` which will work with the updated logic

---

## Issue 3: Finalized Baskets Should Behave Like Other Baskets

Currently finalized baskets (Zone 3) have a different UI: they show Play/Resume and Delete icon buttons, and the whole row is NOT clickable. They should instead be clickable just like active baskets and recent baskets, with the only visual difference being the emerald-colored icon.

### Changes

**`src/components/gpt-commerce/Sidebar.tsx`** (lines 357-387)
- Make the finalized basket row clickable by wrapping it with `onClick={() => onBasketSelect?.(basket.id)}`
- Add `cursor-pointer` class to the row
- Remove the Play (resume) and Delete icon buttons from finalized baskets
- Keep the emerald-colored Bookmark icon as the only visual differentiator
- The basket will open in read-only conversation mode just like any other basket when clicked

---

## Files Summary

| File | Change |
|---|---|
| `src/components/gpt-commerce/ProductCarousels.tsx` | Replace hardcoded products with database query using React Query |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Change `handleStartChat` to trigger new basket creation flow |
| `src/components/gpt-commerce/Sidebar.tsx` | Make finalized baskets clickable like other baskets, remove resume/delete buttons |
