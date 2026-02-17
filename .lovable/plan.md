

# Fix Product Photos, Descriptions, Other Sellers Pricing, and Markdown Rendering

## Problem Summary

1. **No product photos**: DB has placeholder URLs like `https://example.com/product1.jpg`. The scraper didn't capture real image URLs.
2. **No product descriptions**: The `description` column is empty for most products. The PDP component uses hardcoded mock text instead of DB data.
3. **Other Sellers pricing**: Uses hardcoded static prices unrelated to the actual product price.
4. **Markdown not rendering**: Chat messages use `whitespace-pre-wrap` plain text rendering -- markdown syntax shows as raw text.

---

## Fix 1: Product Images

### 1a. Update DB schema -- add `image_urls` column (text array)
- Add migration: `ALTER TABLE products ADD COLUMN image_urls text[] DEFAULT '{}'::text[];`
- Keep the existing `image_url` column as the primary/thumbnail image.
- `image_urls` stores all gallery images for the PDP slider.

### 1b. Update scraper (`scrape-digikala`)
- Add `image_urls` to the Firecrawl extraction schema: `{ type: "array", items: { type: "string" }, description: "All product image URLs from the gallery" }`
- Map scraped `image_urls` into both `image_url` (first one) and `image_urls` (all) during DB insert.

### 1c. Update seed data with real Digikala CDN image URLs
- Replace `https://example.com/product1.jpg` style URLs with actual working Digikala product image URLs (e.g., `https://dkstatics-public.digikala.com/digikala-products/...`).
- Some seeded products already have Digikala URLs -- keep those, fix the rest.

### 1d. Update `Product` interface in `gptCommerceData.ts`
- Add optional `imageUrls?: string[]` field.

### 1e. Update `mapDbProduct` in `GPTCommerce.tsx`
- Map `image_urls` from DB to `imageUrls` on the Product interface.
- Use `image_url` as the primary `image` field (no fallback to Unsplash placeholder if URL exists).

### 1f. Update `PDPProductComponent.tsx`
- Replace `getProductImages()` mock function: use `product.imageUrls` if available, otherwise fall back to `[product.image]`.
- The image slider already works -- just needs real data piped in.

### 1g. Update `ChatProductCard.tsx`
- Currently uses `getChatProductImage()` from HomepageSettings context. For DB products, the `product.image` field already contains the URL. Ensure it falls through correctly (it should, since `getChatProductImage` returns the passed image if no override exists).

---

## Fix 2: Product Descriptions, Specs, and Reviews

### 2a. Update DB schema -- add `specs` and `reviews_summary` columns
- Add migration:
  - `ALTER TABLE products ADD COLUMN specs jsonb DEFAULT '[]'::jsonb;`
  - `ALTER TABLE products ADD COLUMN reviews_summary text DEFAULT '';`

### 2b. Update scraper (`scrape-digikala`)
- Add to Firecrawl extraction schema:
  - `description`: "Full product description in Persian from the product page"
  - `specs`: "Array of {label, value} objects for technical specifications"
  - `reviews_summary`: "Summary of user reviews in Persian"

### 2c. Update `PDPProductComponent.tsx`
- Accept `description`, `specs`, and `reviewsSummary` from the product data instead of using mock functions.
- For the "توضیحات محصول" tab: show `product.description` or "توضیحی برای این محصول ارائه نشده است."
- For the "مشخصات فنی" tab: show `product.specs` array or "مشخصات فنی برای این محصول ارائه نشده."
- For the "نظرات محصول" tab: show `product.reviewsSummary` or "نظری برای این محصول ارائه نشده."

### 2d. Update `Product` interface
- Add optional fields: `description?: string`, `specs?: Array<{label: string, value: string}>`, `reviewsSummary?: string`.

### 2e. Update `mapDbProduct` in `GPTCommerce.tsx`
- Map `description`, `specs`, `reviews_summary` from DB to the Product interface.

---

## Fix 3: Other Sellers Pricing

### Update `getOtherSuppliers` in `PDPProductComponent.tsx`
- Change from hardcoded static prices to dynamically generated prices based on the product's actual price.
- Each supplier price = `product.price * (1 + random(-0.10, +0.10))`, rounded to nearest 10,000 Toman.
- Pass `product.price` into the function instead of just `productId`.

---

## Fix 4: Markdown Rendering in Chat

### 4a. The chat message bubble (line 489 in `ChatInterface.tsx`) currently renders:
```
<p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
  {msg.content}
</p>
```
This shows raw markdown (bold, lists, etc.) as plain text.

### 4b. Create a simple `MarkdownContent` component
- Parse basic markdown inline: `**bold**`, `*italic*`, line breaks, bullet lists.
- Use a lightweight approach with regex replacements and `dangerouslySetInnerHTML` or a small component tree, avoiding heavy dependencies.
- Alternatively, strip markdown formatting on the edge function side before returning content by adding instructions to the AI system prompt to not use markdown.

### 4c. Recommended approach: Add to the AI system prompt
- Add instruction: "پاسخ‌ها رو بدون فرمت مارک‌داون بنویس. از ستاره، هشتگ، و علائم مارک‌داون استفاده نکن."
- This is the simplest fix -- no frontend changes needed.
- Additionally, clean the response on the frontend as a safety net: strip `**`, `*`, `#`, `- ` patterns from `msg.content` before rendering.

---

## Technical Details: Implementation Order

1. Database migration (add `image_urls`, `specs`, `reviews_summary` columns)
2. Update `Product` interface in `gptCommerceData.ts`
3. Update `mapDbProduct` in `GPTCommerce.tsx`
4. Update `PDPProductComponent.tsx` (use real data + dynamic supplier pricing)
5. Update `ChatInterface.tsx` (markdown stripping/rendering)
6. Update `gpt-commerce-agent` system prompt (no markdown output)
7. Update `scrape-digikala` edge function (extract images, description, specs, reviews)
8. Update seed data with real image URLs (SQL UPDATE)
9. Deploy edge functions

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/new_migration.sql` | Add `image_urls`, `specs`, `reviews_summary` columns |
| `src/data/gptCommerceData.ts` | Add optional fields to `Product` interface |
| `src/pages/GPTCommerce.tsx` | Update `mapDbProduct` to include new fields |
| `src/components/gpt-commerce/PDPProductComponent.tsx` | Use real product data for description/specs/reviews; dynamic supplier pricing |
| `src/components/gpt-commerce/ChatInterface.tsx` | Add markdown stripping to message content rendering |
| `supabase/functions/gpt-commerce-agent/index.ts` | Update system prompt to avoid markdown |
| `supabase/functions/scrape-digikala/index.ts` | Add image_urls, description, specs, reviews to extraction |
| SQL data update | Replace placeholder image URLs with real ones |

