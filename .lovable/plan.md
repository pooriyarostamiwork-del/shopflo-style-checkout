## Scope
Front-end only. No backend/edge function changes. Two scopes: `/m/gptcommerce` (mobile) and `/gptcommerce` (desktop).

---

## Part A — `/m/gptcommerce` (Mobile)

### A1. Header logotype too small to read
**File:** `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx` (lines ~383–389)
- Increase the logotype `<img>` height from `16px` → `24px` (auto width).
- The wordmark SVG has heavy padding inside its 1080×1080 viewBox, so the visible glyph height is ~⅓ of the rendered height. Bumping to 24px makes the readable text approach ~10–12px which matches the brand mark beside it.

### A2. Header logo (icon) shape — circle → square w/ same radius as footer logo
**File:** `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx` (lines ~374–382)
- Currently the mark wrapper uses `rounded-lg` (already square-ish). The visual "circle" appearance comes from the inner SVG. The footer logo uses `rounded-xl` on a square wrapper.
- Change wrapper from `rounded-lg` → `rounded-xl` and verify size `w-7 h-7` reads as a rounded square (matching footer's `rounded-xl` corner radius proportionally).
- (No change to gradient background.)

### A3. ChatProductCard — price spacing + button vertical centering
**File:** `src/components/gpt-commerce/ChatProductCard.tsx`
- Add explicit bottom margin under the price block (e.g. wrap price in container with `mb-3` or add `pb-3` to the price row) so it doesn't visually touch the divider.
- For the action row: replace `pt-3 mt-auto` + `min-h-[48px]` with a flex container that fills remaining space and centers content: `mt-auto flex-1 flex items-center min-h-[56px]` OR explicit `py-3` symmetric padding so buttons sit visually centered between the divider and card bottom.
- Keep border-top divider; ensure equal padding above and below the buttons.

### A4. "ادامه به پرداخت" button (cart tab) — should NOT open one-click checkout modal
**File:** `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx`
- Currently `MobileBottomSheet`'s `onCheckout={handleCheckout}` opens the legacy `CheckoutModalLocalized`. That modal is unrelated to the agentic flow.
- Change the wiring so that "ادامه به پرداخت" runs the same handler as "نهایی کردن پرداخت" (the in-chat agentic CTA).
- Update the prop passed to `<MobileBottomSheet>`:
  - `onCheckout={handleFinalizePurchase}` (instead of `handleCheckout`)
  - Remove the `showAICheckout`/`onAICheckout` split for the regular cart button so a single CTA labeled "ادامه به پرداخت" always triggers `handleFinalizePurchase`. This will close the sheet and inject the order-summary / address / shipping / payment components into the chat (existing agentic flow).
- The legacy `CheckoutModalLocalized` remains mounted but will no longer be opened from this path. (We leave the import/mount untouched to avoid back-end-adjacent risk; just nothing routes to it from mobile cart.)

---

## Part B — `/gptcommerce` (Desktop only)

### B1. Place logo + logotype in proper spaces
Two surfaces use the brand today:

**B1a. Sidebar header** — `src/components/gpt-commerce/Sidebar.tsx` (lines ~106–120)
- Currently shows: square logo image (or fallback icon) + `<h1>Flowcart</h1>` text.
- Replace text-only "Flowcart" `<h1>` with the SVG wordmark `flowcart-logotype.svg`.
- Keep the existing square brand mark on the right (RTL → mark on right, wordmark on left).
- Wordmark height: `20px` (auto width). Subtitle line ("دستیار خرید هوشمند") stays below.
- Layout: `flex items-center gap-3` (mark) + column with (wordmark img + subtitle).

**B1b. Landing welcome (`ChatLanding.tsx` lines ~197–216)**
- Currently: large square image OR fallback `<Zap>` icon, plus `<h1>Flowcart</h1>` text + subtitle.
- Replace the text `<h1>Flowcart</h1>` with the `flowcart-logotype.svg` wordmark, height `36px`.
- Keep the square brand mark above (`w-20 h-20 rounded-2xl`) — this becomes the hero icon.
- Subtitle stays unchanged.

**B1c. Footer** — `src/components/gpt-commerce/Footer.tsx` (lines ~69–83)
- Currently: small square mark + Persian text "فلوکارت".
- Replace the Persian text node with the `flowcart-logotype.svg` wordmark, height `16px`.
- Keep the small `w-8 h-8 rounded-lg` mark to its right (RTL).
- Subtitle paragraph stays.

(No header bar exists in desktop chat itself; the sidebar IS the persistent brand surface.)

### B2. Universal product image placeholder (use `<ProductImage />` everywhere)
Replace all remaining raw `<img src={... product.image ...} />` usages on desktop product surfaces with the `<ProductImage />` component (it already handles onError fallback to the Flowcart logo placeholder, identical to mobile).

**Files to update:**
1. `src/components/gpt-commerce/AgenticMessageComponents.tsx` — line ~165 (cart line items in order summary).
2. `src/components/gpt-commerce/AccountPanel.tsx` — line ~138 (orders list thumbnails) and line ~569 (order detail items).
3. `src/components/gpt-commerce/ProductQuickViewModal.tsx` — line ~112 (modal main image).
4. `src/components/gpt-commerce/RightPanel.tsx` — `CartItemCard` line ~65 (cart row thumbnail) and `FavoritesTab` line ~146 (favorites thumbnail).

Each replacement: swap `<img src={x} alt={y} className="…" />` → `<ProductImage src={x} alt={y} className="…" />`. Same className preserved so layout doesn't shift.

### B3. Hide بنر تبلیغاتی (promo banners) — do not delete
**File:** `src/components/gpt-commerce/ProductCarousels.tsx` (lines ~319–344, ~442–443)
- Add an early-return feature flag at the top of `HorizontalPromoBanner`:
  ```ts
  const SHOW_PROMO_BANNERS = false; // toggle to true to re-enable
  if (!SHOW_PROMO_BANNERS) return null;
  ```
- This hides both placements (`afterHotDeals`, `afterYouMayLike`) without touching the call sites or removing the component. Re-enable by flipping the flag.

---

## Files to be modified
- `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx` (A1, A2, A4)
- `src/components/gpt-commerce/ChatProductCard.tsx` (A3)
- `src/components/gpt-commerce/Sidebar.tsx` (B1a)
- `src/components/gpt-commerce/ChatLanding.tsx` (B1b)
- `src/components/gpt-commerce/Footer.tsx` (B1c)
- `src/components/gpt-commerce/AgenticMessageComponents.tsx` (B2)
- `src/components/gpt-commerce/AccountPanel.tsx` (B2)
- `src/components/gpt-commerce/ProductQuickViewModal.tsx` (B2)
- `src/components/gpt-commerce/RightPanel.tsx` (B2)
- `src/components/gpt-commerce/ProductCarousels.tsx` (B3)

No backend, edge function, schema, RLS, or types changes.
