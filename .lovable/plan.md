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

## Part 2 — Missing ≠ negative (three-valued reasoning)

The retrieval layer adopts TRUE / FALSE / UNKNOWN explicitly.

- **Hard exclusions, only for genuine incompatibility:** species mismatch, stock, explicit price ceiling, and product-type group mismatch (food vs toy). Nothing else.
- **Everything else becomes a ranking signal with an UNKNOWN band:** exact match scores highest, UNKNOWN scores neutral (it stays in the pool), explicit contradiction scores negative. Applies to life stage, breed size, needs, country, product line, flavour.
- **Country stops being a hard `WHERE`**: it becomes a strong bonus plus a soft floor — country-matching rows first, then UNKNOWN-country rows, and rows from a *different* known country only when nothing better exists (and the answer says so honestly).
- **The evidence-term post-filter becomes a re-ranker**, not a cut: rows without the term drop in rank rather than disappearing, and a search can no longer be emptied by a phrase the catalog spells differently.
- **Text is first-class evidence.** Before the "no match" conclusion, each candidate is checked against title, description, specs text, ingredients and tags for the requested concept (e.g. "بالغ", "adult", "hair & skin", "sensitive"), and a text hit counts as a real match with lower confidence than a structured hit.

## Part 3 — Intelligent constraint relaxation

Constraints get an **importance tier**, derived from the user's own words, not from filter order:

- **Essential** (never relaxed): species, product category/type group, an explicitly stated hard budget.
- **Strong** (relaxed last, and disclosed): the functional need (پوست و مو), stated brand, stated country.
- **Soft** (relaxed first, silently): life stage, breed size, flavour, product line, shelf name, sort.

The widening ladder walks soft → strong, one tier at a time, and every relaxation is recorded and surfaced in the reply in natural Persian («آلمانی نداشتیم برای این نیاز، این‌ها نزدیک‌ترین گزینه‌ها هستن»). Zero results triggger a second, *broader* pass (drop shelf, keep species + need, lean on semantic vectors) before any negative answer.

## Part 4 — Multi-source retrieval

Search scores over all available sources, weighted, instead of primarily structured fields:

| Source | Role |
| --- | --- |
| structured fields | fast narrowing + strong ranking signal |
| title | high-weight lexical + concept evidence |
| description | concept evidence (life stage, function, ingredients) |
| specs / attributes text | ingredients, feeding info, country, weight |
| tags | secondary evidence |
| embedding | semantic recall for natural-language sentences |

Concretely: `search_vector` is rebuilt to include specs text and taxonomy labels with per-source weights (A title, B taxonomy/needs, C description, D specs/tags), and the score blends weighted FTS + trigram + vector + structured bonuses. Long Persian sentences stop needing every word to appear — matching switches to a best-subset/OR-with-coverage-score model.

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
- **type_group / product_type**: غذا (خشک، تر: کنسرو/پوچ/سوپ/مکمل غذایی)، تشویقی، بهداشت و مراقبت (شامپو، مسواک، خاک، ظرف بهداشتی، لوسیون)، اسباب‌بازی، مکمل و دارو، لوازم (قلاده، حمل، ظرف غذا، لانه) …
- **health_need**: پوست و مو، گوارش حساس، کنترل وزن، عقیم‌شده، کلیه، مجاری ادراری، مفاصل، هربال/گلوله مویی، ایمنی، دندان …
- **special_condition**: عقیم‌شده، باردار، شیرده، بستری/نقاهت، حساسیت غذایی
- **diet_form / flavour / weight_band / price_band / origin_country / brand / product_line**: normalized closed lists built from the actual data (brands deduplicated across Persian/English variants).

### Agent binding
- Tool schemas are generated from the live taxonomy, so enums always match the database — the model literally cannot pass a non-canonical value.
- Any value the model still sends is normalized through the alias table before it reaches the search; unmappable values are downgraded to free-text evidence instead of being applied as a filter.
- The system prompt receives the compact taxonomy vocabulary, so the agent's clarification options are drawn from the same closed list the catalog uses.

## Part 6 — Full-catalog enrichment against the taxonomy

Goal: **every one of the 1,721 rows** labelled on every applicable dimension, with provenance and confidence. Current gaps: 711 rows without life stage, 1,425 without breed size, 317 without product line, 159 without needs.

1. **Deterministic pass (free, exact, first):** alias + rule matching over title, description, specs and tags fills whatever text states outright. This is re-runnable and always wins over AI on conflict.
2. **AI pass (`petabad-enrich`, rewritten):** batches of ~12 rows to the Lovable AI gateway with a strict JSON schema whose enums are the taxonomy itself, so no new vocabulary can appear. Rules: label only from evidence present in the row; return `null` + `"unknown"` rather than guessing; return a short evidence quote and a confidence per field.
3. **Write policy:** fill empties always; overwrite an existing value only when the deterministic pass contradicts it; store `source` (rule | ai | manual), `confidence`, `evidence`, `taxonomy_version`, `enriched_at` per row so a taxonomy revision can re-run only the affected rows.
4. **Reindex** `search_vector` and refresh embeddings for changed rows.
5. **Operate it without a terminal:** a small guarded admin surface (PetAbad dev route) with three buttons — coverage report, dry run, run batches until done — plus the existing POST payloads. I'll drive it to 100% coverage myself and report the before/after table.
6. **Coverage + quality report:** per-dimension fill rate, confidence distribution, and a spot-check list of low-confidence rows for review.

## Part 7 — Evaluation (so this stays fixed)

A replayable PetAbad eval set (~30 real Persian cases, including all of yours) run against the deployed function, asserting per case: a search actually executed, species/stage discipline held, result count > 0 where products provably exist, text↔card parity, no invented product or brand, no unrequested counts, and latency. Every future change is checked against this set before I call it done.

## Technical summary

- Migrations: taxonomy tables + seed from catalog; `pet_products` gains per-field provenance/confidence columns and `taxonomy_version`; weighted `search_vector` rebuild; `pet_hybrid_search` v2 (three-valued scoring, country soft, coverage-based text scoring, tiered relaxation metadata); `pet_question_facets` reads the taxonomy.
- `petabad-agent`: bounded multi-round tool loop, discovery guard, taxonomy-generated tool enums, alias normalization, evidence re-ranking instead of filtering, importance-tiered relaxation with disclosure, no-results proof requirement, dev trace.
- `petabad-enrich`: taxonomy-schema-driven, deterministic-first, confidence/evidence/provenance, resumable, dry-run, coverage report.
- Model stays `google/gemini-3.1-flash-lite`; the extra tool round is budgeted so turns stay in the current latency range.
