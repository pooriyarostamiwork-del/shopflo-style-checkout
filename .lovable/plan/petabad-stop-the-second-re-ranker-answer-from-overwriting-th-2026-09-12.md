# PetAbad: stop the second "re-ranker" answer from overwriting the model's real answer

## What is actually happening (verified in code and gateway logs)

There is **one** pipeline, not two. Every PetAbad request goes through `supabase/functions/petabad-agent/index.ts`, and all recent work (dictionaries, taxonomy-aware search, constraint relaxation, brand vocabulary, FAQ grounding) lives in that single function. The problem is that this function makes **two or more sequential model calls per message** and the **last one always wins**, even when the first one was correct.

```text
user message
  -> Tool loop (1-2 model calls): model picks tools, tools run, model writes answer  <- the "correct" answer you see in logs
  -> Discovery guard: if no search_products ran and the message is not matched by two regexes,
     a server-side search is forced (not a model decision)                          <- "SELECTED_IDS with no search tool"
  -> Final "re-ranker" call: a NEW model call with the instruction "pick 3-6 of these candidates
     and rewrite" (or "answer this info question") whose output REPLACES the first answer      <- the "wrong" answer that renders
  -> post-processing (parity, species filter, brand guard) -> JSON -> client renders `content` + `products`
```

Why the re-ranker runs on every turn: the "direct response" exit (line ~2671) is gated on `!isDiscoveryIntent`, and `isDiscoveryIntent` is true whenever mode is `agentic` — which is the only mode the client ever sends. So the direct path is dead code in practice, and the re-ranker call (line ~2805) always fires. Both model calls are recorded in the same gateway run, which is why each log shows two "AI replied" entries.

Case mapping:
- **FAQ "چندتا خاک گربه می تونم بخرم؟"** — `business_faq_lookup` answered correctly. `BUSINESS_RE` does not match this wording, so the discovery guard forced a search for "خاک گربه", producing candidates; the re-ranker then wrote a 2-product list and that replaced the FAQ answer.
- **"محصول خراب بود چی می شه"** — same mechanism; the re-ranker re-answered from the FAQ tool context, giving a different paraphrase.
- **"در مورد این شامپو بیشتر توضیح میدی"** — `get_product_details` is not counted as a search, so the guard searched "شامپو" and the re-ranker produced 3 unrelated shampoos with `SELECTED_IDS`.
- **"برندهای خارجی پوچ گربه چانک چیا دارین"** — info question; the re-ranker's `ANSWER_TURN` rewrite produced a denial. The brand guard should have replaced it with a catalog list but `brandListAnswer` returned nothing for the پوچ/چانک type filter, so the denial shipped.
- **Case 1 (new-cat bundle)** — the loop produced a full 7-product grouped answer. The re-ranker call returned only `GOAL` + `SELECTED_IDS` with no prose, so the text was thrown away and a deterministic one-product composer message was shipped. The exact reduction to 1 card (species filter vs. parity trim) is confirmed during implementation via the response trace.
- **Duplicate gateway rows (in 0 / out 0)** — same run id, no client retry exists (`invokeWithTimeout` does not re-send). Treated as gateway bookkeeping, not a hidden pipeline.
- **Card caps** — server: 6 normal, 12 when a large list is requested, 9 for bundles; client renders up to 12. There is no 4-card cap; fewer cards than numbered lines come from the species filter / parity logic after the swap.

## What will change (PetAbad only)

1. **The tool-loop answer becomes authoritative.** When the loop ends with a text answer, use it: strip signals, hydrate cards from `SELECTED_IDS` / `REFERENCE_IDS` / name matches against this turn's tool results, enforce text/card parity, and return. No re-ranker call.
2. **Re-ranker only as a fallback.** Call it only when the loop ended with tool calls and no text (rounds/time exhausted). Its prompt asks to write the answer from this turn's tool results, not to "select from candidates".
3. **Discovery guard narrowed.** Fires only when the turn ended without any text answer and without any tool result at all. Never after `business_faq_lookup`, `catalog_facets`, `get_product_details`, `recall_products` or `brand_or_general_lookup`, and never when the model already wrote a complete answer.
4. **Signals-only replies handled.** If a model reply is only `GOAL`/`SELECTED_IDS`, keep the previous text answer of the same turn rather than composing from scratch.
5. **Brand guard made safe.** It only overrides when the answer is a denial AND a grounded brand list exists; `brandListAnswer` falls back from exact product-type filter to species-level wet-food brands so پوچ/چانک questions get the real list.
6. **Caps.** 6 cards for normal requests, 12 for bundle and explicit large-list requests (server and client aligned).
7. **Observability.** Response `trace` gains `answer_source` (`model_final` / `reranker_fallback` / `composer` / `guard_search`) and the list of forced actions, so any future "wrong answer rendered" can be traced in one look.
8. **Regression cases** added to `scripts/petabad-eval.ts` for the six real conversations above: rendered text must come from the tool-loop answer, FAQ turns must not trigger a search, card count must equal numbered items, bundle turn must render all grouped products.

## Technical details

- File: `supabase/functions/petabad-agent/index.ts`
  - Remove `!isDiscoveryIntent` from the direct-response gate; restructure so `finalAssistantMessage` short-circuits to parity + hydration for all modes.
  - Hydration order: `sig.selectedIds` -> `sig.referenceIds` -> UUIDs in text -> fuzzy name match (`name_fa` prefix) against `allProducts`, falling back to DB hydrate for ids not in this turn's results.
  - Discovery guard condition becomes `!finalAssistantMessage && toolTrace.length === 0 && !isBusinessQuestion && !isInfoQuestion && !wantsGuidance`.
  - Re-ranker block wrapped in `if (!finalAssistantMessage)`; its `SELECTED_IDS` mapping and parity logic kept for that fallback only.
  - `maxShown`: `isBundleTurn || comprehensive ? 12 : 6`.
  - `brandListAnswer`: second query without `product_type` filter when the first returns empty.
  - `trace.answer_source` and `trace.forced` added to every product/message response.
- File: `src/features/petabad/hooks/useAgentMessages.ts` — no behavior change beyond forwarding `trace` for debugging (optional console log in dev).
- File: `scripts/petabad-eval.ts` — six new cases with assertions on `trace.answer_source`, `trace.tools`, numbered-line vs `products.length` parity, and required substrings from the FAQ answers.
- Deploy `petabad-agent`, rerun the eval suite, and replay the six conversations live on `/petabad`.
- Out of scope: Flowcart/GPTCommerce/Shift untouched; no inferred-filter chips.
