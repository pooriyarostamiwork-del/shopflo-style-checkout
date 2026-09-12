# پت‌آباد — One-card question journey, real price tiers, and conversation memory

## What is verified today

**Question UI.** The server intentionally asks one question per turn (so each answer can change the next question), but the client appends every question as a brand-new assistant message and every tap as a new user bubble. There is no loading state inside the card between steps.

**Price options.** For «غذای خارجی گربه» the budget quantiles are computed on the slice `species=گربه + foreign` with the free-text query, and that query does not narrow anything: the slice is all 644 foreign cat items (food, treats, cans, litter, toys, supplements) with q1 = 310k, so the first bucket becomes «تا ۳۰۰ هزار تومان». The real catalog is bimodal: foreign cat cans median 360k, treats 512k, pouches 475k, dry food median 6.1M (q1 2.5M, q3 16M). A single set of buckets over all of them is meaningless; price must be computed after the product type is known.

**Memory.** The assistant has no per-conversation memory of the shopper's pets. Species and age are re-derived on every request by scanning only the last 6 messages (each truncated to 300 chars, and question cards carry empty text). The shopping context is the generic electronics one (gaming, recipient, budget) with no pet fields. The question flow starts with species only, so age/needs are asked again even when they were stated earlier. After a dog bundle (5–6 turns) the cat's age is already out of the window.

## What we build (PetAbad only)

### 1. One card for the whole question journey

- The first question opens a single "guidance card" message. Every following question from the server is rendered inside that same card: answered steps collapse to a compact row (question → chosen answer, tappable to change), the current question shows below with its options, and while the next question is being computed the card shows an inline shimmer («دارم گزینه‌های بعدی رو از موجودی چک می‌کنم…») instead of the chat-level loading bubble.
- The tap is still sent to the assistant as the answer, but it is not shown as a separate user bubble; it lives in the collapsed step row. The final product answer arrives as a normal new message under the card.
- A card that is abandoned (shopper types something else) or completed becomes read-only, as today. History/reload restores the card with all its steps.
- the final output of the card must not be one message per each question, all the questions that have been answered must be rendered as a single message. 
- Works identically on `/petabad`, `/m/petabad` and `/petabad/floating`.

### 2. Price computed from the actual configuration

- For single-product flows, a "product type" question is added before price whenever the request does not already name one (e.g. «غذا» for a cat → خشک / کنسرو / پوچ / تشویقی), with options taken from live catalog counts. If the request already says «غذای خشک» / «کنسرو» / «تشویقی», the type is set silently.
- Budget buckets are then computed on the narrowed slice: species + product type + life stage + needs + origin. Labels stay «تا X تومان» / «X تا Y تومان» / «بالای X تومان»; buckets that are closer than the rounding step are merged; the question is skipped when the slice is too small or too flat to matter.
- Bundle tiers (اقتصادی / کامل / حرفه‌ای) are priced per essential on the same narrowed slices, so a starter pack for an adult cat prices adult products, not kitten milk or treats.

### 3. Conversation memory that drives everything

- A per-conversation pet memory is kept alongside the existing product memory: each pet (species, given name if any, age / life stage, breed size, health needs, stated preferences), the active pet, brands and origins discussed / preferred / rejected, budgets per pet and product type, and topics already covered. It is filled from the shopper's words, from every answered question step, and from a compact signal the assistant can emit; it is saved with the basket so it survives reload.
- «گربم» / «سگم» / «برای همون» resolve to the matching pet profile; switching between pets never mixes their facts.
- The question flow is seeded from memory: questions whose answers are already known (age, needs, origin preference) are skipped, and the card says so briefly («سن گربه‌ت رو از قبل دارم: ۷ سال»). Only genuinely unknown things are asked.
- Product discovery uses the remembered species/stage/needs/origin/budget as filters and locks, and product explanations mention why a pick fits this specific pet.
- Informational and FAQ answers see the same memory (e.g. «برای گربه‌ی سنیورت این برندها…»).
- The recent-history window sent to the assistant grows from 6 to 12 turns, and question-card turns carry their text (question + answer) so nothing is lost in the window.

### 4. Regression checks

- Add replay cases to `scripts/petabad-eval.ts`: cat aged 7 → dog bundle → «راهنماییم می‌کنی چه غذایی باید برای گربم بگیرم» (no age question, senior lock applied); «غذای خارجی گربه» guidance (no bucket under 1M once dry food is chosen, bucket edges within the dry-food quantiles); a canned-food request (buckets within the can quantiles); brand asked about earlier is remembered in a later informational turn.

## Technical details

- `src/features/petabad/hooks/petMemory.ts` (new): `PetMemory { pets: PetProfile[]; activePetId; brands: {discussed, liked, rejected}; origin; budgets; topics }`, deterministic extractors (species words, ages «هفت سالشه»/«۷ ساله», stage words, needs via the existing need dictionary, brand names from `brand_aliases`), `serializePetMemory()` (≤ 10 lines of Persian for the prompt), `mergeMemorySignal()`. Stored in basket state next to `productMemory`; included in the basket sync filter and storage version bump.
- `useAgentMessages.ts`: send `pet_memory` (serialized + structured) with every call; on clarification responses carrying `question_flow`, merge the step into the existing open flow message instead of pushing a new message (`clarification.steps[]` with `answer` per step, `pendingStep` while waiting); do not push the tap as a user message when it answers an open flow card (it is still added to the outbound history); apply `MEMORY:{...}` signals; `trimHistoryForAgent` → 12 turns, and synthesize `content` for card messages from question + answer.
- `ClarificationBlocks.tsx` (petabad): new journey renderer — collapsed answered rows, active step, inline shimmer (`ShiningText`), read-only when done; legacy `single`/`steps` shapes still render.
- `questionFlow.ts`: `startFlow(goal, seed, known: {species, lifeStage, needs, foreign, productType})` pre-fills `answers` and marks those steps as `asked`; new `typeQuestion` builder using `product_types` buckets from `pet_question_facets`; `singleSlice` / `bundleSlices` pass `p_product_types`, `p_life_stage`, `p_needs`; `budgetQuestion` requires the type (or a type-less category such as litter) before it runs; bucket merging rule.
- `index.ts` (petabad-agent): parse `pet_memory`; derive `lockedSpecies`/`lockedStage`/needs/foreign from the active pet when the message does not name them (resolving possessive references to the active pet); pass known facts into `startFlow`; add the memory block to the system prompt for discovery, comparison and informational routes; allow the model to emit `MEMORY:{pet, age, needs, brands_liked...}` next to the existing `GOAL` signal; respond with `flow_id` so the client can attach steps to the right card.
- `pet_question_facets`: already accepts `p_product_types`, `p_needs`, `p_life_stage`; verify it returns a `product_types` bucket list, otherwise add it in a small migration.
- Out of scope: Flowcart/GPTCommerce/Shift, inferred-filter chips.