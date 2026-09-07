# پت آباد — species discipline, floating agent, enrichment, model upgrade

Scope: PetAbad only (`/petabad`, `/m/petabad`, new `/petabad/floating`, `supabase/functions/petabad-agent`, `petabad-enrich`). Flowcart (`/gptcommerce`) and Shift are not touched.

---

## Issue 1 — Never leave the declared animal, and show every product mentioned

Two confirmed defects:

1. Multi-need searches run per need without carrying the pet forward, so a "بهداشت و مراقبت" pass returned bird products, and the reply even narrated that fact.
2. The answer text numbered 9 products while only 6 cards were sent (`petabad-agent/index.ts:1573` caps the card list at 6).

### A. Hard species lock (server-side, not prompt-only)
- Track a per-turn `activeSpecies` (and `lifeStage`) resolved from: the clarification answers, the current message, then conversation memory. Once known it is sticky for the whole conversation until the user names another animal.
- Inject it into every `search_products` call automatically: if the model omits `species`, fill it; if the model sends a different species, override it. Same for `catalog_facets`.
- After retrieval, drop any row whose species conflicts with the locked species, before the results ever reach the answer model. Same filter applied to recall and cross-sell paths.
- Life-stage discipline: when the user says بچه‌گربه, prefer `life_stage = نابالغ` plus stage-neutral rows, and never mention گربه بالغ in the copy.
- Prompt rules updated: never name, describe, or reason about any animal other than the locked one; never explain that irrelevant results were found. If a need has no matching product, say only that honestly for that need.

### B. Multi-need bundle retrieval
- When the needs step returns several selections, run one bounded search per need (parallel, species+stage locked), then assemble a per-need grouped result with a small fixed quota per need.
- A need with zero species-valid results is reported as "برای این بخش گزینه مناسب پیدا نکردم" with no substitute product.
- Add cat/dog-aware need→subcategory mapping (بهداشت و مراقبت → شامپو، مسواک/خمیردندان، خاک و ظرف بهداشتی، لوسیون گوش/چشم…) so a need word alone cannot drift into another animal's shelf.

### C. Text↔cards parity (single source of truth)
- Raise the card list to match the answer: the products passed to the answer model become the exact card set, in the same order, with the same numbering.
- Cap the bundle at a fixed maximum (e.g. 9 for multi-need, 6 for single-need) and pass that cap to the answer model as the only allowed count, so it can never number a product that has no card.
- Post-check before responding: strip from the text any numbered item whose id is absent from the card list, and never truncate the card array below the mentioned count.

### D. Verification
Replay in the deployed function and read the responses:
1. «بچه‌گربه دارم، غذا، بهداشت، اسباب‌بازی، مکمل می‌خوام» → every card is a cat/kitten product, no bird/dog word anywhere, cards count == numbered count.
2. «برای گربه عقیم شده غذا بده» → sterilised cat food only.
3. «سگ دارم» after a cat conversation → species lock switches cleanly.

---

## Issue 2 — Floating on-site shopping agent at `/petabad/floating`

New route `/petabad/floating` renders a mock merchant page (neutral placeholder storefront content, so the layer can be judged in context) with the assistant layered on top. Front-end only; it reuses the existing `petabad-agent`.

### Files (new, isolated under `src/features/petabad/floating/`)
- `FloatingAgentLauncher.tsx` — bottom-right pill button, PetAbad orange, paw/eyes mark + short label («دستیار خرید»), subtle idle breathing, not a support-bubble icon.
- `FloatingAgentPanel.tsx` — panel ~40% viewport width (min 420px, max 560px), full height minus margins, rounded, floating over the page with a light scrim; scale+fade open animation; ESC/backdrop/close-button dismiss; conversation persists while mounted. Tablet/mobile widths → full screen sheet.
- `FloatingAgentEmptyState.tsx` — «دنبال چی می‌گردی؟» + one supporting line + four starter chips (the Persian examples given).
- `FloatingChatThread.tsx` — purpose-built composition: conversation first, compact product cards tuned for the narrower column, clarification cards, comparison, and per-product "why".
- `FloatingHistory.tsx` — a compact top bar with «گفت‌وگوی جدید» and a history popover list (not a full sidebar), stored in localStorage under a floating-only key.
- `FloatingAgentShell.tsx` — state owner: reuses the existing PetAbad agent hook, with checkout/auth/cart flows disabled.
- `src/pages/PetabadFloating.tsx` + route in `App.tsx`.

### Kept vs excluded
Kept: wandering-eyes loader, shining loading text, tappable question cards (incl. multi-select), product cards, comparison, "why this product", PetAbad branding.
Excluded: auth/OTP, account panel, cart sidebar and cart management, checkout/payment/orders, نهایی کردن خرید CTA, footer, landing carousels/sliders/promos.

### Add-to-basket terminal action
- Button «افزودن به سبد» → optimistic «اضافه شد ✓» state on the card + one compact in-chat confirmation block listing what was added, with the line: «می‌تونی خریدت رو ادامه بدی یا از سایت پرداخت کنی.»
- No quantity/remove/coupon/shipping controls. Basket count is written to the shared PetAbad basket state only; no checkout surface.

### Verification
Playwright at desktop 1440 and 1024 plus 390 mobile: open/close, starter chip → products → add → confirmation, new chat + history restore, no console errors.

---

## Issue 3 — Triggering catalog enrichment manually

`petabad-enrich` is an HTTP function; it takes a POST JSON body:
- `{"report": true}` → coverage report (how many rows still missing country / life stage / breed size / product line / needs).
- `{"batch_size": 12, "max_batches": 6}` → processes up to that many rows and returns `processed`/`updated`/`remaining_hint`. Re-send until `remaining_hint` is 0.
- `{"dry_run": true}` → shows what it would write without saving.

I'll add a small guarded admin trigger so you don't need a terminal: a hidden panel at `/petabad/floating`'s sibling dev route is out of scope, so instead I'll document the exact invocation and, if you prefer, add a one-button "run enrichment batch" control inside the existing PetAbad dev surface. Tell me which you want; the default in this plan is documentation plus me running the remaining batches to completion once.

---

## Issue 4 — Model upgrade

Replace `google/gemini-2.5-flash` with `google/gemini-3.1-flash-lite` (confirmed available on the gateway) in:
- `supabase/functions/petabad-agent/index.ts` (both the tool-call and the answer/rerank call)
- `supabase/functions/petabad-enrich/index.ts`

Then live-test tool calling, JSON-schema clarification output and structured enrichment output on the new model, and measure latency; if tool-call reliability regresses, keep the answer call on the lite model and raise only the tool-selection call to `google/gemini-3-flash-preview`, and report that back.

---

## Technical notes
- Species/stage lock is enforced in code (filter + parameter override), not by prompt wording alone — prompts alone have already proven insufficient.
- Card/text parity is enforced by making the retrieved, filtered set authoritative and validating the final text against it.
- The floating agent adds no new backend: same edge function, same search, same memory format, separate localStorage namespace.
