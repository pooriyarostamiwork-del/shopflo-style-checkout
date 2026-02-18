

# Digikala CSV Data Import Plan

## Data Assessment Summary

Five CSV files were scraped from Digikala using WebScraper.io. Here is the breakdown:

| File | Category | Total Lines | Data Rows (non-empty) | Columns |
|------|----------|-------------|----------------------|---------|
| digikala-com-2026-02-18.csv | Headphones (هدفون) | 1454 | ~60-80 products | 27 cols: title, price, rate, seller, description, images, specs, category |
| digikala-com-2026-02-18-2.csv | Digital Cameras (دوربین دیجیتال) | 705 | ~30-40 products | 27 cols: title, prices (original+discount+final), SKU, description, images, specs, rezayat |
| digikala-com-2026-02-18-4.csv | Wearable Gadgets (ساعت هوشمند) | 2415 | ~100-120 products | 26 cols: title, rate, comments, seller, final price, images, variants, specs, description, brand |
| digikala-com-2026-02-18-5.csv | External Hard Disks (هارد اکسترنال) | 709 | ~30-40 products | 24 cols: title, prices, seller, description, images, variants, specs |
| digikala-com-2026-02-18-6.csv | Mobile Accessories (لوازم جانبی موبایل) | 883 | ~50-60 products | 36 cols: title, prices, rate, seller, description, images, specs, comments, brand, multi-level categories |

**Key Issues Found:**
1. Roughly 70-80% of rows in each file are completely empty (only contain the scraper order ID and URL)
2. Each file has a different column schema (different column names and order)
3. Prices are in Persian numerals with comma separators (e.g., "۱,۸۶۹,۰۰۰")
4. Some products are out of stock ("ناموجود")
5. Images are multi-line (newline-separated URLs within a single CSV cell)
6. Specs are raw concatenated text, not structured key-value pairs
7. Descriptions are sometimes truncated with "..."

## Implementation Plan

### Step 1: Create a CSV Processing Edge Function

Build a new edge function `process-csv-products` that:
- Accepts CSV text content + category metadata as POST body
- Parses CSV, skipping empty rows
- Normalizes the different column schemas into a unified format
- Converts Persian numerals to integers for prices
- Extracts image URLs from multi-line image cells
- Filters out "ناموجود" (out of stock) products with no price
- Returns cleaned JSON array of products

### Step 2: AI-Powered Data Enrichment

For each batch of cleaned products, call the Lovable AI (Gemini Flash) to:
- Generate clean, concise Persian product descriptions from truncated or missing descriptions
- Parse raw spec strings into structured `[{label, value}]` arrays
- Generate a brief review summary from comment count and rating data
- Standardize category/subcategory values to match our existing taxonomy
- Clean and standardize product names (remove redundant model numbers, fix spacing)

### Step 3: Insert into Database

- Clear existing 17 seed products from the database
- Insert all cleaned + enriched products in batches
- Assign merchant_id round-robin across m1-m5
- Preserve all Digikala CDN image URLs (these are real, working URLs)
- Set `source_url` from the `item_page_link` column

### Step 4: Update Agent Categories

Update the `gpt-commerce-agent` system prompt with the new category taxonomy that matches the imported data:
- الکترونیک > هدفون، هدست و هندزفری
- الکترونیک > دوربین دیجیتال
- الکترونیک > ساعت هوشمند
- الکترونیک > هارد اکسترنال
- کالای دیجیتال > لوازم جانبی گوشی موبایل

---

## Technical Details

### Column Mapping Per File

**File 1 (Headphones):**
```text
title -> name
Price -> price (parse Persian)
Product Title -> name (fallback)
RATE -> rating
Seller_Name -> (for metadata)
Product_Description -> description
image_1 -> image_urls (newline-split)
Specs 1, Specs 2 -> specs (AI-parsed)
COMMENT COUNT -> review_count
Category, Sub Category -> category, subcategory
```

**File 2 (Cameras):**
```text
product title -> name
final price -> price
original price -> original_price
discount -> (derive discount rate)
Rate -> rating
Product_Description -> description
image_1, image_3 -> image_urls
Spec -> specs (AI-parsed)
comment count -> review_count
rezayat -> (satisfaction percentage)
```

**File 4 (Wearables):**
```text
title_1 -> name
final price -> price
rate -> rating
Number_of_Comments -> review_count
descriptiom -> description
image_3, image_7 -> image_urls
specs1, specs 2 -> specs (AI-parsed)
bramd -> brand
variants -> (color/size info)
```

**File 5 (External HDD):**
```text
product title -> name
final price -> price
original price -> original_price
rate -> rating
Product_Description -> description
image_1, image_3 -> image_urls
specs1, specs 2 -> specs (AI-parsed)
variant -> (color/capacity info)
```

**File 6 (Mobile Accessories):**
```text
product title -> name
final price -> price
org price -> original_price
disc rate -> discount percentage
rate -> rating
Product_Description -> description
image_1, image_3 -> image_urls
specs 1, specs 2 -> specs (AI-parsed)
comment count -> review_count
brand -> brand
main cat, cat, sub cat, sub cat 2 -> category hierarchy
```

### Persian Number Parser
```text
Input: "۱,۸۶۹,۰۰۰"
Step 1: Replace ۰-۹ with 0-9
Step 2: Remove commas
Step 3: parseInt -> 1869000
```

### Spec Parser (AI prompt)
The raw specs look like: "نوع گوشیدو گوشیدو گوشینوع اتصالبلوتوثبلوتوث..."
AI will parse these into: `[{"label": "نوع گوشی", "value": "دو گوشی"}, {"label": "نوع اتصال", "value": "بلوتوث"}]`

### Data Quality Filtering
Products will be excluded if:
- No name or name is empty
- No price or price is 0
- Marked as "ناموجود" (out of stock) with no price
- No image URLs at all

### Estimated Final Product Count
After filtering empty rows and out-of-stock items: approximately **200-300 products** across 5 categories.

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/process-csv-products/index.ts` | NEW - CSV parser + AI enrichment edge function |
| `supabase/functions/gpt-commerce-agent/index.ts` | UPDATE - Adjust category list in system prompt |
| Database `products` table | CLEAR + INSERT - Replace seed data with real products |

### Execution Flow
1. Create the `process-csv-products` edge function
2. Deploy the function
3. For each CSV file, call the function with the file content and category metadata
4. The function parses, cleans, enriches via AI, and inserts into the database
5. Update the agent's category definitions
6. Test the GPT Commerce chat with the new product catalog

