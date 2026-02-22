

# Hybrid Product Search Engine - Complete Overhaul

## Current State vs Target

The current search pipeline achieves ~35-40% accuracy due to:
- AND-joined full-text search (all words must match)
- No ranking (arbitrary result order)
- No fuzzy matching (typos/synonyms fail)
- No semantic understanding
- Persian half-space tokenization issues
- Trailing slash in subcategory data (`لوازم جانبی گوشی موبایل/`)
- 46 products with empty tags

Target: 80-90% accuracy using your proposed 4-layer hybrid architecture.

## Implementation Phases

### Phase 1: Foundation (35% to 65-75%)

**1A. Database Schema Changes (Migration)**

- Enable `pg_trgm` extension for fuzzy matching
- Enable `vector` extension (pgvector) for future embeddings
- Add `embedding vector(768)` column to products
- Fix subcategory trailing slash data
- Update `products_search_vector_update()` trigger to normalize Persian text (half-spaces, Arabic chars)
- Create GIN trigram index on `name`
- Re-trigger search_vector generation for all 454 products

**1B. Create `hybrid_product_search` SQL Function**

Combines 3 scoring signals (embeddings added in Phase 2):

```text
FinalScore =
  0.35 * ts_rank (full-text, OR-joined via websearch_to_tsquery)
+ 0.25 * trigram_similarity(name, query)
+ 0.25 * trigram_similarity(tags_text, query)
+ 0.15 * structured_match_boost (subcategory match)
```

With hard filters: price, rating, subcategory, in_stock.
Returns top 20 candidates sorted by score.

**1C. Rewrite `gpt-commerce-agent` Edge Function**

Replace the current naive search with a 3-step pipeline:

Step 1 - Structured Intent Extraction (1st LLM call with tool_choice forced):
- New `search_products` tool schema with `query_text`, `subcategory`, `filters` (price_min, price_max, brand, features), `semantic_tags`
- LLM extracts structured intent, NOT keyword strings

Step 2 - Hybrid Retrieval:
- Normalize Persian text on query
- Call `hybrid_product_search` RPC with extracted filters
- Get top 20 ranked candidates

Step 3 - LLM Re-Ranker + Response (2nd LLM call):
- Send top 10 candidates + original user query + extracted intent
- LLM re-ranks by alignment, removes mismatches
- Returns final 3-6 products + natural language response

**1D. Persian Normalization Utility**

Applied to both search queries and search_vector generation:
- Half-space (ZWNJ) to regular space
- Arabic ي to Persian ی
- Arabic ك to Persian ک
- Collapse multiple spaces
- Remove diacritics

### Phase 2: Embeddings Layer (75% to 85-90%)

**2A. Create `generate-embeddings` Edge Function**

- Batch process all 454 products
- Generate embedding from: `name + " " + description + " " + tags.join(" ")`
- Uses Lovable AI embedding endpoint
- Stores in `embedding` column

**2B. Update `hybrid_product_search` to Include Vector Similarity**

Updated scoring:
```text
FinalScore =
  0.30 * ts_rank
+ 0.20 * trigram_similarity
+ 0.30 * cosine_similarity (embedding)
+ 0.20 * structured_match_boost
```

**2C. Generate Query Embeddings at Search Time**

In the agent edge function, generate embedding for the user's original query and pass to the hybrid search RPC.

### Phase 3: Data Quality

**3A. Re-enrich Products with Empty Tags**

46 products have empty tags. Run `enrich-products` to fill these gaps, improving FTS and trigram coverage.

---

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| Database migration | Create | Enable pg_trgm, vector; add embedding column; fix subcategory slash; update search_vector trigger; create hybrid_product_search function; create indexes |
| `supabase/functions/gpt-commerce-agent/index.ts` | Rewrite | New 3-step pipeline: intent extraction, hybrid retrieval via RPC, LLM re-ranker |
| `supabase/functions/generate-embeddings/index.ts` | Create | Batch generate embeddings for all products |
| `supabase/config.toml` | Update | Add generate-embeddings function config |

## Technical Details

### New Tool Schema for Intent Extraction

```text
search_products:
  query_text: string (cleaned keywords for FTS)
  subcategory: string | null (exact match filter)
  filters:
    price_min: number | null
    price_max: number | null
    brand: string[] | null
    features: string[] | null (wireless, noise_canceling, waterproof...)
  semantic_tags: string[] | null (hard_to_lose, child_safe, lightweight...)
  sort_by: relevance | price_low | price_high | rating
```

### System Prompt Changes

The system prompt will instruct Gemini to:
- Extract structured intent, not generate keywords
- Map implicit user needs to semantic_tags
- Use correct subcategory values from the catalog
- Output clean `query_text` with max 2-3 core Persian words

### Re-Ranker Prompt

After hybrid retrieval returns 10-20 candidates:
```text
"Given the user's original request and extracted intent, 
rank these products by relevance. Remove any that violate 
implicit constraints. Return ordered product IDs with 
brief reasoning."
```

### Performance

- pg_trgm GIN index: fast fuzzy matching
- tsvector GIN index: already exists
- ivfflat index on embeddings: fast vector search
- Total latency target: ~2-3s (intent extraction + DB query + re-rank)

## What This Achieves

| Query Type | Current | After |
|---|---|---|
| "هدفون بی سیم" (simple) | Works sometimes | Ranked results |
| "هدفون ارزان زیر ۵۰۰ هزار" (price filter) | Misses price | Structured filter |
| "یه هدفون برای بچم که گم نشه" (implicit) | Fails completely | Semantic tags + re-ranker |
| "وایرلس" vs "بی سیم" (synonyms) | Fails | Trigram + embeddings |
| "هدیه برای مادرم" (abstract) | Random results | Intent extraction + semantic |

