# PetAbad: reasoning-first product discovery + universal taxonomy

Scope: PetAbad only (`/petabad`, `/m/petabad`, `/petabad/floating`, `pet_products`, `pet_hybrid_search`, `pet_question_facets`, `petabad-agent`, `petabad-enrich`). Flowcart and Shift are untouched.

## What I verified in the live system first

- **The dictionary is genuinely thin where it matters.** Cat products: 433 بالغ, 214 نابالغ, only **21 سنیور**, and **420 with no life stage at all**. In the cat dry-food shelf specifically there are only **2** سنیور rows out of 153. So the model asking for `life_stage: "سنیور"` is asking for something the catalog barely records — exactly the problem described.
- **Life stage, breed size and needs are already soft** in `pet_hybrid_search` (score bonuses/penalties, not `WHERE`). So `سنیور` alone does not empty the result set.
- **Country is a hard filter** (`origin_country ILIKE`), and so is the post-retrieval "evidence term" filter in the edge function. Neither is in the relaxation ladder — the ladder only relaxes needs, stage/breed, shelf, price, product types. Country and brand can silently zero a search with no widening.
- **The concrete «آلمانی + پوست و مو» case is not a data gap**: 34 German cat dry foods with skin/coat evidence exist and are in stock. So the empty answer did **not** come from filtering — it came from the answer stage.
- **The agent runs exactly one tool round.** The first model call has tools; the follow-up (answer/rerank) call has **no tools attached**. If the first round returns only `catalog_facets` — or the model wants to search *after* seeing facet results — `search_products` never runs, `allProducts` is empty, and the reply becomes a "we don't have it" style message. This matches the screenshot (facets ran, a search intent appears, no products). Confirming this exact trace with logging is step 1 of the work, not an assumption.

## Part 1 — Fix the immediate defect: searches that never run

1. **Turn the single tool round into a bounded agentic loop** (max 3 rounds, hard wall-clock budget ~9s). Tools stay attached on every round, so a facet call can legitimately be followed by a search. The final round runs without tools to force prose.
2. **Discovery guard:** if the turn is a product-discovery intent and no `search_products` executed by the end of the loop, the server runs one deterministic search itself from the resolved intent (species lock + shelf + evidence) before answering. A product turn can never end with zero retrieval.
3. **No-results answers become impossible without proof:** the answer model may only say "we don't have it" when the tool payload carries `matched_total: 0` from a search whose constraints were already relaxed to the user's essentials. Otherwise the fallback is a real search, not an apology.
4. **Trace fields** in the response (dev-only): rounds used, tools executed, constraints applied, constraints relaxed — so this class of bug is visible instead of inferred.

### Tests
- Replay the exact failing turn («می‌شه از برندهای آلمانی غذا مناسب پوست و موی گربه بهم معرفی بکنی») against the deployed function; assert the trace contains an executed `search_products` and the response carries ≥3 products.
- Force a facets-first turn («چه برندهای آلمانی داری؟» then «همونا رو نشونم بده») and assert round 2 executes a search.
- Discovery-guard unit case: feed a synthetic model reply with only `catalog_facets`; assert the server-side fallback search runs and products come back.
- Negative-claim guard: assert no response containing «نداریم/موجود نیست» is ever emitted when the trace shows zero executed searches.
- Latency: p50/p95 across 10 replays stays within the current range (~3.5–7s).

## Part 2 — Missing ≠ negative (three-valued reasoning)

The retrieval layer adopts TRUE / FALSE / UNKNOWN explicitly.

- **Hard exclusions, only for genuine incompatibility:** species mismatch, stock, explicit price ceiling, and product-type group mismatch (food vs toy). Nothing else.
- **Everything else becomes a ranking signal with an UNKNOWN band:** exact match scores highest, UNKNOWN scores neutral (it stays in the pool), explicit contradiction scores negative. Applies to life stage, breed size, needs, country, product line, flavour.
- **Country stops being a hard** `WHERE`: it becomes a strong bonus plus a soft floor — country-matching rows first, then UNKNOWN-country rows, and rows from a *different* known country only when nothing better exists (and the answer says so honestly).
- **The evidence-term post-filter becomes a re-ranker**, not a cut: rows without the term drop in rank rather than disappearing, and a search can no longer be emptied by a phrase the catalog spells differently.
- **Text is first-class evidence.** Before the "no match" conclusion, each candidate is checked against title, description, specs text, ingredients and tags for the requested concept (e.g. "بالغ", "adult", "hair & skin", "sensitive"), and a text hit counts as a real match with lower confidence than a structured hit.

### Tests
- SQL: `pet_hybrid_search` with `p_life_stage = 'سنیور'` on cat dry food returns ≫2 rows (UNKNOWN rows retained) while the 2 true سنیور rows rank in the top positions.
- SQL: same query with a deliberately absent country («سوئد») returns rows instead of zero, with a relaxation flag set.
- SQL: species mismatch still returns zero dog rows for a cat query (hard exclusion preserved).
- Text-evidence case: a product whose `life_stage` is null but whose title says «بالغ» ranks above a row with no evidence at all.
- Regression: for 10 representative queries, result count after the change is ≥ result count before, and no query regresses to zero.

## Part 3 — Context-aware constraint relaxation

Constraint importance is **not a single fixed ladder**. A tier is derived from three inputs together: the user's wording, the nature of the requirement (medical vs functional vs cosmetic vs taste), and **the product category being shopped for**. The agent first resolves *what is being bought*, then assigns importance relative to that category.

- **Tier 0 — Hard compatibility (never auto-relaxed):** species, product type / product group, an explicit hard budget, explicit contraindication or incompatible condition. گربه never becomes سگ, غذای خشک never becomes مکمل, «زیر ۵۰۰ هزار» never returns ۹۰۰ هزار without permission.
- **Tier 1 — Critical fit (non-relaxable when it applies):** medical / therapeutic conditions (کلیه، مجاری ادراری، دیابت، گوارش درمانی), explicitly stated life stage, special conditions (عقیم‌شده، باردار، شیرده), and breed size when it is materially relevant to that category. «غذای درمانی کلیه» must never quietly become ordinary cat food. When no exact match exists the answer states that honestly and *offers* the nearest option as an explicit choice: «غذای مخصوص بچه‌گربه پیدا نکردم؛ اگر بخوای نزدیک‌ترین گزینه‌های گربه رو برات بررسی می‌کنم» — a fallback the user accepts, not a silent substitution.
- **Tier 2 — Strong preference (relaxed with disclosure):** cosmetic/functional needs such as پوست و مو, stated brand, stated country, life stage or breed size when not critical for that category. «آلمانی نداشتیم برای این نیاز، این‌ها نزدیک‌ترین گزینه‌ها هستن».
- **Tier 3 — Soft preference (relaxed first, quietly):** flavour, product line, shelf name, sorting, secondary attributes.

**Category-dependent importance matrix** (stored as data alongside the taxonomy, so it is revisable):

```text
requirement      | food            | toy             | hygiene
-----------------|-----------------|-----------------|-----------------
species          | hard            | hard            | hard
product type     | hard            | hard            | hard
medical need     | critical        | n/a             | critical if stated
life stage       | critical/strong | strong/soft     | soft/strong
breed size       | strong          | strong          | soft/strong
country          | preference      | preference      | preference
brand            | preference      | preference      | preference
flavour          | soft            | n/a             | n/a
```

The widening ladder walks Tier 3 → Tier 2 only. Tier 1 is never crossed automatically: instead the turn returns an honest "not found for this critical requirement" plus an offered fallback. Every relaxation is recorded in the trace and surfaced in natural Persian. Zero results still trigger a broader Tier-3/Tier-2 pass (drop shelf, keep species + critical requirements, lean on semantic vectors) before any negative answer.

### Tests
- Medical case («غذای گربه برای بیماری کلیه»): assert either true kidney-support products, or an honest not-found plus an offered alternative — never ordinary food presented as a match.
- Life-stage case («غذای بچه گربه») with kitten rows suppressed: assert the reply names the gap and offers the adult option as a choice; assert no adult product is presented as a kitten match.
- Category-dependence test: «غذای شیتزو» treats breed size as strong, «اسباب‌بازی برای شیتزو» treats it as a ranking signal only; both assert the expected tier in the trace.
- Tier-0 test: a cat query never returns a dog row after full relaxation; a stated budget ceiling is never exceeded.
- Ladder-order test (unit): relaxations fire Tier 3 → Tier 2 and stop at the first non-empty pass; Tier 1 is never auto-relaxed in any generated ladder.
- Disclosure test: every response with `relaxed: true` contains a disclosure sentence; `relaxed: false` contains none.

## Part 4 — Multi-source retrieval

Search scores over all available sources, weighted, instead of primarily structured fields:


| Source                  | Role                                                 |
| ----------------------- | ---------------------------------------------------- |
| structured fields       | fast narrowing + strong ranking signal               |
| title                   | high-weight lexical + concept evidence               |
| description             | concept evidence (life stage, function, ingredients) |
| specs / attributes text | ingredients, feeding info, country, weight           |
| tags                    | secondary evidence                                   |
| embedding               | semantic recall for natural-language sentences       |


Concretely: `search_vector` is rebuilt to include specs text and taxonomy labels with per-source weights (A title, B taxonomy/needs, C description, D specs/tags), and the score blends weighted FTS + trigram + vector + structured bonuses. Long Persian sentences stop needing every word to appear — matching switches to a best-subset/OR-with-coverage-score model.

### Tests
- Long natural sentence («برای گربم که هفت سالشه برای پوست و موش غذا می‌خوام فقط آلمانی») returns non-zero, relevant rows — previously near-zero text score.
- Description-only recall: pick a product whose need appears only in the description, query that need, assert the product is retrieved.
- Specs-only recall: pick a product whose country/ingredient appears only in specs, assert retrieval.
- Ranking sanity: for 10 queries, manually score top-5 relevance before/after; require no relevance regression.
- Index check: `EXPLAIN` confirms the GIN/HNSW indexes are used and query time stays under ~300ms.

## Part 5 — The universal taxonomy and dictionary (core deliverable)

A **fixed, versioned, closed vocabulary** the agent may use and nothing else — no inventing مسن when سنیور exists.

### Structure

Stored in the database (not hardcoded), so it can be revised as the catalog grows:

- `pet_taxonomy_dimensions` — the dimension list (species, life_stage, breed_size, product_type, type_group, health_need, diet_form, flavour, origin_country, brand, product_line, weight_band, price_band, special_condition).
- `pet_taxonomy_terms` — canonical Persian term per dimension, English key, definition, sort order, `is_active`, `version`.
- `pet_taxonomy_aliases` — every colloquial/typo/English/Latin variant mapping to a canonical term (مسن/پیر/سالمند → سنیور; kitten/بچه گربه/توله گربه → نابالغ; hair & skin/پوست و مو/ریزش مو → پوست و مو).
- `pet_taxonomy_rules` — deterministic derivations (breed → breed_size + default life stage; age in years/months → life stage per species; "کنسرو/پوچ/سوپ" → wet food type).

### Dimensions and values (derived from the current 1,721-row catalog, expandable)

- **species**: گربه، سگ، پرنده، ماهی، جونده، خزنده …
- **life_stage**: نابالغ، بالغ، سنیور (+ باردار/شیرده as a special condition, not a stage)
- **breed_size**: کوچک، متوسط، بزرگ
- **type_group / product_type**: غذا (خشک، تر: کنسرو/پوچ/سوپ)، تشویقی، بهداشت و مراقبت (شامپو، مسواک، خاک، ظرف بهداشتی، لوسیون)، اسباب‌بازی، مکمل و دارو، لوازم (قلاده، حمل، ظرف غذا، لانه)، مکمل غذایی …
- **health_need**: پوست و مو، گوارش حساس، کنترل وزن، عقیم‌شده، کلیه، مجاری ادراری، مفاصل، هربال/گلوله مویی، ایمنی، دندان …
- **special_condition**: عقیم‌شده، باردار، شیرده، بستری/نقاهت، حساسیت غذایی
- **diet_form / flavour / weight_band / price_band / origin_country / brand / product_line**: normalized closed lists built from the actual data (brands deduplicated across Persian/English variants).

### Agent binding

- Tool schemas are generated from the live taxonomy, so enums always match the database — the model literally cannot pass a non-canonical value.
- Any value the model still sends is normalized through the alias table before it reaches the search; unmappable values are downgraded to free-text evidence instead of being applied as a filter.
- The system prompt receives the compact taxonomy vocabulary, so the agent's clarification options are drawn from the same closed list the catalog uses.

### Tests
- Integrity SQL: every alias resolves to an existing active term; no duplicate canonical terms per dimension; every `pet_products` structured value is a canonical term or null (zero orphan values).
- Alias coverage: a fixed list of ~60 colloquial inputs (مسن، پیر، بچه گربه، kitten، هربال، sterilised…) each normalize to the expected canonical term.
- Schema-generation test: the tool enums served to the model equal the active taxonomy terms exactly.
- Non-canonical input test: send `life_stage: "مسن"` and `life_stage: "elderly"` to the search path; the first normalizes to سنیور, the second degrades to free-text evidence and never becomes a filter.
- Versioning test: deactivate a term and bump the version; enums, facets and clarification options update without code changes.

## Part 6 — Full-catalog enrichment against the taxonomy

Goal: **every one of the 1,721 rows** labelled on every applicable dimension, with provenance and confidence. Current gaps: 711 rows without life stage, 1,425 without breed size, 317 without product line, 159 without needs.

1. **Deterministic pass (free, exact, first):** alias + rule matching over title, description, specs and tags fills whatever text states outright. This is re-runnable and always wins over AI on conflict.
2. **AI pass (**`petabad-enrich`**, rewritten):** batches of ~12 rows to the Lovable AI gateway with a strict JSON schema whose enums are the taxonomy itself, so no new vocabulary can appear. Rules: label only from evidence present in the row; return `null` + `"unknown"` rather than guessing; return a short evidence quote and a confidence per field.
3. **Write policy:** fill empties always; overwrite an existing value only when the deterministic pass contradicts it; store `source` (rule | ai | manual), `confidence`, `evidence`, `taxonomy_version`, `enriched_at` per row so a taxonomy revision can re-run only the affected rows.
4. **Reindex** `search_vector` and refresh embeddings for changed rows.
5. **Operate it without a terminal:** a small guarded admin surface (PetAbad dev route) with three buttons — coverage report, dry run, run batches until done — plus the existing POST payloads. I'll drive it to 100% coverage myself and report the before/after table.
6. **Coverage + quality report:** per-dimension fill rate, confidence distribution, and a spot-check list of low-confidence rows for review.

### Tests
- Dry-run test: `{"dry_run": true}` writes nothing (row hashes unchanged) and returns a full proposed-diff sample.
- Idempotence: running the deterministic pass twice changes zero rows the second time.
- No-overwrite test: a row with a hand-set value keeps it unless the deterministic rule contradicts it; assert on a seeded fixture row.
- Vocabulary containment: after every batch, zero written values fall outside the taxonomy (SQL assertion, must be 0).
- Accuracy audit: manually verify a random sample of 40 enriched rows per dimension; require ≥95% correctness and quarantine low-confidence rows instead of trusting them.
- Coverage gate: final report shows life stage, breed size (dogs), product line, needs and country at ~100% of applicable rows; the before/after table is reported to you.
- Post-enrichment search test: the سنیور cat-food query now returns a materially larger, correct set than the 2 rows it had.

## Part 7 — Automated evaluation & regression suite

One replayable evaluation system — not two — combining known historical PetAbad failures with representative Persian shopping missions. It is the permanent regression gate. It does not merely ask "did products come back?" but "did PetAbad understand the shopping mission, return products that genuinely satisfy it, handle missing requirements and relaxation correctly, and communicate the same thing in text and in cards?"

Flow per case: Persian prompt → deployed PetAbad → response + products → automated assertions → SQL ground truth → UI/card verification → PASS/FAIL + named failing assertion + latency. Cases run against the real deployed function, not mocked retrieval.

Each case declares: `id`, prompt, expected shopping mission, species, product type/type group, life stage, health/functional need, brand, origin, budget, critical constraints, expected fit classification, SQL ground-truth query, expected relaxation behaviour, UI expectations — all expressed in the same canonical taxonomy the product uses, not a second test vocabulary.

### Assertion categories
1. **Search execution** — a real search ran for every discovery turn; no unavailability claim without one.
2. **Species correctness** — a cat mission never surfaces dog/bird/fish products, even after full relaxation, unless the user changes the mission.
3. **Product-type correctness** — food never becomes a supplement, dry never becomes wet, shampoo never becomes a supplement; semantic similarity never overrides type compatibility.
4. **Essential-constraint protection** — Tier-0/Tier-1 constraints from Part 3 are never silently violated; a violating product is classified invalid and not recommended as satisfying the request.
5. **Product–need fit** — explicitly supported / contradicted / unknown are distinguished; UNKNOWN is never treated as TRUE; Exact Fit ranks above Partial and Fallback; Invalid Fit is excluded.
6. **Brand & origin compliance** — an explicitly requested brand or origin is actually returned when it exists; if relaxed, the reply discloses it instead of presenting an alternative as exact.
7. **Life-stage correctness** — a senior or kitten request is not silently served adult products; a missing critical stage is reported with an offered fallback.
8. **Relaxation correctness** — which constraint was relaxed, why, whether it was legally relaxable, the resulting scope, whether it was disclosed, and whether the result is labelled Partial/Fallback.
9. **Evidence-backed claims** — every attribute claim (health, life stage, country, breed, ingredient) is supported by catalog evidence; unsupported or invented characteristics fail.
10. **No invented products or brands** — names, brands, variants, prices and attributes must exist in the catalog.
11. **False-unavailable protection** — «نداریم / موجود نیست / پیدا نشد» passes only when SQL ground truth agrees; turn-level only, never a persistent state.

### SQL ground truth
Every case with objectively determinable availability carries a `pet_products` query establishing what the catalog contains, independent of the model. A zero-product answer is never accepted just because the agent returned zero.

### UI / card verification
Playwright on `/petabad`, `/m/petabad` and `/petabad/floating`: cards render, rendered products equal backend products, any stated count matches visible cards, no missing/duplicate/invented cards, card name/brand/price match backend data, no console errors affecting shopping. This directly catches "9 products claimed, 6 cards rendered".

### Text ↔ card parity
Explicit failing assertions when prose and cards disagree — different product, wrong origin, wrong stage, mismatched count, mismatched price.

### Latency
Per case: total latency, agent rounds, search latency where available. Latency regressions stay visible even when functional assertions pass.

### Dataset
~30 real Persian shopping missions: all known failures (wrong species, wrong product type, life stage, health need, brand, origin, false unavailable, follow-up context loss, products present but unretrieved, count/card mismatch, unsupported claims) plus normal and edge cases, so the suite is a quality bar and not just a bug archive.

### Output & regression gate
A single command prints a per-case table with status, latency and the exact broken assertion, plus a pass rate. The full suite must pass before I report any PetAbad work complete, and re-runs after every change that can affect discovery: taxonomy, enrichment, retrieval, ranking, agent/prompt, tool schemas, relaxation logic, cards, backend.

### Definition of done
Known critical failures and representative missions are replayable; every case has explicit assertions and SQL ground truth where determinable; species/product-type violations blocked; essential constraints protected; product–need fit and Exact/Partial/Fallback/Invalid classification evaluated; UNKNOWN never counted as satisfied; brand, origin, life-stage and relaxation behaviour tested; unsupported claims, invented products and false unavailability detected; backend and visible cards consistent; latency reported; suite runnable on demand as the standing regression gate.

## Part 8 — Confidence scoring and honest fallback

Every inferred filter (brand, origin country, species, life stage, skin-and-coat style needs) gets a match confidence. Retrieval reports how well each candidate satisfies each filter instead of silently dropping rows.

- High confidence: answer normally.
- Partial: return the closest genuine matches and say plainly which condition could not be fully met.
- Low or no confidence: say the exact request is not available and offer the nearest real option, never an unrelated product.
- Unrelated filler suggestions are removed as a behaviour: a suggestion must satisfy at least the species and the core need.

### Tests
- Replay the German-brand case: partial-match wording appears when only non-German skin-and-coat food exists, with no unrelated items.
- Replay a deliberately impossible request: honest unavailability, nearest real alternative, no invented brand.
- Assert no returned product ever violates species or the core need.

## Part 9 — Scheduled enrichment validation

A scheduled validator that scans the pet catalog for missing or self-contradictory enrichment (breed size on non-dogs, life stage conflicting with the product name, needs absent while the title states them, missing origin country) and re-runs enrichment only for the affected rows, writing a short report each run.

### Tests
- Seed a known bad row, run the validator, confirm it is flagged, repaired, and that untouched rows are byte-identical.
- Confirm the second consecutive run reports zero new issues (idempotent).
- Confirm the report lists issue counts by type before and after.

## Part 10 — Inferred-filter chips in the PetAbad UI

On `/petabad`, `/m/petabad` and `/petabad/floating`, the assistant shows small chips above the results for the conditions it inferred from your sentence (animal, age, brand, origin, need, budget). Each chip can be removed, and one tap re-runs the search without it; a chip can also be corrected. Chips reflect only conditions actually applied to the search, so what the assistant is doing is visible.

### Tests
- Chips shown match exactly the filters the search used; nothing invented, nothing hidden.
- Removing a chip re-runs the search and returns a broader, still-valid result set.
- RTL and Persian digits verified on desktop, mobile and floating; Playwright screenshots with no console errors.

## Part 11 — Flowcart (`/gptcommerce`, `/m/gptcommerce`): the same discipline, fitted to an electronics catalog

Scope: `products`, `hybrid_product_search`, `product_facets`, `product_question_facets`, `brand_aliases`, `gpt-commerce-agent`, `enrich-products`, `generate-embeddings`, and the GPTCommerce desktop/mobile threads. Shift and PetAbad code stay untouched; Flowcart keeps its own function and tables (no cross-product imports), but the two agents stop drifting by sharing pure helpers.

### What I verified in the Flowcart stack first
- 1,489 products, 6 categories, 8 subcategories, 134 brands, 392 brand aliases already seeded. **Only 379 rows have embeddings**; **435 rows have no category/subcategory at all**; `specs` is empty on every row; `color_options` exists on 577 rows.
- The category tree is inconsistent: «گوشی موبایل» lives under three different categories, «لپ تاپ» under three, «هارد اکسترنال» under three. Any subcategory-based filter or facet silently splits the same shelf.
- `gpt-commerce-agent` runs the same fixed two-call flow as PetAbad did (one tool call + one answer call, no loop), so a facets-first turn can end without a search — the identical defect as Part 1.
- Brand (via `brand_match_keys`), subcategory, price and the `p_evidence` terms are all hard `WHERE` clauses. Evidence already has a one-step relax-and-retry (`evidence_unconfirmed`); brand, subcategory and price have none.
- Count suppression and grounded clarification already exist; there is no structured trace, no text/card parity check, no `ASKS_FOR_SOME` refinement, no eval suite, and no shared code between the two agents (the two edge functions are independent 1,400/2,164-line copies).

### What gets ported, and what does not

| PetAbad part | Flowcart treatment |
| --- | --- |
| 1 — bounded tool loop, discovery guard, no-results proof, trace | **Port as-is** (same defect, same fix). |
| 2 — three-valued reasoning | **Port**: brand and subcategory become strong bonuses with an UNKNOWN band instead of hard `WHERE`; evidence becomes a re-ranker. Price and stock stay hard. |
| 3 — context-aware relaxation | **Port with an electronics tier matrix**: Tier 0 = product type (laptop ≠ tablet), explicit budget, platform compatibility explicitly stated (iOS/Android, USB-C, Windows/Mac). Tier 1 = a stated hard spec (RAM/storage/screen size/GPU class when the user names it), gaming/professional use when stated. Tier 2 = brand, color, stated wireless/wired, warranty. Tier 3 = shelf, sort, cosmetic preferences. Same disclosure rules. |
| 4 — multi-source retrieval | **Port**: weighted `search_vector` (name A, brand/subcategory B, description C, tags D), coverage-based OR matching for long Persian sentences, and **complete the embedding backfill for all 1,489 rows** via the existing `generate-embeddings` function (currently 379). |
| 5 — universal taxonomy | **Electronics taxonomy, same table structure** (`gc_taxonomy_*`, not the pet tables): dimensions = category tree (fixed to one canonical parent per shelf), brand (reuses `brand_aliases`), use_case (گیمینگ، اداری، دانشجویی، عکاسی، ورزشی…), connectivity (بی‌سیم/بلوتوث/سیمی/USB-C), platform (iOS/Android/Windows/Mac), key specs bands (RAM, storage, screen size, battery), color (from `color_options`), price band. Tool enums are generated from it; aliases normalize English/Persian spellings. |
| 6 — enrichment | **Rewrite `enrich-products` on the same deterministic-first + AI pattern**: deterministic regex first (RAM/storage/size/connectivity are almost always in the title), then AI with taxonomy enums. Fills the 435 uncategorized rows, `specs` (currently empty everywhere), use_case, connectivity, platform, with provenance/confidence columns on `products`. |
| 7 — evaluation suite | **Same harness, second dataset**: ~25 Persian electronics missions reusing the historical failures (Apple laptops "not available", brand lists from a 20-row sample, «همه هدفون‌های بی‌سیم» stopping at 6, gaming budget options, empty-bubble clarifications) plus normal cases; SQL ground truth against `products`. |
| 8 — confidence + honest fallback | **Port** (brand/origin/spec confidence, no filler suggestions outside product type). |
| 9 — scheduled validation | **Port**: flags uncategorized rows, spec/title contradictions, missing embeddings; re-enriches only affected rows. |
| 10 — inferred-filter chips | **Port** to `ChatThread.tsx` / `MobileChatThread.tsx` (product type, brand, budget, use case, key spec). |
| PetAbad-only | Species lock, life stage, breed size, FAQ knowledge base, web brand lookup — **not ported**. |

### No duplicated code
Pure, catalog-agnostic helpers that both agents need (bounded tool loop, count stripping with `ASKS_FOR_SOME`, signal extraction, tier-based relaxation ladder, trace builder, text/card parity check, taxonomy-enum generator) move to `supabase/functions/_shared/` and are imported by both `petabad-agent` and `gpt-commerce-agent`. Catalog-specific pieces (tables, RPC names, tier matrix, taxonomy seed, prompts) stay per product. No new edge function, no second search RPC, no parallel classifier.

### Tests
- All Part 1–4 and 8–10 tests re-run against Flowcart with electronics prompts.
- Category-tree fix: SQL asserts every subcategory has exactly one parent category and zero rows remain uncategorized after enrichment.
- Embedding gate: 1,489/1,489 rows embedded; vector term contributes non-zero score on a phone query that previously had no embedding.
- Electronics relaxation: «لپ‌تاپ گیمینگ اپل زیر ۵۰ میلیون» never returns a non-laptop or an over-budget row; brand is relaxed with disclosure, gaming (Tier 1) is not.
- Shared-helper test: the same helper module is imported by both agents and both typecheck/deploy; a unit run of the helpers passes identically for both catalogs.
- Latency: Flowcart p50/p95 unchanged or better than the current two-call flow.

## Technical summary

- Migrations: taxonomy tables + seed from catalog; `pet_products` gains per-field provenance/confidence columns and `taxonomy_version`; weighted `search_vector` rebuild; `pet_hybrid_search` v2 (three-valued scoring, country soft, coverage-based text scoring, tiered relaxation metadata); `pet_question_facets` reads the taxonomy.
- `petabad-agent`: bounded multi-round tool loop, discovery guard, taxonomy-generated tool enums, alias normalization, evidence re-ranking instead of filtering, importance-tiered relaxation with disclosure, no-results proof requirement, dev trace.
- `petabad-enrich`: taxonomy-schema-driven, deterministic-first, confidence/evidence/provenance, resumable, dry-run, coverage report.
- Flowcart mirror (Part 11): `gc_taxonomy_*` tables, canonical category tree, `products` provenance columns, `hybrid_product_search` v2, `gpt-commerce-agent` on the shared helpers, `enrich-products` rewrite, full embedding backfill, electronics eval dataset.
- `supabase/functions/_shared/`: catalog-agnostic helpers imported by both agents; no duplicated logic added.
- Models stay as they are (`google/gemini-3.1-flash-lite` for PetAbad, `google/gemini-2.5-flash` for Flowcart); the extra tool round is budgeted so turns stay in the current latency range.
