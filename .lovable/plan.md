# Data-grounded question options + shining loading text (/gptcommerce)

Scope: `/gptcommerce`, `/m/gptcommerce` and their shared assistant only. Shift untouched.

## The problem, confirmed against the catalog

For "لپ تاپ گیمینگ چی بگیرم" the card offered "زیر ۲۰ میلیون" and "بالای ۴۰ میلیون". Checked the real data: in-stock gaming laptops are 22 items, cheapest 92 میلیون, median 131 میلیون, top 718 میلیون. So both options were impossible — the budget steps are hardcoded/LLM-invented text with no link to the catalog.

## The fix: options are derived from the catalog, never invented

1. Before any question card is sent, the assistant takes a snapshot of the actual candidate set for what the person asked (the same filters the search would use: category + their words, e.g. "گیمینگ"). The snapshot gives how many products exist, the real price steps (cheapest / lower quarter / middle / upper quarter / most expensive), the brands present, and which recurring attributes exist in that set.

2. Budget options are then built from those real price steps, as adjacent ranges that each contain products — for gaming laptops that becomes something like:
   - ۹۲ تا ۱۱۵ میلیون
   - ۱۱۵ تا ۱۳۰ میلیون
   - ۱۳۰ تا ۱۷۵ میلیون
   - بالای ۱۷۵ میلیون
   - مهم نیست، بهترین رو نشونم بده
   Each option carries the hidden range so the following search uses the exact numbers instead of re-guessing.

3. Every other option list is filtered the same way: brand options only list brands that exist in that candidate set, attribute options only appear when enough products in the set actually have them. Any option the model proposes that matches zero products is dropped; if a whole step ends up with fewer than two usable options, that step is skipped rather than shown with fake choices.

4. When the candidate set is tiny (under ~4 products), no budget question is asked at all — the assistant shows what exists and says the range plainly.

5. If the person names a budget that the set cannot satisfy (e.g. ۲۰ میلیون for gaming), the assistant says the real starting price and offers the closest option instead of returning nothing.

## Loading bubble

The waiting bubble's text uses the requested shining sweep animation: a light gradient travelling across the text, looping every 2 seconds, on desktop and mobile. Wording stays the intent-based lines already in place.

## Technical notes

- New Postgres function `product_question_facets(p_query, p_subcategory, p_in_stock)` returning `{ total, price: {min, q1, median, q3, max}, brands: [{brand, count}], attributes: [{key, values:[{value,count}]}] }`, computed with `percentile_disc` over the same normalised-Persian match used by `hybrid_product_search`, plus tag/spec value counts. Grants for `anon`, `authenticated`, `service_role`.
- `supabase/functions/gpt-commerce-agent/index.ts`:
  - `fetchQuestionFacets()` called once per guidance/clarification turn (single extra SQL round-trip, no extra LLM call, so latency stays in the current range).
  - `buildBudgetOptions(priceStats)` → quantile-based buckets with Persian digits and `value: {price_min, price_max}` on each option; `groundClarification(card, facets)` rewrites/filters model-supplied and `DEFAULT_GUIDANCE_STEPS` options, drops zero-match options, and removes under-populated steps.
  - `DEFAULT_GUIDANCE_STEPS` loses its hardcoded price ladder; the usage step keeps its labels but each label is kept only if it matches products in the set.
  - The facets snapshot is injected into the guidance system prompt as a compact `CATALOG_SNAPSHOT:` line, with an explicit rule: never offer a budget or brand outside this snapshot.
  - The answered card's stored numeric range flows into the next `search_products` call as `price_min`/`price_max`.
- Frontend: add the `motion` package, add `src/components/gpt-commerce/ShiningText.tsx` (the provided component), and use it for the loading label in `src/components/gpt-commerce/ChatThread.tsx` and `src/features/gpt-commerce/mobile/MobileChatThread.tsx`; gradient colours come from theme tokens rather than the literal greys.
- Verification: replay "لپ تاپ گیمینگ چی بگیرم" and confirm the budget step starts at the real ۹۲ میلیون floor; replay a plain "لپ تاپ می‌خوام" to confirm wider buckets; answer a bucket and confirm the returned products fall inside it; check the shining text on both surfaces.
