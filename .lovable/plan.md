# PetAbad: fix the answer shape, then finish the approved plan

## Status of the approved plan

Done:
- Part 1 — searches that never ran (bounded tool rounds + discovery guard)
- Part 2 — missing ≠ negative (brand/country/evidence became ranking signals, not hard filters)
- Part 3 — pet-specific relaxation tiers (medical needs relaxed last, species/type never relaxed)

Remaining:
- Part 4 — multi-source retrieval (title/description/specs/tags weighting)
- Part 5 — versioned taxonomy + alias dictionary in the database
- Part 6 — full-catalog enrichment against that taxonomy
- Part 7 — automated Persian replay/regression suite
- Part 8 — confidence scoring and honest fallback
- Part 9 — scheduled enrichment validation
- Part 10 — the same discipline for Flowcart (`/gptcommerce`) — last, separate

## Step 0 (first, before anything else): the answer must always have the right shape

What you saw:

```text
این گزینه‌ها به درخواستت می‌خوره:

برای اضافه کردن به سبد، بگو «محصول شماره X رو اضافه کن»
```

Two separate causes, both confirmed in the code:

1. The answer text was empty, so a one-line placeholder was used. This happens on two paths: the answer model occasionally returns empty content, and a second path (answers produced without a search round) has its own placeholder.
2. The chat screen always appends the "بگو «محصول شماره X رو اضافه کن»" line under any answer that has products.

The fix, PetAbad only:

- Required shape for every product answer:
  - a short intro of at most 3 lines,
  - then, per product: one numbered line with name + key detail + price, then one line saying why that product fits,
  - a blank line between products, no markdown, no totals/counts.
- A placeholder answer is no longer acceptable. When the model returns empty or shapeless text, PetAbad composes the answer itself from the retrieved product data (species, life stage, need tags, brand, weight, price) so the intro + per-product "why" always exist, and the retry keeps the same required shape.
- Both empty-answer paths (with search and without) use that same composer instead of a one-liner.
- Remove the appended "محصول شماره X" hint line from the PetAbad chat screens (desktop, mobile, floating). Adding to the basket keeps working exactly as now; only the text line goes. Flowcart and Shift keep their own line untouched.

### Tests
- Replay 8 Persian shopping prompts (cat skin/coat, senior cat, German brand, rabbit food, wet food, dog large breed, bundle, general question): every product answer has an intro of ≤3 lines and exactly one "why" line per shown product.
- Card/text parity: the number of numbered items equals the number of product cards in every case.
- No answer contains the placeholder sentence or the "محصول شماره X" hint.
- Force an empty model answer and assert the composed answer still has the correct shape.

## Then, in order

1. **Part 4 — multi-source retrieval.** Rebuild the search text so title, taxonomy/needs, description and specs/tags each carry their own weight, and blend text + fuzzy + semantic + structured scores, so long natural Persian sentences retrieve well.
2. **Part 5 — taxonomy + aliases in the database.** Closed, versioned vocabulary per dimension with every colloquial variant mapped (مسن/پیر → سنیور, kitten/بچه گربه → نابالغ, هربال → گلوله مویی). Agent options and search values come only from it.
3. **Part 6 — enrichment to full coverage.** Deterministic pass first, AI pass second with the taxonomy as the only allowed vocabulary, provenance/confidence per field, no overwriting good data, then reindex. Coverage report before/after.
4. **Part 7 — replay/regression suite.** The Persian mission cases with SQL ground truth, species/type/constraint assertions, card parity and latency, run against the deployed assistant as a permanent gate.
5. **Part 8 — confidence and honest fallback.** When a constraint matches weakly, say what was relaxed instead of presenting a loose match as an exact one.
6. **Part 9 — scheduled validation.** Detect missing/contradictory fields (for example breed size on non-dogs) and re-enrich only those rows.
7. **Part 10 — Flowcart.** Same discipline fitted to the electronics catalog, kept fully separate from PetAbad.

## Technical notes

- Files touched in Step 0: `supabase/functions/petabad-agent/index.ts` (answer composer + both empty-content paths + reranker instruction), and the PetAbad chat surfaces (`src/features/petabad/hooks/useAgentMessages.ts`, floating assistant thread) for the appended hint line.
- Scope stays PetAbad (`/petabad`, `/m/petabad`, `/petabad/floating`) until Part 10. Flowcart/GPTCommerce and Shift files are not modified.
- No inferred-filter chips anywhere.
