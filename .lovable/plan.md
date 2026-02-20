# Codebase Restructuring Plan: Keep Only /farsi and /gptcommerce

## Current State Summary

The project currently has 9 pages and many components. After a thorough line-by-line review, here is exactly what belongs to each product and what is shared.

---

## Two Products to Keep

### Product 1: `/farsi` (Persian Checkout Store)

Entry: `src/pages/IndexFarsi.tsx` — a self-contained Digikala-style storefront in Persian/RTL

### Product 2: `/gptcommerce` (Conversational AI Shopping)

Entry: `src/pages/GPTCommerce.tsx` — the full agentic chat commerce experience

---

## Pages to Delete (6 pages)


| Page File                         | Route               | Reason                                                                    |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `src/pages/Index.tsx`             | `/`                 | English demo version — not a real product                                 |
| `src/pages/AgenticCheckout.tsx`   | `/agenticcheckout`  | Old English agentic demo — superseded by GPTCommerce                      |
| `src/pages/MerchantDashboard.tsx` | `/merchant`         | Merchant analytics dashboard — removed per request                        |
| `src/pages/UniversalVersion.tsx`  | `/universalversion` | Universal language-toggle demo — not a real product                       |
| `src/pages/HomepagePanel.tsx`     | `/homepagepanel`    | Admin panel for GPTCommerce — kept as a tool only if GPTCommerce needs it |
| `src/pages/PDPChat.tsx`           | `/pdp`              | PDP variant — absorbed into GPTCommerce                                   |


Note on `HomepagePanel`: It drives the `HomepageSettingsContext` which is **actively used** by GPTCommerce components (`ChatInterface`, `ChatProductCard`, `ProductCard`, `ProductCarousels`, `RightPanel`, `PDPProductComponent`, `ProductQuickViewModal`, `Footer`). **HomepagePanel page is deleted but the context is kept.**

---

## Components to Delete (exclusively used by removed pages)

### `src/components/merchant/` — entire folder (8 files)

All used only by `MerchantDashboard.tsx`:

- `AIAssistantBubble.tsx`
- `CheckoutHeatPulse.tsx`
- `CommerceNetworkInsights.tsx`
- `ConversionAstrology.tsx`
- `FutureModuleCard.tsx`
- `KPICard.tsx`
- `LiveCheckoutPresence.tsx`
- `QuickActionsToolbar.tsx`

### Root components used ONLY by removed pages

These are only imported by `Index.tsx`, `AgenticCheckout.tsx`, and `UniversalVersion.tsx` — not by `/farsi` or `/gptcommerce`:

- `src/components/Header.tsx` — only `Index.tsx`
- `src/components/Footer.tsx` — only `Index.tsx`
- `src/components/HeaderUniversal.tsx` — only `UniversalVersion.tsx`
- `src/components/FooterUniversal.tsx` — only `UniversalVersion.tsx`
- `src/components/CartItem.tsx` — only `Index.tsx` and `CheckoutModal.tsx`
- `src/components/OrderSummary.tsx` — only `Index.tsx`
- `src/components/CheckoutModal.tsx` — only `Index.tsx` and `AgenticCheckout.tsx`
- `src/components/SuccessScreen.tsx` — only `Index.tsx` and `AgenticCheckout.tsx`
- `src/components/RecommendedProducts.tsx` — only `Index.tsx` and `UniversalVersion.tsx`
- `src/components/ModeSelector.tsx` — only `Index.tsx` and `UniversalVersion.tsx`
- `src/components/AgenticChatInterface.tsx` — only `AgenticCheckout.tsx`
- `src/components/FilterChips.tsx` — only `AgenticCheckout.tsx`
- `src/components/ProductCard.tsx` (root) — only `AgenticCheckout.tsx`
- `src/components/NavLink.tsx` — not used by any kept page (verify below)
- `src/components/AutoReorderOptions.tsx` — only `CheckoutModal.tsx` (being deleted)

### Data file to delete

- `src/data/agenticData.ts` — only used by `AgenticCheckout.tsx` and `ProductCard.tsx` (root)
- `src/data/merchantData.ts` — only used by `MerchantDashboard.tsx`

---

## Components and Files to KEEP (used by /farsi or /gptcommerce)

### Used by `/farsi` (IndexFarsi.tsx)

- `src/components/CheckoutModalLocalized.tsx` ✓
- `src/components/SuccessScreenLocalized.tsx` ✓
- `src/components/CartItemLocalized.tsx` ✓
- `src/components/OrderSummaryLocalized.tsx` ✓
- `src/components/AutoReorderOptionsLocalized.tsx` ✓
- `src/components/EnhancedUpsellCarouselLocalized.tsx` ✓
- `src/components/CouponSelectorLocalized.tsx` ✓
- `src/components/AddressSelectorLocalized.tsx` ✓
- `src/data/checkoutModes.ts` ✓ (also used by GPTCommerce)
- `src/types/checkout.ts` ✓
- `src/i18n/` ✓

### Used by `/gptcommerce` (GPTCommerce.tsx)

- All of `src/components/gpt-commerce/` ✓
- `src/components/CheckoutModalLocalized.tsx` ✓
- `src/components/SuccessScreenLocalized.tsx` ✓
- `src/contexts/HomepageSettingsContext.tsx` ✓ (used by 7 gpt-commerce components)
- `src/contexts/AuthContext.tsx` ✓
- `src/data/gptCommerceData.ts` ✓
- `src/data/checkoutModes.ts` ✓

### CartItem.tsx — Special Case

`CheckoutModalLocalized.tsx` imports `CartProduct` type from `./CartItem`. This is a type-only import. When `CartItem.tsx` is deleted, this import line in `CheckoutModalLocalized.tsx` must be updated to import `CartProduct` from `./CartItemLocalized` instead (the type is identical).

---

## App.tsx Changes

Remove all routes except `/farsi` and `/gptcommerce`, remove all deleted page imports, and remove `HomepageSettingsProvider` wrapper (it still needs to remain since GPTCommerce's child components use it — actually keep it).

Revised `App.tsx` routes:

- `/` → redirect to `/farsi` (or `/gptcommerce`) — need to decide, or show a simple landing/picker
- `/farsi` → `IndexFarsi` with `FarsiLayout`
- `/gptcommerce` → `GPTCommerce`
- `*` → `NotFound`

---

## Complete File-by-File Deletion List

### Pages (6 files)

1. `src/pages/Index.tsx`
2. `src/pages/AgenticCheckout.tsx`
3. `src/pages/MerchantDashboard.tsx`
4. `src/pages/UniversalVersion.tsx`
5. `src/pages/HomepagePanel.tsx`
6. `src/pages/PDPChat.tsx`

### Components — Root Level (15 files)

7. `src/components/Header.tsx`
8. `src/components/Footer.tsx`
9. `src/components/HeaderUniversal.tsx`
10. `src/components/FooterUniversal.tsx`
11. `src/components/CartItem.tsx`
12. `src/components/OrderSummary.tsx`
13. `src/components/CheckoutModal.tsx`
14. `src/components/SuccessScreen.tsx`
15. `src/components/RecommendedProducts.tsx`
16. `src/components/ModeSelector.tsx`
17. `src/components/AgenticChatInterface.tsx`
18. `src/components/FilterChips.tsx`
19. `src/components/ProductCard.tsx` (root-level only, NOT `gpt-commerce/ProductCard.tsx`)
20. `src/components/NavLink.tsx`
21. `src/components/AutoReorderOptions.tsx`

### Components — Merchant Folder (8 files)

22–29. All files in `src/components/merchant/`

### Data Files (2 files)

30. `src/data/agenticData.ts`
31. `src/data/merchantData.ts`

### Context (1 file)

32. `src/contexts/HomepageSettingsContext.tsx` — **KEPT** (used by GPTCommerce)

---

## Files Requiring Code Edits (not just deletion)

### 1. `src/App.tsx`

- Remove imports for deleted pages
- Remove `HomepageSettingsProvider` import only if context is removed (keep it — GPTCommerce needs it)
- Remove routes: `/`, `/agenticcheckout`, `/merchant`, `/universalversion`, `/homepagepanel`, `/pdp`, `/farsi/agenticcheckout`, `/farsi/merchant`
- Add a root `/` route redirecting to `/farsi` or showing a simple picker

### 2. `src/components/CheckoutModalLocalized.tsx` (line 15)

- Change `import { CartProduct } from "./CartItem"` → `import { CartProduct } from "./CartItemLocalized"` since `CartItem.tsx` is being deleted. The `CartProduct` type is defined identically in both files.

### 3. `src/components/LanguageLayout.tsx`

- Remove `EnglishLayout` export (only used by deleted English routes) or keep it if harmless — keeping it causes no issues since it's just a component

---

## What the `/` Root Route Will Show

Two options — I recommend Option A:

- **Option A**: Redirect `/` to `/farsi` automatically (since it's the primary product)
- **Option B**: Redirect `/` to `/gptcommerce`
- **Option C**: Show a simple two-button landing page: "فلوکارت" and "GPT Commerce"

The plan will implement **Option C**

---

## Summary of Changes

- **31 files deleted**
- **3 files edited** (App.tsx, CheckoutModalLocalized.tsx, optionally LanguageLayout.tsx)
- **0 database changes** needed
- **0 shared logic broken** — all dependencies mapped and accounted for