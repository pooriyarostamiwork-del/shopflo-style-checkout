# پت‌آباد: fixing "other brands" and full-catalog scope

Scope: `/petabad`, `/m/petabad`, `/petabad/floating` and `petabad-agent` only. Flowcart/GPTCommerce and Shift untouched. No inferred-filter chips.

## What the catalog actually contains (verified)

For cat food marked with the "skin & coat" need, in stock, the catalog holds foreign brands far beyond the three the assistant named — for example Reflex (13 cat food items, Turkey, several of them literally "Skin Care"), Happy Cat, Leonardo, Monge, Cachet, Taste Of The Wild, Hills, Dr.Clauder's, Bioline, Whiskas, KitCat, Gourmet, Felix, GimCat, Wanpy, Monello. So the third answer ("only Royal Canin, ProPlan and Josera; Aromatisch/Fidar/Senso/Farafood have nothing") is factually wrong, and the brands it offered instead are Iranian ones — the opposite of the user's "foreign only" request.

Confirmed causes in the assistant:

- There is no way to exclude brands. The search tool has `brand` (include one) but nothing for "any brand except these", so "از برندهای دیگه هم بده" re-runs the same search and Josera comes back at the top again.
- There is no "foreign" concept. `origin_country` only matches one exact country, so "خارجی" can't be expressed as "not Iran" and gets approximated by naming a couple of known import brands.
- The assistant has no list of brands already shown in the conversation, so it can't subtract them.
- Ranking has no per-brand diversity cap (only per product line), so one brand can fill the whole answer.
- Availability denials are written from the model's impression of the previous result page, not from a real catalog check restricted to the same need/species/country condition.

## What will change

1. "Other brands" becomes a real search
   - Add `exclude_brands` (list) and `origin_scope` (`خارجی` / `ایرانی` / a specific country) to product search, honoured inside the catalog query with the existing brand-alias matching (so جوسرا and Josera are one brand).
   - Track brands already shown in the conversation; when the user says "از برندهای دیگه", "بجز اینا", "برندهای دیگه هم بده", those brands are excluded automatically and the reply only contains new brands.

2. Brand diversity in every product answer
   - Cap how many items of the same brand appear in one answer (default 2), preferring distinct brands when the request is broad ("همه محصولات..."), so a single brand can't occupy the whole list.

3. No more false "we don't have it"
   - Before any sentence claiming a brand or need is unavailable, the assistant must run a catalog facet check with the exact same conditions (species + need + food/type + foreign/Iranian scope). The reply then lists the brands the catalog really returns.
   - If the facet check returns brands, denial wording is blocked and replaced with the grounded brand list.

4. Broad requests get broad coverage
   - "همه محصولات ...", "همه‌شو بده" raise the retrieval and card cap (up to 12) and spread results across brands and price points instead of returning five items from two brands.

## Tests

Added to `scripts/petabad-eval.ts` as replayed conversations:
- Turn 1 "همه محصولات خارجی مناسب پوست و موی گربه" → all cards foreign (origin ≠ ایران), cat food only, at least 4 distinct brands, no more than 2 items per brand.
- Turn 2 "از برندهای دیگه هم بده" → zero overlap with turn-1 brands.
- Turn 3 "بجز این برندها از برندهای دیگه هم بده" → returns real products (Reflex and others), contains no availability denial, and offers no Iranian brands for a foreign-only request.
- Regression: existing 14 cases still pass; parity between numbered lines and rendered cards preserved.

## Technical notes

- Migration: extend `pet_hybrid_search` with `p_exclude_brands text[]`, `p_exclude_countries text[]` / `p_foreign_only boolean`, and per-brand windowing alongside the existing per-line windowing. Extend `pet_question_facets` with the same exclusion/foreign-scope arguments so the availability check and the search agree.
- `supabase/functions/petabad-agent/index.ts`: new `exclude_brands` / `origin_scope` tool params passed into `executeSearch`; conversation-level shown-brand set derived from prior assistant turns and product memory; "other brands" phrase detection; brand-diversity cap in answer composition; availability-denial guard extended to require a matching facet call and to substitute the grounded brand list; `maxShown` raised for "all products" style requests.
- Deploy `petabad-agent`, run `bun run scripts/petabad-eval.ts`, then replay the three-turn conversation live.
