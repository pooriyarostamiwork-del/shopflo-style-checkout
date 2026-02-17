

# AI-Powered Product Search for /gptcommerce

## Overview

Transform the /gptcommerce chat from hardcoded keyword matching (36 products, 6 categories) into a real AI-powered shopping assistant backed by a database of 10,000+ products scraped from Digikala.

## Phase 1: Infrastructure Setup

### 1.1 Enable Lovable Cloud
- Activate Cloud for database, edge functions, and secrets management
- This gives us Supabase (Postgres DB + Edge Functions) and auto-provisions `LOVABLE_API_KEY`

### 1.2 Connect Firecrawl
- Link the Firecrawl connector to the project for web scraping capabilities
- This injects `FIRECRAWL_API_KEY` as an environment variable

## Phase 2: Database Schema

### 2.1 Create `products` table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| name | text | Persian product name |
| description | text | Persian description |
| price | integer | Price in Toman |
| original_price | integer (nullable) | Original price for discount display |
| image_url | text | Product image URL |
| category | text | Top-level category |
| subcategory | text (nullable) | Subcategory |
| brand | text (nullable) | Brand name |
| merchant_id | text | References merchant (m1-m5) |
| rating | numeric | 1.0-5.0 |
| review_count | integer | Number of reviews |
| in_stock | boolean | Availability |
| fast_delivery | boolean | Express shipping available |
| return_guarantee | boolean | Return policy |
| tags | text[] | Persian search keywords |
| source_url | text (nullable) | Original Digikala URL |
| created_at | timestamptz | Auto-generated |

### 2.2 Full-text search index
- Create a GIN index on `name`, `description`, and `tags` for fast Persian text search
- Add a `search_vector` tsvector column with a trigger to auto-update

## Phase 3: Digikala Scraping Pipeline

### 3.1 Edge Function: `scrape-digikala`

A pipeline edge function that:

1. Uses Firecrawl's **map** endpoint to discover product URLs from Digikala category pages
2. Uses Firecrawl's **scrape** with JSON extraction to pull structured product data (name, price, image, specs, rating)
3. Inserts products into the `products` table

Target categories (10+ URLs per category):
- Electronics (laptops, phones, headphones, smartwatches)
- Home & Kitchen (appliances, cookware, decor)
- Beauty & Personal Care (skincare, makeup, fragrance)
- Fashion (clothing, shoes, accessories)
- Sports & Fitness (equipment, supplements, apparel)
- Baby & Kids (feeding, toys, safety)
- Books & Stationery
- Food & Grocery (coffee, tea, snacks)
- Gaming (peripherals, consoles, accessories)
- Tools & Garden

### 3.2 Scraping Strategy

Each Digikala category page lists ~20-40 products. We target:
- ~30 category/subcategory URLs
- ~20-40 products per page
- Multiple pages per category via pagination
- Target: 10,000+ unique products

The scrape function will be invokable manually (or via a simple admin trigger) to populate the database. It runs in batches to stay within Firecrawl rate limits.

## Phase 4: AI Agent Edge Function

### 4.1 Edge Function: `gpt-commerce-agent`

Uses Lovable AI (Gemini 3 Flash) with **tool calling** for natural language shopping.

**System prompt** (in Persian): Acts as Flowcart shopping assistant, understands Persian queries, provides contextual product recommendations.

**Tools available to the AI:**

| Tool | Parameters | What it does |
|------|-----------|--------------|
| `search_products` | query, category?, max_price?, min_rating? | Full-text search on products table, returns top 6 matches |
| `get_product_details` | product_id | Returns full product info for a specific item |
| `recommend_products` | intent (gift/routine/budget/safety/lifestyle) | Returns curated recommendations based on shopping intent |

The AI returns structured JSON responses that the frontend renders:
- Text response (Persian)
- Product list (array of product objects)
- Quick replies (suggested follow-up actions)

### 4.2 Response Format

The edge function returns a JSON object:
```text
{
  "content": "Persian text response",
  "products": [...],  // Array of product objects from DB
  "quickReplies": [...],  // Optional suggested actions
}
```

No streaming needed for this use case since we need structured tool-call results, not free-form text.

## Phase 5: Frontend Integration

### 5.1 Update `GPTCommerce.tsx`

Replace the hardcoded `handleSendMessage` logic (lines ~500-690) with:

1. Send user message to `gpt-commerce-agent` edge function
2. Parse structured response
3. Map DB products to existing `Product` interface
4. Render using existing `ChatProductCard` components
5. Cart/checkout/address flows remain unchanged (client-side)

### 5.2 Product Interface Mapping

The DB product schema maps directly to the existing `Product` interface:
- `merchant_id` maps to the existing `merchants` array (m1-m5)
- Images come from Digikala's CDN (scraped URLs)
- Prices are already in Toman

### 5.3 What stays the same
- All cart management (add/remove/quantity)
- Checkout flow via Flowcart modal
- Address/payment selection
- Basket/sidebar management
- Product card rendering (ChatProductCard)
- Landing page carousels (keep existing mock products for carousel display)

### 5.4 What changes
- Chat message handling: API call instead of keyword matching
- Product results come from DB instead of hardcoded arrays
- AI understands any Persian query, not just predefined keywords
- Fallback: if edge function fails, gracefully show error message

## Phase 6: Landing Page Carousels

Keep the existing mock products for the landing carousels (they work well for the demo), but add a "search all products" prompt in the chat suggestions that demonstrates the full AI search capability.

## Implementation Order

1. Enable Lovable Cloud
2. Connect Firecrawl
3. Create `products` table migration
4. Build `scrape-digikala` edge function
5. Run initial scrape to populate DB
6. Build `gpt-commerce-agent` edge function with Lovable AI + tool calling
7. Update `GPTCommerce.tsx` to call the agent
8. Test end-to-end

## Technical Details

- **AI Model**: google/gemini-3-flash-preview (default, fast and capable)
- **Database**: Supabase Postgres via Lovable Cloud
- **Scraping**: Firecrawl connector (JSON extraction mode)
- **Product Search**: Postgres full-text search with Persian tsvector
- **Edge Functions**: 2 new functions (`scrape-digikala`, `gpt-commerce-agent`)
- **Frontend**: Minimal changes -- only `handleSendMessage` in `GPTCommerce.tsx` is rewritten
- **No breaking changes**: All existing UI components, cart logic, and checkout flows are preserved

