# /gptcommerce + /m/gptcommerce — three independent plans

Scope: only `/gptcommerce` and `/m/gptcommerce` (they share `useAgentMessages.ts`, `gpt-commerce-agent`). Shift is untouched. Hard rule kept: **exactly two model calls per turn, as today** (tool-selection call + answer call, and fewer when a tool returns directly). No new agents, no classifier, no parallel LLMs.

## What the investigation actually found (verified, not assumed)

Traced: `src/features/gpt-commerce/hooks/useAgentMessages.ts` → `supabase/functions/gpt-commerce-agent/index.ts` → RPC `hybrid_product_search` → `products` table, plus `productMemory.ts`, `ChatThread.tsx`, `MobileChatThread.tsx`.

Catalog facts (queried live):
- 1,489 products; 435 have **no subcategory**; brand present on 1,374 across 134 distinct values.
- `specs` is `[]` for **every** product (0 non-empty). So structured attributes effectively do not exist — name/description/tags/brand are the only evidence. `description` averages 186 chars and is included in `search_vector`.
- Laptops: 111 rows, brands include اپل (5), ایسر (6), ام اس آی (3), گیگابایت (1), سامسونگ (1) plus duplicate HP spellings (`اچ پی`, `اچ‌پی`, `اچ‌ پی`).
- Embeddings exist for only 379/1,489 rows (laptops 4/111, phones 0/282), so the 0.30 vector term of the hybrid score is silently 0 for most of the catalog.
- `hybrid_product_search` is hard-capped at `LIMIT 20`, has no offset, no result count, single-brand `ILIKE` filter only.

Reproduced failure (gateway log `01a073a7…`): on "اپل چیا داری" the model answered **with no tool call at all**, from product memory only, and said there are no Apple laptops — while 5 in-stock Apple laptops exist. In the same run, "کلا چه برندهای لپتاپی داری؟" was answered from a 20-row search sample and listed 6 brands out of 12. Also verified: `hybrid_product_search('لپ تاپ', …, p_brand => 'Apple')` returns **0 rows** because brands are stored in Persian — so an English brand filter produces a confident false "we don't have it".

---

# Plan 1 — Discovery: scope, completeness, evidence depth

**Root causes:** (a) no way to enumerate or count the catalog, so "which brands / do you have X" is answered from a 20-row sample or from memory; (b) `LIMIT 20` with no count and no offset, so "all X" is structurally impossible and the model cannot distinguish *matching* from *displayed*; (c) brand filter is single-value, case/spelling/language-fragile; (d) the prompt permits catalog claims without a tool call; (e) missing embeddings degrade semantic recall; (f) criteria like "بی‌سیم" or "ایرانی" have no structured field, and there is no text-evidence search path.

**Changes (no extra model calls):**
1. New SQL function `product_facets(p_subcategory, p_criterion)` → canonical brand list with counts, total matching count, price band. Exposed as one new tool `catalog_facets`. Enumeration/existence questions become one cheap SQL call instead of a guess.
2. Brand canonicalisation: a small `brand_aliases` table (Persian variants + English↔Persian, seeded from the 134 existing values) plus a `canonical_brand()` helper, used by both search and facets. `Apple`/`apple`/`اپل` all resolve to اپل; the three HP spellings collapse to one.
3. `hybrid_product_search` v2 (same name, added optional params, backward compatible): `p_limit`, `p_offset`, `p_brands text[]`, `p_evidence text[]` (terms matched against name/description/tags — the tier that answers "بی‌سیم", "گیمینگ", "ایرانی"), and a returned `matched_total` window count. Default limit stays 20; comprehensive requests use up to 60.
4. Deterministic scope hint in the client (regex only, ~0 ms): `SHOWN_SET` (از اینا / این محصولات / کدومشون) vs `CATALOG` vs `CATALOG_ALL` (همه / کل / تمام / چیا داری). Sent as one short line.
5. Prompt rules: any existence, absence or enumeration claim requires `search_products` or `catalog_facets` first; "attribute missing" is never "no" — report unknown; report the matched count when it exceeds what is displayed.
6. Backfill the 1,110 missing embeddings via the existing `generate-embeddings` function (offline batch, zero runtime cost).
7. Presentation: comprehensive answers may show up to 12 cards (2 rows of 6 today) with the true total stated in text; pagination stays a UI concern, not a search stop.

**Latency:** unchanged model calls; adds one SQL round trip (~20-40 ms) on enumeration turns only. `p_evidence` uses existing GIN/trigram indexes.

**Acceptance:** "چه لپ‌تاپ‌های اپلی دارید؟" returns the 5 Apple laptops; "کلا چه برندهای لپتاپی داری؟" lists all 12 brands with counts; "همه هدفون‌های بی‌سیم" returns matched count ≥ the 124 text-evidence rows and never stops at 6; "از این لپ‌تاپ‌ها کدوم اپله؟" inspects only the shown group; no false "we don't have".

---

# Plan 2 — Conversation context & changing needs

**Root cause:** the only state carried between turns is `productMemory` (groups, positions, liked/rejected/inCart) plus the last 6 trimmed messages. There is no representation of the **shopping goal** (use case, budget, recipient), so "هدفون چی بگیرم" after "لپ‌تاپ گیمینگ زیر ۱۰۰ میلیون" is read as a fresh query — verified in the hook and in the system prompt, which has reference rules but no goal rules.

**Changes (no extra model calls):**
1. Add a compact `shoppingContext` to the per-basket state next to `productMemory`: `useCase`, `recipient`, `categoryBudgets` (per category), `currentCategory`, `preferences`, `exclusions`, `updatedAt`. Persisted with the basket (storage version bump, same pattern as v7).
2. Filled from two zero-cost sources: deterministic regex for numeric budgets/categories/recipient phrases (برای مامانم، برای خودم), and an optional `GOAL:` signal line the **existing** answer call already has room for, parsed and stripped exactly like the current `LIKED_IDS`/`REJECTED_IDS` signals.
3. Persistence rules encoded in state, not in the model: use case persists across categories; budget is category-scoped and never transferred; an explicit statement overrides immediately and clears the previous use case for that category.
4. Serialize as 3-5 short lines into the system prompt (~60 tokens) with continuation-first instructions: treat a new category as part of the active goal unless the user changed it; clarify only when the two readings produce materially different products.

**Latency:** +~60 prompt tokens, no new calls; regex work is sub-millisecond.

**Acceptance:** gaming laptop → "موس چی بگیرم" yields gaming mice; "هدفون رو برای موسیقی می‌خوام" drops the gaming frame; the 100M laptop budget is not applied to headphones; "برای مامانم" resets the goal; no extra clarification on unambiguous turns.

---

# Plan 3 — Reference resolver + clarification inside Quiz Card / Multi-Step Selector

**Current state (verified):** numeric/ordinal references are already resolved locally in the hook; "این/اینا" resolution relies entirely on the model plus `CURRENT FOCUS`. Ambiguity today surfaces as a chat bubble question with quick-reply chips (`needs_clarification` + `clarification_options`). The playground `PgQuizCard` and `PgMultiStepSelector` are hardcoded to mock constants (`PG_QUIZ`, `PG_WIZARD_STEPS`) and cannot render agent-supplied questions.

**Changes (no extra model calls):**
1. Deterministic reference resolver in `productMemory.ts`: explicit number → named product → single focused product → latest group → earlier group. The resolved target is passed as a `REFERENCE:` line, so the model does not have to re-derive it.
2. New tool `ask_clarification(question, options[], steps?)`. When the model calls it, the edge function returns the payload **directly** — no answer call — so a clarification turn costs *one* model call, fewer than today.
3. Port the two playground components into `src/components/gpt-commerce/` as data-driven `GcQuizCard` / `GcMultiStepSelector` (props: question, options, optional steps; keeps skip). They render inside the chat message from a new `clarification` field on `ChatMessage`, with the bubble text left empty so **the question appears only in the component, never duplicated**. Both `ChatThread.tsx` and `MobileChatThread.tsx` render it.
4. The answer feeds back as the user's next message plus a deterministic patch to `shoppingContext` (Plan 2), then the normal single agent turn runs.
5. Clarification is allowed only when interpretations diverge materially; the existing cart-disambiguation chips stay as they are.

**Acceptance:** "اینا کدومشون بلوتوثیه؟" after one group answers directly; with a laptop group and a headphone group present, "کدومش بهتره؟" renders a Quiz Card (no duplicated question text); a multi-attribute gap renders the step selector; skip continues without filters; answering resumes the flow in one turn.

---

## Sequencing, benchmarking, rollback

Order: Plan 1 → Plan 2 → Plan 3 (Plan 1 fixes wrong answers, Plan 2 wrong framing, Plan 3 interaction). Every migration is additive with defaults, so old callers keep working; each plan is independently revertable.

Benchmarks before/after, using the gateway logs (per-turn model-call count, tokens, duration) plus live browser runs of the reproduced scenarios: model calls per turn (must stay ≤ 2), p50/p95 turn latency, discovery recall on the Apple/brand/wireless/Iranian cases, scope accuracy, false-negative rate, unnecessary-clarification rate. Failure cases tested explicitly: empty retrieval, missing attributes, ambiguous and multi-candidate references, very large result sets, duplicate brands, stale/overridden context, tool errors. Final report per issue: PASS / FAIL / PARTIAL / NOT VERIFIED.
