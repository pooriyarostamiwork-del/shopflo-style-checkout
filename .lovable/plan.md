

# Fix: Sync Re-Ranker Product Selection with Displayed Cards

## Problem

The AI re-ranker (Step 3) writes text about specific products it chose from the top 10 candidates, but the response always returns `allProducts.slice(0, 6)` -- the raw, unfiltered hybrid search results. This causes a mismatch between:
- **Text**: Describes 1TB Toshiba Canvio, 1TB Seagate Expansion, etc.
- **Cards**: Shows 2TB Seagate, 5TB Silicon Power, etc.

## Root Cause

In `supabase/functions/gpt-commerce-agent/index.ts`, line 360:

```text
products: allProducts.slice(0, 6)
```

This ignores the re-ranker's selection entirely. The LLM re-ranks in its head but the code never captures which products it chose.

## Solution

Make the re-ranker output structured data (ordered product IDs), then filter and reorder `allProducts` to match.

### Changes to `supabase/functions/gpt-commerce-agent/index.ts`

**1. Update the re-ranker system prompt** to instruct the LLM to return a JSON block with selected product IDs at the end of its response:

```text
After your response text, add on a NEW LINE:
SELECTED_IDS:[id1,id2,id3,...]
```

This lets us parse the IDs without requiring a separate LLM call.

**2. Parse the re-ranker output** to extract the selected product IDs from the response, then filter and reorder `allProducts` accordingly.

**3. Fallback**: If parsing fails (no IDs found), fall back to `allProducts.slice(0, 6)` as before.

### Detailed Implementation

Step-by-step changes in the edge function:

1. Modify the `rerankerSystemAddendum` to include this instruction:
   - "At the very end of your response, on a separate line, write `SELECTED_IDS:` followed by a JSON array of the product IDs you selected, in order of relevance."
   - Include product IDs in the candidate list so the LLM knows them.

2. After getting the re-ranker response, parse `SELECTED_IDS:[...]` from the text.

3. Filter `allProducts` to only include the selected IDs, in the re-ranker's order.

4. Strip the `SELECTED_IDS:` line from the content before returning to the client.

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/gpt-commerce-agent/index.ts` | Update re-ranker prompt to output product IDs; parse and reorder products accordingly |

### Expected Result

After this fix:
- The text describes Product A, B, C
- The product cards show Product A, B, C in the same order
- Product numbering ("محصول شماره ۱") will correctly match the displayed cards

