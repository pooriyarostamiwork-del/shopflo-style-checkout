# Fixing product discovery in پت‌آباد

Scope: `/petabad` + `/m/petabad` only — the pet catalog, `pet_hybrid_search`, `pet_question_facets`, and `petabad-agent`. Flowcart (`/gptcommerce`) and Shift are not touched.

## What I verified in the real data

- The catalog **does** contain both products the assistant denied: `غذای خشک گربه جوسرا کتلوکس مناسب سلامت پوست و مو Josera Catelux` (1kg and 2kg, both in stock) and `غذای خشک سگ بالغ گلدن رتریور رویال کنین Royal Canin Golden Retriever Adult`.
- **Main root cause:** the catalog's shelf names are brand-split — `غذای خشک گربه`, `غذای خشک گربه جوسرا`, `غذای خشک گربه رویال کنین`, `غذای خشک گربه هپی کت` and so on (163 shelves, 8 of them brand-specific). The assistant searches with one shelf as a **hard filter**, so asking for "cat dry food" only looks at 58 products and Josera, Royal Canin, Happy Cat etc. are excluded before ranking starts. This alone explains issues 1, 3 and 7.
- **Second root cause:** brand is never actually sent to the search. The search function has a proper brand matcher, but the assistant filters brands *after* fetching 20 rows — so "Josera skin & coat" fails because Josera wasn't in those 20 rows.
- **Country data is missing where it matters:** 1,080 of 1,721 products have an empty origin country, yet 219 products carry آلمان inside their attribute text (139 already have it in the country field, 133 ایران, 198 چین …). That's why the assistant says it "can't filter by manufacturing country" (issues 2, 5) and then invents brand names.
- Long Persian sentences are matched with all-words-must-appear logic, so a sentence like "برای گربم که هفت سالشه برای پوست و مو غذا می‌خوام فقط آلمانی" scores near zero on text and falls back to weak fuzzy matching.
- No result diversification exists, which is why three sizes/variants of one VIPET puppy line fill the answer (issue 3).

## Fixes, issue by issue

**Issue 1 & 7 — "we don't have it" when we do (highest priority)**
- Stop using shelf name as a hard filter. Search the whole matching family: a request for cat dry food covers every `غذای خشک گربه*` shelf (all brand variants), with an exact-shelf bonus in scoring instead of exclusion.
- Send brand into the search itself (the function already supports Persian/English brand matching), so "جوسرا" searches all 46 Josera products rather than filtering a 20-row page.
- Recognise product-line names (Catelux, Josicat, Sensicat, Marinesse, Help Renal…) from the product title and match them, so "جوسرا کتلوکس" hits the exact product instead of "this product doesn't exist".
- Add a strict rule: the assistant may only say something is unavailable after a brand/line/attribute-specific search over the full catalog returns zero rows — and the reply must name what was searched.

**Issue 2 & 5 — country of origin**
- Backfill the origin-country field from each product's attribute text (کشور سازنده / کشور مبدا), covering the ~1,080 empty rows.
- Add country as a real search filter and as a facet, so "چه برندهای آلمانی دارین؟" returns the actual German brands with the real list, and "برندهای ایرانی" lists only brands that truly exist (no more inventing موفید/رویال فید for a shelf where they don't exist).
- The brand-listing answer always comes from the catalog facet call, never from the model's memory.

**Issue 3 — wrong/undiversified recommendations**
- Derive life stage (توله/بچه, بالغ, سنیور) and breed size (کوچک/متوسط/بزرگ) per product from its title and attributes, and use them as scoring signals.
- Map breed names to size + typical life stage (گلدن رتریور → نژاد بزرگ, بالغ unless stated otherwise) so breed-named products rank first and puppy food is not offered to an adult dog.
- Diversify results: cap how many items of the same brand/product line appear in one answer and prefer distinct lines, sizes and price points, so answers show real alternatives.

**Issue 4 — re-asking what it already knows**
- Carry a persistent shopping profile through the conversation (species, breed → size, age → life stage, needs like skin & coat, budget, brand and country preferences). Every follow-up search inherits it.
- Clarifying questions must skip anything already known; if breed size is already established, the follow-up narrows by brand/country/price instead of re-asking breed size.

**Issue 6 — brand questions deserve a real answer**
- "در مورد برند جوسرا بهم بگو" produces a proper introduction: origin country, positioning and what the brand is known for, plus the real پت‌آباد facts (how many products, which shelves, price range, notable lines) and a few tappable follow-ups. The web is consulted for brand background where available; catalog numbers always come from the database, and general brand background is clearly separated from catalog facts.

## Technical notes

- Migration: `pet_products` gains `origin_country` backfill from `tags`/`specs`, plus generated/derived columns for `life_stage`, `breed_size` and `product_line`, with matching indexes and refreshed `search_vector`.
- `pet_hybrid_search` gains `p_subcategory_prefix` (family match), `p_origin_country`, `p_product_line`, `p_life_stage`, `p_breed_size`, exact-shelf/line bonuses, and per-line diversification via `DISTINCT ON`-style windowing before the final limit.
- `pet_question_facets` gains `origin_country` and `life_stage` facets and honours the same family/brand/country filters, so question options remain grounded.
- `petabad-agent`: pass `p_brand`/country/line/stage into the RPC (drop the post-filter), add breed→size/stage mapping, add a session shopping profile injected into every tool call, add an availability-denial guard requiring a zero-row full-catalog check, add a brand-profile response path, and widen tool descriptions with the real shelf families.
- Verification: replay all seven transcripts against the deployed function and confirm Josera Catelux, the Royal Canin Golden Retriever product, German/Iranian brand lists, and diversified adult-dog results.
