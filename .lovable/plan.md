
## Scope
`/shift` only. Category-scoped AI agents, hierarchical master prompts (volumes → chapters), vendor-level personalization prompt, and per-category product tables. All content managed via direct DB edits.

## Data model (new tables, all `shift_*`)

**`shift_categories`**
- `id`, `slug` (unique, e.g. `pets`, `beauty`), `name_fa`, `products_table_name` (text, e.g. `shift_products_pets`), `is_active`, timestamps.

**`shift_master_prompts`**
- `id`, `category_id` (nullable — nullable = "custom prompt for a multi-category vendor"), `name`, `description`, `is_active`, timestamps.
- One "default" master prompt per category (enforced by partial unique index on `category_id` where `is_default = true`).

**`shift_prompt_volumes`**
- `id`, `master_prompt_id`, `title`, `order_index`, `is_active`, timestamps.

**`shift_prompt_chapters`**
- `id`, `volume_id`, `title`, `body` (long text — the actual prompt content), `order_index`, `is_active`, timestamps.

**`shift_stores` (extend)**
- Add `category_id` (nullable, FK to `shift_categories`).
- Add `master_prompt_id` (nullable, FK to `shift_master_prompts`) — override. If null, resolve to the category's default prompt.
- Add `vendor_prompt` (text, nullable) — brand-level personalization, single free-text field.

Resolution rule at runtime:
1. If `store.master_prompt_id` set → use it (this covers multi-category vendors with a custom prompt).
2. Else use the default master prompt for `store.category_id`.
3. Append `store.vendor_prompt` if present.

All new tables: RLS enabled, `service_role` full access, `authenticated`/`anon` read-only on `is_active = true` rows (agent function uses service role; no admin UI so no write policies needed).

## Per-category product tables

- Keep `shift_products` as-is for existing store (default category).
- New categories get their own table via migration, e.g. `shift_products_pets`, cloned from `shift_products` structure (same columns, indexes, triggers, RLS).
- `shift_categories.products_table_name` tells the agent which table to query.
- For the initial rollout: create `shift_categories` rows for **general** (points to `shift_products`) and **pets** (points to new `shift_products_pets`). Migrate `petplayground` store to `pets` category.

## Agent runtime (`supabase/functions/shift-agent`)

- On each request, load the active store (already done via slug).
- Resolve master prompt id (store override → category default).
- Fetch all active volumes for that master prompt ordered by `order_index`; for each, fetch active chapters ordered by `order_index`.
- Concatenate as:
  ```
  # <Volume title>
  ## <Chapter title>
  <chapter body>
  ...
  ```
- Append `\n\n# Brand Personalization\n<vendor_prompt>` if present.
- Append existing store context (name, currency, etc.).
- Use `shift_categories.products_table_name` for the hybrid search RPC. Create a parallel `shift_hybrid_search_pets` RPC (or a dynamic-table variant) for the new table; each category gets its own RPC to keep types/indexes clean.

## Files touched

- **Migrations (new):**
  - Create `shift_categories`, `shift_master_prompts`, `shift_prompt_volumes`, `shift_prompt_chapters` with RLS + grants.
  - Alter `shift_stores` add `category_id`, `master_prompt_id`, `vendor_prompt`.
  - Create `shift_products_pets` (clone of `shift_products` shape) + its search vector trigger + hybrid search RPC.
  - Seed: `general` category → `shift_products`; `pets` category → `shift_products_pets`. Seed a default master prompt with a starter volume+chapter for each. Assign existing Shift default store to `general`, `petplayground` to `pets`.
- **Edge function:** `supabase/functions/shift-agent/index.ts` — replace hardcoded system prompt with DB-assembled prompt; branch product search RPC by `store.category.products_table_name`.
- **Types:** regenerated after migration.
- **No frontend changes required** — chat UI is unchanged; store/category resolution is server-side.

## Out of scope
- No admin UI (direct DB edits only, per user).
- No changes to `/gptcommerce`.
- No product data migration between categories — new category tables start empty; import handled separately by user.
- No changes to cart/checkout flow.

## Verification
- Insert a chapter into the pets master prompt, hit `/shift/petplayground`, confirm agent behavior reflects the new chapter.
- Toggle `is_active=false` on a chapter/volume → agent no longer sees it.
- Set `store.master_prompt_id` on a store to a custom prompt → confirm override wins over category default.
- Set `vendor_prompt` on a store → confirm it appears appended in agent behavior.
- Confirm pets store queries `shift_products_pets` and default store still queries `shift_products`.
