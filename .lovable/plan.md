## /shift v2 — clone /gptcommerce as a config-driven single-vendor product

Throw out what I built under `src/features/shift/**` and rebuild `/shift` as a **true clone of /gptcommerce and /m/gptcommerce** with single-vendor changes only. `/gptcommerce` and `/m/gptcommerce` themselves are **not touched** — same files, same routes, same behavior.

### Routing (final)

```
/shift            → desktop shell (clone of /gptcommerce)
/shift/m          → mobile shell (clone of /m/gptcommerce)
```

No `:instanceSlug` segments. One store per deploy. Brand comes from config (see below).

### What gets cloned (1:1, then edited)

Every file from these trees gets duplicated under `src/features/shift/` with identical structure, identical UI, identical UX:

- `src/features/gpt-commerce/**`  → `src/features/shift/desktop/**`
- `src/features/gpt-commerce/mobile/**` → `src/features/shift/mobile/**`
- `src/components/gpt-commerce/**` → `src/features/shift/components/**`
- `src/pages/GPTCommerce.tsx` → `src/pages/ShiftDesktop.tsx`
- `src/pages/MobileGPTCommerce.tsx` → `src/pages/ShiftMobile.tsx`
- `supabase/functions/gpt-commerce-agent/**` → `supabase/functions/shift-agent/**` (replace existing stub)

The clones reuse shared platform code (`@/components/ui/*`, `AuthContext`, `LanguageContext`, OTP modal, `toPersianNumber`, etc.) without copying. No edits to any `/gpt-commerce` file.

### Config-driven single store

New file `src/features/shift/config/store.ts`:

```ts
export const SHIFT_STORE = {
  slug: "shift",            // used in edge function for catalog scoping
  name_fa: "فروشگاه شیفت",
  tagline_fa: "...",
  logo_url: "...",
  hero_image_url: "...",
  theme_primary: "...",     // CSS var override
  theme_accent: "...",
  suggested_prompts: [...],
};
```

Swap the brand by editing this file. No DB lookup, no provider, no route param.

### Single-vendor changes applied to the clones

UI:
- Strip every vendor label, vendor logo, "از فروشگاه X"/"merchant" string, vendor avatar, vendor link.
- Strip per-vendor basket grouping in the sidebar — one flat basket.
- Strip per-vendor shipping sections and per-vendor order summaries — one shipping block, one total.
- Remove vendor disambiguation chips and "compare vendors" affordances.
- Account panel: keep profile + orders; remove any vendor switcher.
- Product cards: drop the vendor row; everything else (220×420, 1px stroke, square image, `+` and `ℹ️`) identical to /gptcommerce per project memory.

Data:
- Storefront queries `shift_products` scoped by `store_id` resolved from `SHIFT_STORE.slug` at startup (one query, cached).
- Cart writes to `shift_carts` keyed by `(user_id, store_id)`.
- Orders write to `shift_orders` with `store_id` set. No `merchant_id` anywhere in cart/order payloads.
- Existing `shift_stores`, `shift_products`, `shift_carts`, `shift_orders` tables stay as-is — already match this model.

Agent (`supabase/functions/shift-agent`):
- Rewrite to mirror `gpt-commerce-agent` architecture (Gemini-3-Flash via Lovable AI Gateway, AI SDK `streamText`, `toUIMessageStreamResponse`, `stepCountIs(50)`).
- System prompt: "You are a sales associate at <SHIFT_STORE.name_fa>. Only recommend products from this store. Never reference other stores, vendors, marketplaces, or comparisons. Speak as an employee of this store." Persian, warm, no markdown — matches existing agent tone memory.
- Tools (all `store_id`-scoped server-side, client cannot pass it): `search_catalog`, `get_product`, `add_to_cart`, `update_cart`, `remove_from_cart`, `recommend_related`. Tool results contain no vendor fields.
- Calls `shift_hybrid_search(store_id, ...)` (already exists in DB) for product search.
- Embeddings via existing `generate-embeddings` function against `shift_products`.

Cart/checkout flow:
- Identical 5-step Farsi flow from `/gptcommerce` (address → shipping → payment → review → success), one of each step (no per-vendor repetition).
- Real-time cart summary, single CTA enforcement, smart basket naming, auto-finalization, "more results" — all preserved from clones, just collapsed to single-vendor.

Persistence:
- Reuse the 1s debounced sync pattern from `useCartPersistence`. Write target = `shift_carts` instead of `baskets`. Same `CURRENT_VERSION` migration discipline. Same logout purge.

### What I'm deleting from the current /shift attempt

- `src/features/shift/views/AdminCatalogView.tsx`, `HomeView.tsx`, `SearchView.tsx`, `CartView.tsx`, `CheckoutView.tsx`, `OrdersView.tsx`, `ChatPanel.tsx`, `ShiftMobileApp.tsx`, `ShiftDesktopApp.tsx`, the context providers, `data/format.ts`, `data/types.ts`, `components/ProductCard.tsx`.
- `src/pages/ShiftDesktop.tsx` and `src/pages/ShiftMobile.tsx` (rewritten fresh).
- Routes in `src/App.tsx` with `:instanceSlug?` → replaced with `/shift` and `/shift/m`.
- `supabase/functions/shift-import-catalog` and `supabase/functions/shift-embed-products` — gone. Catalog gets loaded once by me via a one-off script using the existing `generate-embeddings` function; storefront has no admin surface, ever.

DB tables `shift_stores`, `shift_products`, `shift_carts`, `shift_orders` and the `shift_hybrid_search` RPC stay — they already fit the single-store model.

### Build order

1. Delete the failed `/shift` files and edge functions listed above.
2. Add `src/features/shift/config/store.ts`.
3. Duplicate `src/features/gpt-commerce/**` → `src/features/shift/desktop/**` and mobile equivalents; duplicate component dir; duplicate pages.
4. Re-register routes: `/shift` and `/shift/m`.
5. Apply single-vendor strip across the clones (vendor labels, grouping, summaries, shipping, disambiguation).
6. Wire all data calls to `shift_products` / `shift_carts` / `shift_orders` scoped by resolved `store_id`.
7. Rewrite `supabase/functions/shift-agent` matching gpt-commerce-agent's structure, with single-store system prompt and store-scoped tools.
8. Load catalog: you give me a CSV, I run a one-off import (no UI for it).
9. RTL/Farsi/numeric audit pass against project memory rules.

### Out of scope

- Any edit to `/gptcommerce`, `/m/gptcommerce`, or their components/edge function.
- Multi-instance Shift, instance switcher, admin UI, custom domains, real payments.
- Touching `/farsi`.

Confirm and I'll execute exactly this.