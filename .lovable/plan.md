
# /shift — Multi-instance AI storefront platform (v1)

Brand-new single-merchant AI storefront product. Persian, RTL. Independent codebase under `src/features/shift/**`. Reuses only platform infrastructure (OTP auth, Lovable AI, UI primitives, RTL/typography). No vendor concept anywhere.

Shift ships as a **platform** that can host multiple store **instances**. v1 ships two instances:
1. **Raw Shift** — unbranded template store ("Shift Store"), demo catalog you upload.
2. **PetPlayground** — Iranian pet shop instance, separate catalog you upload.

Each instance has a desktop and a mobile experience.

---

## 1. Routes

```
/shift/desktop                       → Raw Shift, desktop
/shift/mobile                        → Raw Shift, mobile
/shift/desktop/petplayground         → PetPlayground, desktop
/shift/mobile/petplayground          → PetPlayground, mobile
```

`/shift` and `/shift/desktop` / `/shift/mobile` without an instance suffix resolve to the **raw** instance (slug `raw`). Adding a `/:instanceSlug` segment selects a different store row from the DB.

Routing wiring in `src/App.tsx`:
```
<Route path="/shift/desktop/:instanceSlug?" element={<ShiftDesktop />} />
<Route path="/shift/mobile/:instanceSlug?"  element={<ShiftMobile  />} />
```

Both pages call the same `ShiftStoreProvider` which loads the active store from `shift_stores` by slug (default `raw`). All branding (name, logo, hero, primary/accent colors, tagline) comes from that row — swapping instances is a slug change, not a code change.

No automatic device redirect. Like `/gptcommerce` and `/m/gptcommerce`, the two surfaces are independent URLs.

---

## 2. Database (new, isolated, multi-instance ready)

Same four tables as before, with `store_id` as the multi-instance key.

```text
shift_stores         id, slug (unique), name_fa, tagline_fa, logo_url,
                     theme_primary, theme_accent, hero_image_url,
                     currency, is_active, created_at, updated_at
shift_products       id, store_id (FK), name_fa, description_fa,
                     price, original_price, image_url, image_urls[],
                     category, subcategory, species, brand, tags[],
                     in_stock, stock_qty, rating, review_count,
                     specs jsonb, search_vector tsvector, embedding vector(768)
shift_carts          id, user_id, store_id, items jsonb, updated_at
                     UNIQUE(user_id, store_id)  -- one cart per (user, store)
shift_orders         id, user_id, store_id, items jsonb, subtotal,
                     shipping_cost, total, address jsonb, status, created_at
```

RLS:
- `shift_stores`, `shift_products`: public SELECT.
- `shift_carts`, `shift_orders`: `auth.uid() = user_id`.
- All GRANTs per platform rules.

SQL function `shift_hybrid_search(p_store_id uuid, p_query text, ...)` — clone of `hybrid_product_search`, always scoped to one store.

Trigger: `shift_products_search_vector_update` (mirrors existing pattern, reuses `normalize_persian`).

Seed inserts:
- 2 rows in `shift_stores`: slug `raw` (name "Shift Store", neutral theme) and slug `petplayground` (name "پت‌پلی‌گراند", warm pet-friendly theme).
- No products seeded — you upload catalogs (see section 6).

---

## 3. Edge function (new, single-store, instance-aware)

`supabase/functions/shift-agent/index.ts`:
- Request body: `{ messages, storeSlug }`.
- Server loads the store row, fetches `name_fa` + `tagline_fa`, builds the system prompt:
  > "You are a sales associate at <store.name_fa>. Only ever recommend products from this store's catalog. Never mention or compare other stores or brands outside this catalog."
- All tool calls (`search_catalog`, `get_product`, `add_to_cart`, `update_cart`, `remove_from_cart`, `recommend_related`) are scoped to `store_id` derived from the slug — the client cannot leak across instances.
- Model: `google/gemini-3-flash-preview` via Lovable AI Gateway (`LOVABLE_API_KEY`).
- Streams via AI SDK `toUIMessageStreamResponse`, `stepCountIs(50)`.

Embeddings: reuse the existing `generate-embeddings` function (same model + dimension) but invoked against `shift_products`.

---

## 4. Frontend (`src/features/shift/`)

```
src/features/shift/
  context/
    ShiftStoreContext.tsx        # loads store by slug (route param), exposes branding
    ShiftCartContext.tsx         # cart scoped to (user, storeId), debounced sync
    ShiftChatContext.tsx         # useChat → shift-agent, passes storeSlug
  data/
    types.ts                     # ShiftStore, ShiftProduct, ShiftCartItem, ShiftOrder
  hooks/
    useShiftCatalog.ts
    useShiftCart.ts
    useShiftOrders.ts

  shared/                        # surface-agnostic primitives (used by both desktop & mobile)
    ProductCard.tsx              # image, title, price, +, details. NO vendor anything
    ProductCarousel.tsx
    ProductDetailsModal.tsx
    CategoryChips.tsx
    HeroBanner.tsx
    EmptyState.tsx
    ShiftBottomSheet.tsx         # mobile sheet wrapper (RTL, overlay, safe-area)

  mobile/
    ShiftMobileShell.tsx
    ShiftMobileTopBar.tsx
    ChatHome.tsx                 # landing + thread
    ChatThread.tsx
    Composer.tsx
    CartSheet.tsx
    CheckoutSheet.tsx            # address → shipping → payment → confirm
    OrderHistory.tsx
    AccountPanel.tsx

  desktop/
    ShiftDesktopShell.tsx        # 3-column: sidebar (categories/account) | chat center | cart panel right
    ShiftDesktopTopBar.tsx
    ChatPanel.tsx
    CartPanel.tsx                # persistent right rail
    CheckoutDialog.tsx           # modal, multi-step
    OrderHistoryPage.tsx
    AccountDialog.tsx
```

Pages:
```
src/pages/ShiftDesktop.tsx       # wraps LanguageProvider(fa) + AuthProvider + ShiftStoreProvider(slug)
src/pages/ShiftMobile.tsx        # same, mobile shell
```

Reused from platform: `@/integrations/supabase/client`, `AuthContext`, `LanguageContext`, `toPersianNumber`, `components/ui/*`, OTP modal.

Nothing reused from `/gptcommerce` commerce code — cart, checkout, product card, chat thread, order summary are all rewritten for single-store.

---

## 5. UX shape

Chat-first on both surfaces. The difference is layout, not flow:

- **Mobile**: full-screen chat. Cart pill floats bottom; tapping opens `CartSheet`. Checkout is a stacked bottom sheet.
- **Desktop**: 3-column. Center = chat thread + composer. Right rail = persistent cart panel. Left rail = category chips + account. Checkout opens as a centered dialog.

Both surfaces:
- Hero/landing pulls `store.name_fa`, logo, tagline, hero image.
- Suggested prompts are store-aware (raw store gets generic prompts; PetPlayground gets pet-specific ones — stored in `shift_stores.suggested_prompts jsonb`, nullable).
- Active store's `theme_primary` / `theme_accent` injected as CSS variables on the shell root (`--shift-primary`, `--shift-accent`). All Shift components consume those tokens.

No vendor sections, no marketplace widgets, one flat cart, one address, one shipping, one payment, one order.

---

## 6. Catalog upload (your data)

You'll upload one catalog per instance. v1 supports CSV upload via the existing `csv-uploads` storage bucket.

Flow per instance:
1. You upload `raw.csv` and `petplayground.csv` to bucket `csv-uploads`.
2. New edge function `shift-import-catalog`:
   - Input: `{ store_slug, file_path }`.
   - Resolves `store_id` from slug, downloads CSV, parses, upserts into `shift_products` with `store_id` set.
   - Expected columns: `name_fa, description_fa, price, original_price, image_url, image_urls, category, subcategory, species, brand, tags, stock_qty, rating, specs`.
   - After upsert, batches embedding generation via existing `generate-embeddings` (scoped to the new rows).
3. I'll trigger the import once you upload each CSV, or you can call the function directly.

If you'd rather upload via a different format (JSON, Shopify export, etc.), say so and I'll adjust the parser.

---

## 7. Design

- Persian font + global tokens already in `src/index.css`.
- Per-instance theme via inline CSS variables on shell root, sourced from `shift_stores.theme_primary` / `theme_accent`.
- RTL: `dir="rtl"` inheritance + logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`). No `flex-row-reverse`. Persian digits via existing `toPersianNumber`.
- Product card: 1px stroke, no shadow, square image, title, price, `+` add, `جزئیات` details. Zero merchant labels.

---

## 8. Out of scope (v1)

- Real payments (mock confirmation).
- Admin UI for editing stores/catalogs (DB + import function only).
- Per-instance custom domains.
- Reviews submission.
- Returns, wishlists, loyalty.
- Auto device redirect between `/shift/desktop` and `/shift/mobile`.

---

## 9. Build order

1. Migration: `shift_stores`, `shift_products`, `shift_carts`, `shift_orders`, GRANTs, RLS, trigger, `shift_hybrid_search`.
2. Seed: 2 store rows (`raw`, `petplayground`).
3. Edge functions: `shift-agent`, `shift-import-catalog`. Register in `supabase/config.toml`.
4. Pages + routes + `ShiftStoreProvider` + types + contexts + hooks.
5. Shared components (ProductCard, carousel, details, sheet wrapper, hero, empty states).
6. Mobile shell + ChatHome/Thread/Composer + CartSheet + CheckoutSheet + OrderHistory + AccountPanel.
7. Desktop shell + ChatPanel + persistent CartPanel + CheckoutDialog + OrderHistoryPage + AccountDialog.
8. Wire OTP login through existing modal on both surfaces.
9. You upload `raw.csv` and `petplayground.csv` → I run the importer for each.
10. Polish: RTL audit, empty states, 429/402 error toasts, theme overrides per instance.

End state: four URLs (`/shift/desktop`, `/shift/mobile`, `/shift/desktop/petplayground`, `/shift/mobile/petplayground`) each render a fully branded, chat-driven Persian single-store experience backed by a clean multi-instance schema, ready for additional instances by adding rows to `shift_stores`.
