# Conversational memory for /gptcommerce discovery

Scope: `/gptcommerce` and `/m/gptcommerce` only. No Shift changes.

## What is actually broken

The assistant has no memory of the products it showed. Two concrete causes, both verified in the code:

- Only one slot of product memory exists (`lastRecommendedProducts` in `useBasketState.ts`). Every new search overwrites it, so the laptops disappear the moment headphones are shown. "these laptops" has nothing to point at.
- The history sent to the agent (`trimHistoryForAgent`) keeps only the last 4 turns **and explicitly filters out every message that carried products**. So the model literally never sees which products were introduced, in what order, or with what numbering.

Result: references ("these", "that one", "for this laptop", "number 2") can only be guessed from raw text, and the model falls back to re-answering the previous subject. This is a context/state problem, not a search-quality problem — so the fix is a structured working memory plus one reference-aware agent turn, not a bigger model or a second routing LLM.

## The model: a per-basket product memory

A new client-side memory, persisted per basket (same localStorage path as the rest of basket state, version bumped):

```text
productMemory = {
  groups: [                     // every set of products ever shown, newest last
    { groupId, turn, query, intent, productIds[], shownAt }
  ],
  products: { [id]: { id, name, price, brand, attributes, groupId, position, factsShown[] } },
  liked: [ids],                 // "I like these three"
  rejected: [ids],              // "not this one", "too expensive"
  inCart: [ids],
  focus: { productIds[], groupId }   // what "this"/"these" currently means
}
```

Rules (all universal, no category hardcoding anywhere):

- Each search appends a **new group**; nothing is overwritten. Groups are capped (last 6 groups / ~40 products) so payloads stay small.
- `focus` is recomputed after every turn: a single product opened/discussed → focus is that product; a fresh list → focus is that group; an explicit reference resolves focus to what it names.
- `factsShown` records the specs/price/pros the assistant already stated, so "which one had 32GB?" is answered from memory instead of a new search.
- Liked / rejected / in-cart are separate commitment levels, and rejection is a soft signal (a rejected product is de-prioritised in new recommendations but still retrievable — "the one I rejected earlier").

## One agent turn, reference resolution inside it

No classifier, no extra LLM hop (that is what made second turns take minutes). Each non-deterministic message is a **single** `gpt-commerce-agent` call that receives, alongside the trimmed conversation:

- a compact `product_memory` block: each group as `G1 (turn 2, "gaming laptop"): #1 ASUS TUF 89M, #2 HP Victus 72M …`, plus liked / rejected / cart / current focus lines. Roughly 400-800 tokens, not the full product objects.
- a resolution contract in the system prompt with three explicit slots the model must fill before answering:
  - `subject` — what the user wants **now** (new category/need, or an existing group)
  - `reference` — previously shown products used only as context ("for this laptop", "with these laptops")
  - `action` — search / details / compare / recall / cart
- the hard rule that a reference is never the answer: if `subject` is new, the reply contains only new products; the referenced products are used to shape the query and the copy, never re-listed.
- `recall` needs no search at all — the answer is composed from memory, which makes those turns near-instant.

Tools stay a small universal set on one call: `search_products`, `product_details`, `compare_products`, `cart_operations`, `recall_from_memory`. The model picks; there is no server-side mode routing.

## Numbering that stays valid

Product numbers become group-scoped and stable: the badge shown in chat maps to `groupId + position`, stored on the message. "Number 2" resolves against the **most recent group** by default; when an older group is referenced ("the second one you showed at the start"), the memory block lets the model name it and the client resolves it by id, not by index. Cart adds resolve through ids, so a later list can never add the wrong product.

## Speed budget

Target stays under 5-6s:

- one gateway call per turn (the second re-ranking call is folded into the same request; candidates are already trimmed to compact rows)
- embedding generation stays parallel with the first call
- deterministic Persian phrasings (add/remove/quantity/checkout/orders) keep resolving locally with zero network
- pure recall/comparison over already-shown products answers from memory with no DB round trip
- the 25s client timeout stays as the hard ceiling with a graceful Persian fallback

## Removing what does not serve this

- `supabase/functions/classify-intent/` deleted, plus its entry in `supabase/config.toml`. It is the direct cause of the multi-minute second turn and it duplicates work the single agent turn does better.
- Mode-based routing (`discovery` / `comparison` / `info_retrieval` / `conversational` / `cart_manipulation`) in `gpt-commerce-agent` replaced by one agentic prompt + tool set.
- `trimHistoryForAgent`'s product-message filter removed; product context now travels as structured memory instead of being dropped.

## Technical notes

Files touched:

- `src/features/gpt-commerce/hooks/useBasketState.ts` — `productMemory` on `BasketState`, storage version bump.
- new `src/features/gpt-commerce/hooks/useProductMemory.ts` — append group, record facts, mark liked/rejected/cart, recompute focus, serialise the compact block, cap size.
- `src/features/gpt-commerce/hooks/useAgentMessages.ts` — finish the in-progress unified call (it currently references a `callUnifiedAgent` that is not implemented yet, so the file does not compile), pass `product_memory`, resolve returned ids through memory, record every shown group.
- `supabase/functions/gpt-commerce-agent/index.ts` — agentic prompt with the subject/reference/action contract, universal tool set, memory-aware search query building, single-pass ranking.
- `supabase/config.toml` — drop the classifier entry.
- `roadmap.md` — record this task (not writable in plan mode).

Verification: run the eight scenarios from the review on desktop and mobile — subject switching across six categories, group reference, "for this X", cross-group recall, numbering after a second list, like/reject behaviour, comparison limited to named products, and cart from conversation — each timed to confirm the 5-6s budget.
