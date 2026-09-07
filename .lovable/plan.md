# پت آباد — floating assistant polish, product-type taxonomy, web knowledge

Scope: PetAbad only — `src/features/petabad/floating/*`, `src/components/petabad/*`, `supabase/functions/petabad-agent`, plus a PetAbad-only taxonomy migration. Flowcart (`/gptcommerce`) and Shift are untouched.

---

## 1. Remove the starter card in a new floating chat

Delete `FloatingAgentEmptyState.tsx` and its usage in `FloatingAgentShell.tsx`. A new chat opens with an empty conversation area and just the composer, so the first thing the shopper sees is the input.

## 2. Question cards must not stay interactive in the transcript

Confirmed: the clarification card is rendered from the stored message and stays fully interactive forever, so an old multi-select block (with «یکی یا چند مورد انتخاب کن») reappears while scrolling history — exactly what the screenshot shows.

Fix: a clarification is "resolved" as soon as a newer shopper message exists in the thread. Resolved clarifications render as a compact, non-interactive summary line («نیازها: غذای اصلی، خاک و وسایل بهداشتی · بودجه: مهم نیست») instead of the tappable card. Only the newest, unanswered clarification stays interactive. Applies to the floating thread and to the shared PetAbad clarification block, so desktop/mobile behave the same.

## 3. Wet-food case — real root causes (verified in the catalog)

The request «چندتا غذای تر هم برای گربم پیشنهاد بده» returned one product although the catalog holds **338 in-stock wet cat items** (147 کنسرو, 165 پوچ). Three separate defects:

1. **Species lock missed the colloquial form.** The detector matches `گربه`/`سگ` but the shopper wrote «گربم» (and people write «سگم»، «توله‌ام»، «پیشیم»). With no lock, dog rows were never filtered out, so the model had to reason about species itself — hence the «کنسرو سلبن مخصوص سگ بوده» sentence and the 2→1 collapse.
2. **No product-type concept.** Not a single product name contains the phrase «غذای تر»; it lives only in the shelf name. So a free-text search for "غذای تر" plus evidence-term filtering on that phrase finds almost nothing, and the shelf family is only used when the request happens to contain «کنسرو/پوچ».
3. **Count/card honesty.** The answer promised ۲ items and delivered ۱. The number of products stated must equal the cards sent.

### Fixes

**A. Species/stage detection on colloquial Persian** — match possessive and diminutive forms (گربم، گربه‌ام، پیشیم، سگم، سگه‌ام، توله‌ام، جوجه‌ام…) and re-resolve every turn as it does now.

**B. A real product-type taxonomy (new, category-aware)**

A PetAbad-only migration adds a derived, indexed taxonomy so functional intent maps to rows instead of to text luck:

```text
product_type      غذای تر → کنسرو | پوچ | سوپ/مکمل مرطوب
                  غذای خشک، تشویقی، خاک، شامپو، مکمل، اسباب‌بازی،
                  ظرف، جای خواب، اسکرچر، حمل‌ونقل، درمان …
type_group        غذا | بهداشت | اسباب‌بازی | لوازم | سلامت
species/stage     existing columns, normalised
breed_size, brand, origin_country, product_line   existing
```

Populated deterministically from shelf name + product name keywords (کنسرو، پوچ، سوپ، خمیر، قطره، شامپو، خاک، اسکرچر…), no LLM guessing, plus indexes for fast filtering. A synonym map turns shopper language into taxonomy values: «غذای تر / کنسرو / پوچ / خیس» → `type_group = غذا` AND `product_type IN (کنسرو, پوچ, سوپ مرطوب)`; «تشویقی» → treats; «خاک» → litter, and so on.

Agent side: `search_products` and `catalog_facets` gain `product_type` / `type_group` parameters; a deterministic pre-pass injects them from the shopper's wording before the model is even consulted, and evidence-term filtering is skipped for words that the taxonomy already covers (so "غذای تر" can never shrink a result set to zero).

**C. Answer discipline** — for a "چندتا پیشنهاد بده" request the assistant returns 4–6 species-valid products (grouped by نوع: کنسرو / پوچ when both exist), the stated count always equals the card count, and it never narrates why a row was excluded.

**D. Verification (deployed function, real requests)**
1. «چندتا غذای تر هم برای گربم پیشنهاد بده» → 4–6 cat wet-food cards, mixed کنسرو/پوچ, count == cards, no dog sentence.
2. «پوچ گربه چی داری» / «کنسرو سگ» → correct type and species.
3. «برای بچه‌گربه‌ام غذای تر» → kitten-first ordering, no adult copy.

## 4. General knowledge / web lookup for brand questions

Requests like «در مورد برند فیدار بهم بگو» are not catalog lookups. The agent gets a third tool:

- `brand_or_general_lookup` — first reports what the catalog itself knows (which shelves, how many models, price band, origin, product lines for that brand), then fetches a short web summary for background the catalog cannot answer.
- Web fetching runs server-side in the edge function through the **Firecrawl connector** (search + scrape). I'll open the connector card so you can link it; until it is linked the tool answers from the catalog only and says plainly that it has no outside information.
- Guardrails: only for informational questions (no prices, availability or specs invented from the web), 2–3 results maximum, one short paragraph, answer stays in Persian and in PetAbad's tone, and the reply ends by offering the brand's actual products from the catalog.

## 5. Composer alignment

In `FloatingChatThread.tsx` the placeholder overlay is top-aligned while the send button sits at the bottom of the row. Align the placeholder/input text vertically with the send button (single-line height matched, growth downward only).

---

## Technical notes
- Taxonomy is data + code, not prompt wording: derived columns, indexes, a synonym map, and parameter injection before the model call.
- The species lock stays enforced server-side (parameter override + post-retrieval filter); only its detection vocabulary widens.
- Card/text parity is enforced by making the filtered retrieved set authoritative for both the cards and the number stated.
- Firecrawl is the only new external dependency and is used exclusively for informational brand/general questions.
