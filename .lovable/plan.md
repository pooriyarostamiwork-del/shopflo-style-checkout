
# Refactor `/shift` to a Standalone Single-Vendor Storefront

Goal: `/shift` becomes a fully separate product (its own data layer, branding, storage, agent, and UI) that has zero notion of "merchants/vendors". Treat it as a white-label of gpt-commerce for one store. Frontend-only refactor + the existing `shift-agent` edge function.

---

## 1. Codebase Separation (independence from gpt-commerce)

### 1a. Own data module
Create `src/features/shift/data/shiftData.ts` by copying `src/data/gptCommerceData.ts`, then:
- Remove `Merchant`, `merchants[]`, `getMerchantShipping`, all merchant fields from `Product`, `CartItem`, `Order`.
- Replace `merchant` on `Product`/`CartItem` with nothing (single store implied).
- `Order.merchantGroups` → `Order.items` (flat).
- `calculateOrderSummary` returns a single flat summary: `{ items, subtotal, deliveryFee, discount, total }` — no `vendorSummaries`.
- Re-export helpers (`toPersianNumber`, `formatPersianPrice`, types).

Then sweep every `src/features/shift/**` and `src/components/shift/**` import:
`@/data/gptCommerceData` → `@/features/shift/data/shiftData`.

### 1b. Own assets & branding
- Add `src/features/shift/assets/shift-logo.svg` and `shift-logotype.svg` (placeholder copies for now, sourced from `store.ts` config later).
- Replace all `flowcartLogo` / `flowcartLogotype` imports in shift components with shift assets.
- Replace every hardcoded "فلوکارت" / "Flowcart" string with `storeConfig.name` (`src/features/shift/config/store.ts`).
- Strip the HomepageSettingsContext branding lookups (`firstPageLogo`, `chatModeLogo`, `footerLogo`, `getChatProductImage`) inside shift; use `storeConfig` + the product's own `image` instead. Remove `HomepageSettingsProvider` from `ShiftDesktop.tsx`/`ShiftMobile.tsx`.

### 1c. Own storage namespace
In `src/features/shift/hooks/useBasketState.ts` and `useCartPersistence.ts`:
- Rename all `flowcart-*` localStorage keys to `shift-*` (`shift-baskets`, `shift-active-basket`, `shift-basket-states`, `shift-storage-version`, `shift-global-addresses`).
- Bump version to `1` (fresh namespace, no migration from flowcart).

### 1d. Own agent endpoint
- `useAgentMessages.ts`: switch the `functions.invoke('gpt-commerce-agent', …)` call to `'shift-agent'`.
- Update `shift-agent` system prompt to reference `storeConfig.name` and remove any multi-merchant tool surface (it already calls `shift_hybrid_search` scoped to a store).

---

## 2. Cart Refactor (single-vendor)

### 2a. Sidebar cart (`src/components/shift/RightPanel.tsx`)
- Delete the `orderSummary.vendorSummaries.map(...)` block.
- Render one flat list: items → subtotal → delivery fee → discount → total.
- Remove vendor separators, vendor headers, per-vendor delivery/discount lines.

### 2b. In-chat cart (`src/components/shift/AgenticMessageComponents.tsx`)
- Remove `merchantGroups` reducer and `vendorSummaries`.
- Render flat order summary card with: items list, items count, subtotal, single delivery fee, single discount, grand total.
- Drop `CartItemInput.merchant`.

### 2c. Checkout shipping (`AddressShippingSelector.tsx` + `useCheckoutFlow.ts`)
- Replace `MerchantShipping[]` model with a single `ShippingOptions` shape: `{ methods: ShippingMethod[] }`.
- Remove per-merchant expand/collapse rows; show one flat shipping-method picker.
- `useCheckoutFlow.getMerchantShipping()` → `getShippingOptions()` returning one group.
- Update `selectedShippingByMerchant: Record<string,string>` → `selectedShippingId: string | null` everywhere (ShellState, ChatInterface, ChatThread, MobileBottomSheet).

### 2d. Order history (`AccountPanel.tsx`)
- Replace `order.merchantGroups.map` with `order.items.map`.
- Remove merchant name/logo rows in past orders.

---

## 3. Product Cards (single-vendor)

Apply to: `ProductCard.tsx`, `ChatProductCard.tsx`, `ProductCarousels.tsx`, `ProductQuickViewModal.tsx`, `ProductDetailsModal.tsx`, `PDPProductComponent.tsx`.

- Remove all `product.merchant.*` reads and JSX (name, logo, "فروشنده", "فروشنده‌های دیگر این محصول" block in PDP).
- Delete the `merchantMap` and merchant join in `ProductCarousels.tsx` data mapping.
- "Add to cart" no longer carries a merchant; the new flat `CartItem` has no merchant field.
- Rating, price, delivery badges stay — purely product-centric layout.

---

## 4. Shells & Routing
- `ShiftDesktop.tsx`/`ShiftMobile.tsx`: drop `HomepageSettingsProvider`.
- `ShiftShell.tsx` and `MobileShiftShell.tsx`: remove `merchants` import, remove `getMerchantShipping`, swap to flat shipping state, ensure header/sidebar/footer use `storeConfig`.
- No route changes (`/shift`, `/shift/m` stay).

---

## 5. Verification
- `tsgo` clean (no lingering `merchant` references in shift tree).
- Manual flow on `/shift` and `/shift/m`: search → add to cart → cart sidebar shows flat list → checkout shipping shows one group → order placed → order history shows flat items.
- `rg "merchant|vendor|flowcart|فلوکارت" src/features/shift src/components/shift` returns zero matches outside `data/shiftData.ts` type aliasing (if any) and `store.ts` comments.

---

## Out of scope
- No DB schema changes (shift_* tables already isolated).
- No new edge functions.
- Desktop visual redesign — preserve current layout, only strip vendor concepts.
- Vendor-dashboard (`/m/gptcommerce/dash`) untouched.
