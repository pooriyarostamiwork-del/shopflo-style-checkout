

# Import New Product Dataset with AI Enrichment and Variant Support

## Overview

Import ~800-900 products from the new Digikala CSV (phones, laptops, peripherals, HDDs, etc.) into the existing catalog. AI will fill missing fields (brand, category, subcategory, description), and a new variant system (color options) will be added to the database, product model, and UI.

---

## Phase 1: Database Schema Update

Add a `color_options` column to the `products` table to store variant data (e.g., color choices).

```text
ALTER TABLE products ADD COLUMN color_options text[] DEFAULT '{}';
```

This stores the raw color/variant names extracted from the CSV's `Color_Options` field (e.g., `["مشکی", "طلایی", "آبی"]`).

---

## Phase 2: CSV Processor Update

Update `supabase/functions/process-csv-products/index.ts`:

**Add a new `file_type = "digikala_general"`** handler in `normalizeRow()` that maps:

| CSV Column | DB Column |
|---|---|
| `title` | `name` |
| `Final Price` | `price` (Persian numeral parsing) |
| `Original Price` | `original_price` |
| `Rate` | `rating` |
| `item_page_link` | `source_url` |
| `Color_Options` | `color_options` (split concatenated Persian color names) |
| `image` (multiline) | `image_url` + `image_urls` |
| `specs1`, `specs2` | `specs_raw` (for later AI parsing) |
| `description` | `description` |

**Color parsing logic**: The `Color_Options` field contains concatenated color names without separators (e.g., "طلاییمشکی"). Use a known color dictionary to split them:

```text
Known colors: مشکی, سفید, آبی, قرمز, طلایی, نقره ای, صورتی, سبز, بنفش, خاکستری, ...
```

**Category/subcategory will be left empty** initially -- filled by AI in Phase 3.

**Brand extraction**: Attempt to extract brand from product title using known brand list (سامسونگ, اپل, شیائومی, ایسوس, لنوو, etc.), otherwise leave for AI.

---

## Phase 3: AI Enrichment for Missing Data

Update `supabase/functions/enrich-products/index.ts` to also fill:

- **category** and **subcategory** (inferred from product name/specs)
- **brand** (if not extracted in Phase 2)
- **description** (if empty or truncated)
- **tags** (Persian search keywords)
- **reviews_summary**

The enrichment prompt will be updated to include category/subcategory assignment from the existing taxonomy plus new categories for phones and laptops:

```text
Existing: هدفون، هدست و هندزفری | دوربین دیجیتال | ساعت و مچ‌بند هوشمند | هارد اکسترنال | لوازم جانبی گوشی موبایل
New: گوشی موبایل | لپ تاپ | کیبورد و ماوس | تبلت
```

---

## Phase 4: Frontend Changes

### 4a. Update Product Interface

In `src/data/gptCommerceData.ts`, add `colorOptions` to the `Product` interface:

```text
colorOptions?: string[];
```

### 4b. Update Product Mapping

In `src/features/gpt-commerce/hooks/useAgentMessages.ts`, map `color_options` from DB to `colorOptions` in the Product object.

### 4c. Add Variant Selector to PDP

In `src/components/gpt-commerce/PDPProductComponent.tsx`, add a color selector section above the price:
- Show colored pills/chips for each color option
- Selected color is highlighted
- Visual-only for now (no separate pricing per variant)

### 4d. Update Agent Subcategories

In `supabase/functions/gpt-commerce-agent/index.ts`, add the new subcategories to the system prompt so the agent knows to search for phones, laptops, etc.

---

## Phase 5: Post-Import Pipeline

After insertion, run in sequence:
1. **enrich-products** (batched) -- fills missing category, subcategory, brand, description, tags
2. **generate-embeddings** (batched) -- generates vector embeddings for new products
3. Update `search_vector` trigger fires automatically on insert

---

## Files Modified

| File | Change |
|---|---|
| New migration SQL | Add `color_options text[]` column |
| `supabase/functions/process-csv-products/index.ts` | Add `digikala_general` file type handler with color parsing |
| `supabase/functions/enrich-products/index.ts` | Add category/subcategory/brand enrichment |
| `src/data/gptCommerceData.ts` | Add `colorOptions` to Product interface |
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | Map `color_options` field |
| `src/components/gpt-commerce/PDPProductComponent.tsx` | Add variant/color selector UI |
| `supabase/functions/gpt-commerce-agent/index.ts` | Add new subcategories to system prompt |

---

## Execution Order

1. Run DB migration (add column)
2. Deploy updated edge functions
3. Upload CSV via process-csv-products call
4. Run enrich-products in batches (fills AI data)
5. Run generate-embeddings in batches
6. Test search queries for new product categories

