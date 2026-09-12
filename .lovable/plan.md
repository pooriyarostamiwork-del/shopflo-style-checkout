# پت‌آباد — Catalog-aware, adaptive dynamic questions

## What is wrong today (verified in the agent code)

- The question flow is a fixed script: species → needs → budget → priority. The order is hardcoded in `DEFAULT_GUIDANCE_STEPS` and repeated in the prompt («نوع حیوان → نیازها → بودجه»). Budget is asked third, before quality/brand preferences.
- All steps of a card are generated at once and answered on the client; the server only sees the combined answer at the end. So an answer to step 1 cannot change step 2 — "adapt continuously" is structurally impossible right now.
- Only budget and brand options are grounded against the catalog (`groundClarification`). Need/health options («تقویت مفاصل», «خاک گربه» …) come straight from the model and are never checked against stock — which is exactly the «تقویت مفاصل» case.
- Budget buckets come from the price quantiles of a loose text match on the whole message, not from the configured purchase. For «پک کامل برای گربه» that yields single-item prices («تا ۳۰۰ هزار تومان»).
- Bundle requests («پک کامل / یه پک برای شروع») are not recognised as bundles unless two need words already appear in the message; otherwise they fall into the generic guidance script.
- The facet lookup ignores needs, product type and life stage, so option counts cannot reflect the real slice of the catalog.

## What we build (PetAbad only)

### 1. One adaptive question per turn
Replace the multi-step card with a single question per server turn for guidance and bundle flows. Each answer goes back to the agent, updates the shopping context, and the next question is generated from the narrowed catalog. The card keeps the same look; a small progress hint («سؤال ۲ از حدود ۴») replaces the fixed step counter. Single ambiguity questions (brand vs. category) stay as they are.

### 2. Goal recognition: single product vs. bundle
Detect bundle / starter-pack language («پک کامل», «برای شروع», «همه چیزهایی که لازم داره», «تازه آوردم … می‌خوام», «ست کامل») and set `goal = bundle`. Bundle flows get their own question plan (age → essentials to include → completeness → quality tier → brand/country only if the catalog has real variety → price tier last). Single-product flows keep a short plan focused on that product's attributes.

### 3. Every option is checked against stock before it is shown
Before a question is emitted, each candidate option is turned into a catalog filter (species + life stage + need/type group + brand/origin) and counted. Options with zero matching in-stock products are removed; a question left with fewer than two live options is skipped. Applies to needs, essentials, health needs, product types, brands, countries — not just budget and brand.

### 4. Price last, and calculated from the configuration
Budget is never asked before the purchase is understood. For a single product, buckets come from the quantiles of the narrowed slice (as today, but on the correct slice). For a bundle, the agent prices three real configurations from the catalog — economical (cheapest suitable item per essential), complete (median), professional (upper quartile) — and offers tiers with the real computed totals: «پک اقتصادی — حدود ۲ میلیون», «پک کامل — حدود ۳ تا ۵ میلیون», «پک حرفه‌ای — بالای ۵ میلیون». Numeric buckets are shown only when the tiers are too close together.

### 5. Catalog depth drives question depth
A question is asked only when the answer materially splits the candidate set (each option has at least ~3 products and no single option holds more than ~85% of candidates). Areas with almost no stock get no dedicated question; areas with many choices may get one follow-up.

### 6. Regression tests
Add replay cases to `scripts/petabad-eval.ts`: new-cat starter pack (no budget question in the first two turns; every offered essential exists in stock; price tiers within real catalog totals), «تقویت استخوان/مفاصل» (only needs with stock offered), «راهنماییم کن» single-product (price asked last), and assertions that no option label ever maps to zero products.

## Technical details

- `supabase/functions/petabad-agent/index.ts`
  - New `detectGoal(text, context)` → `single | bundle`; bundle regex alongside `detectNeeds`.
  - New `planNextQuestion(ctx, facets)` returning at most one question; replaces `DEFAULT_GUIDANCE_STEPS` and the multi-step `GUIDANCE_TURN` instruction. The model may still propose a question via `ask_clarification`, but it is normalised to one step and passed through the validator.
  - New `validateOptions(options, baseFilters)` that maps each option label to filters through the taxonomy alias tables (`pet_taxonomy_normalize`, `NEED_SPECS`, product-type groups) and counts via `pet_question_facets` (one call per question; options resolved from the returned `needs` / `product_types` / `brands` / `life_stages` buckets, so no per-option queries).
  - `executeFacets` / `fetchQuestionFacets` pass `p_needs`, `p_type_group`, `p_product_types`, `p_exclude_brands`, `p_foreign_only` and life stage (already present in the migrated RPC signature but unused by the agent).
  - New `priceBundleTiers(essentials, filters)`: for each essential, take min / median / q3 price from the facets of that shelf; sum per tier; round to human values; produce the tier options with computed totals. `buildBudgetOptions` stays for single-product flows.
  - Shopping context (`AgenticState.shoppingContext`) gains `goal`, `askedQuestions[]`, `answers{}` so the server knows what has already been asked; the client keeps forwarding it as today.
  - Prompt: replace the fixed step order with rules «سؤال‌ها یکی‌یکی، بر اساس جواب قبلی، قیمت همیشه آخر، فقط گزینه‌های موجود در کاتالوگ».
- `src/components/petabad/ClarificationBlocks.tsx`: render single-step cards with an optional progress hint; keep the existing multi-step renderer for legacy messages in history. Answered cards stay read-only.
- `src/features/petabad/hooks/useAgentMessages.ts`: send each answer immediately (already the case for `single` cards); persist `askedQuestions` / `answers` in the shopping context.
- Floating (`/petabad/floating`) and mobile (`/m/petabad`) reuse the same components, so they get the behaviour automatically.
- Out of scope: Flowcart/GPTCommerce and Shift are untouched; no inferred-filter chips.
