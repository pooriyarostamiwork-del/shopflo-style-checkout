## Scope: /shift only — frontend + new shift_store_content table

### 1. Fix product card grid + clipped action bar

- `src/components/shift/ProductCarousels.tsx` (and any chat/grid product list): switch grid from 2 cols to **3 cols** on desktop (`grid-cols-2 md:grid-cols-3`), keep 1 col on small.
- `ChatProductCard.tsx`: card height is fixed `h-[420px]` causing bottom action bar to clip when constrained. Switch to `min-h` + `flex flex-col`, give action bar `mt-auto` with explicit `pb-3`, and reduce title min-height. Verify in 3-col layout.
- Card width: drop fixed `w-[240px]` in grids, use `w-full` so cards fit the 3-col track.

### 2. Single-vendor cleanup sweep (/shift only)

- Grep `src/components/shift/**` and `src/features/shift/**` for: `merchant`, `vendor`, `vendorSummaries`, `Store` icon, "فروشنده", "دیجی‌کالا", "آرایشی". Remove all merchant chips, "Other suppliers", per-vendor headers, per-vendor shipping breakdowns.
  - Files to verify: `ProductCard.tsx`, `ChatProductCard.tsx`, `RightPanel.tsx`, `AgenticMessageComponents.tsx`, `AccountPanel.tsx`, `AddressShippingSelector.tsx`, `PDPProductComponent.tsx`, `ProductQuickViewModal.tsx`, `ProductCarousels.tsx`.
- Cart state: refactor `useBasketState.ts` / `useCartPersistence.ts` (shift copies) so baskets store a flat `items[]` only. Remove any `groupByMerchant` / `vendorSummaries` consumers in shift UI; replace with single-store summary from `shiftData.calculateOrderSummary` (already flat — wire it everywhere).
- Storage keys: confirm everything in `src/features/shift/**` reads/writes `shift-*` keys only. Audit `useUserData`, `useCheckoutFlow`, `useCartPersistence`, `useAgentMessages`.
- Order history: queries hit `shift_orders` / `shift_carts` only. Remove any fallback to `orders` / `baskets`.
- Agent mapping: `useAgentMessages.ts` (shift) — strip `merchant_id` from request/response mapping; force `SHIFT_MERCHANT` on all returned products. Leave edge function as-is per your answer.

### 3. DB-driven editable content (per-store)

New table `public.shift_store_content` keyed by `store_id` + `content_key` with `is_active` toggle.

```
shift_store_content(
  id uuid pk,
  store_id uuid fk → shift_stores.id,
  content_key text,           -- e.g. 'home.tagline', 'home.promo_banner', 'home.logo_url'
  content_type text,          -- 'text' | 'image_url' | 'link'
  value text,
  is_active boolean default true,
  sort_order int default 0,
  created_at, updated_at
)
unique(store_id, content_key)
```

- Public read policy (anon + authenticated SELECT where `is_active = true`).
- Service role write only (you edit rows directly via backend table editor).
- Seed default content keys for the existing Shift store:
  - `home.tagline` → "دستیار خرید هوشمند شما"
  - `home.promo_banner` → "تا صد میلیون خیال جمع — فلوکارت هست، پول کم؟ کم‌کم!"
  - `home.promo_link_label` → "دریافت وام فلوپی"
  - `home.logo_url` → empty (falls back to default svg)
  - `chat.input_placeholder` → "«خودت برام خرید کن»"
  - `home.suggested_prompt_1/2/3`
  - `footer.copyright`

Frontend:

- New hook `useShiftStoreContent(storeId)` — fetches all active rows for store, returns `Map<content_key, value>` with a `get(key, fallback)` helper. Cached via React Query.
- New `ShiftContentProvider` mounted in `ShiftDesktop.tsx` / `ShiftMobile.tsx` after store resolution.
- Replace hardcoded copy in: `MobileShiftShell`, `ShiftShell`, `ChatLanding`, `MobileChatLanding`, `Footer`, header promo strip, logo `<img>`, suggested prompt chips. Each uses `content.get('key', defaultFallback)`.

### 4. Multi-store DB-driven routing

- Routes: `/shift/:slug?` (desktop) and `/shift/m/:slug?` (mobile). Missing slug → default `shift` store.
- New `useShiftStore(slug)` hook: queries `shift_stores` by slug, returns `{ id, slug, name_fa, theme_primary, theme_accent, logo_url, hero_image_url, ... }`. While loading → splash.
- Replace static `SHIFT_STORE` import: `src/features/shift/config/store.ts` becomes a fallback default + types. All shell components consume from new `ShiftStoreProvider` context (store row + content map).
- Apply theme: inject `--primary` / accent CSS vars from the store row at the shift root via inline style on the root `<div>`.
- Update `src/App.tsx` routes.
- Update `shiftData.ts`: `SHIFT_MERCHANT` becomes a factory `makeShiftMerchant(store)` so logo/name come from the active store.

### 5. /shift/petplayground store (seed only — no new components)

- Insert row in `shift_stores`: `slug='petplayground'`, `name_fa='پت‌پلی‌گراند'`, warm playful theme (`theme_primary='#F59E0B'` warm amber, `theme_accent='#FFF7ED'`), logo placeholder.
- Seed `shift_store_content` rows for petplayground with pet-themed copy:
  - tagline: "همراه مهربون حیوانات خانگی"
  - promo: "غذا، اسباب‌بازی، لوازم — همه‌چی برای کوچولوت"
  - suggested prompts: "یه اسباب‌بازی برای گربه‌م می‌خوام", "غذای خشک سگ پیشنهاد بده", "تشویقی سالم برای توله‌سگ"
- Paw loading animation: add `PawLoader.tsx` component (CSS-only walking paw prints). Use it as the loader inside `ChatThread` / search loaders **only when** active store slug === `petplayground`. Default store keeps current loader.
- No new routes file needed — `/shift/petplayground` and `/shift/m/petplayground` resolve through the dynamic slug route.

### 6. Verification

- Manual smoke: load `/shift`, `/shift/petplayground`, `/shift/m`, `/shift/m/petplayground`. Confirm:
  - 3-col grid on desktop, action bar fully visible.
  - No "فروشنده" / merchant chip / per-vendor section anywhere.
  - Cart sidebar shows single flat list + one summary block.
  - Petplayground shows amber theme, pet copy, paw loader during chat.
  - Toggling `is_active=false` on a content row removes/falls back in UI on refresh.

### Out of scope

- No edge function changes.
- No admin UI (direct DB edits only).
- No changes to `/gptcommerce`, `/m/gptcommerce`, vendor dashboard, or marketplace data.