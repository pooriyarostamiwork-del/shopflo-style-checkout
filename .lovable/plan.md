

# Four Fixes for GPT Commerce

## 1. Authenticated Users Redirected Away from Landing Page

**Root cause:** When `useCartPersistence` loads baskets from DB on authentication, it restores them with `hasStartedChat: true` (because they have messages). `ChatInterface` then renders `ChatThread` instead of `ChatLanding`, so the user never sees the landing/storefront.

**Fix:** On initial page load (hard refresh / navigation to `/gptcommerce`), always start with `hasStartedChat: false` for the active basket. The landing page should be the default entry point. The user enters chat mode only when they explicitly send a message.

### Changes
- **`src/features/gpt-commerce/hooks/useCartPersistence.ts`** (line 81): When restoring baskets from DB, set `hasStartedChat: false` instead of computing it from cart/message length. The baskets are loaded and available in the sidebar, but the user sees the landing page first.
- Optionally, don't auto-activate a restored basket if it would skip the landing. Keep the active basket as the default empty one, let users click a sidebar basket to resume.

---

## 2. Broken Favicon Showing Raw Text at Top of Page

**Root cause:** The `<link rel="icon">` tag in `index.html` (line 9) has malformed HTML -- the SVG data URI is broken with HTML entities (`&quot;`, `&lt;`) and has duplicate `type` attributes. The browser renders the broken tag content as visible text.

**Fix:** Replace the broken favicon link with a properly formatted SVG data URI or reference the existing `public/favicon.ico`.

### Changes
- **`index.html`** (line 9): Replace the broken `<link rel="icon" ...>` with a clean reference: `<link rel="icon" href="/favicon.ico" />`

---

## 3. Finalized Baskets Don't Persist Status to Database

**Root cause:** When a basket is finalized (`isSaved: true` locally), the DB sync in `useCartPersistence` always upserts with `status: 'active'` (line 162). The `isSaved` flag is never written to the database. On re-login, all baskets load as `status: 'active'` and appear in Zone 1 instead of Zone 3.

**Fix:** Sync the finalized status to the database by setting `status: 'completed'` when `isSaved` is true. On restore, map `status: 'completed'` back to `isSaved: true`.

### Changes
- **`src/features/gpt-commerce/hooks/useCartPersistence.ts`**:
  - Load query (line 44): Fetch ALL baskets (remove `.eq('status', 'active')` filter, or fetch both `active` and `completed`)
  - Restore logic (line 54): Set `isSaved: true` on baskets with `status: 'completed'`
  - Sync upsert (line 162): Use `status: basket?.isSaved ? 'completed' : 'active'` instead of hardcoded `'active'`
  - Also trigger a sync when a basket is finalized (currently the debounce only fires on cart/message changes)

---

## 4. First Carousel Should Be More Promotional

**Root cause:** All carousels are identical in structure -- just subcategory listings. The user wants the first carousel to feel more like a "Hot Deals" / promotional section rather than another category.

**Fix:** Make the first carousel a cross-category "deals" section showing products with the highest discount percentages, regardless of subcategory. Title it something like "داغ‌ترین تخفیف‌ها" (Hottest Deals) with a fire emoji.

### Changes
- **`src/components/gpt-commerce/ProductCarousels.tsx`**:
  - Add a separate query for the first carousel that fetches products WHERE `original_price IS NOT NULL` and `original_price > price`, ordered by discount percentage descending, limited to 15
  - Render this "Hot Deals" carousel first, before the subcategory carousels
  - Give it a distinct gradient accent (red/orange) and a fire emoji

---

## Files Summary

| File | Change |
|---|---|
| `src/features/gpt-commerce/hooks/useCartPersistence.ts` | Fix landing redirect (always start on landing); persist `isSaved` as `status: 'completed'` in DB |
| `index.html` | Fix broken favicon link |
| `src/components/gpt-commerce/ProductCarousels.tsx` | Add cross-category "Hot Deals" carousel as first section |

