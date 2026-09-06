# Fix six chat issues on /gptcommerce (desktop + mobile)

All confirmed by reading the assistant code and the chat surfaces. Scope: `/gptcommerce`, `/m/gptcommerce` and their shared assistant. Shift is untouched.

## 1. Empty bubble after answering a step-by-step card

What happens: when the card is sent, the assistant message is created with empty text, so an empty bubble is drawn. After the person answers, the card replaces itself with a separate small "باشه، ادامه می‌دیم." panel below that empty bubble.

Fix: no bubble is drawn while text is empty, and once the card is answered its confirmation line moves inside the normal assistant bubble while the card disappears. One bubble, one line, nothing empty.

## 2. Counts and totals still leaking into answers

What happens: the final answer step is explicitly instructed to state how many matches were found, and a separate rule tells it to always report the total. That is why lines like "کلاً ۱۴۸۹ مدل..." and "از بین ۱۲ کاندیدا..." appear.

Fix: totals, candidate counts and price ranges become opt-in everywhere — only when the person asked about quantity or price. The answer never mentions internal candidate numbers under any condition (that is bookkeeping, not shopping info).

## 3. Missing "why this product" paragraph

What happens: the final step only asks for one short overall explanation, so per-product reasoning disappeared.

Fix: the required answer shape becomes, for every product shown:

```text
۱. <name with key specs، با قیمت …>
   <one short line: why this one fits what the person asked>
```

Same order as the cards, one reason line per product, no markdown.

## 4. "برای گیمینگ راهنماییم کن لپتاپ بگیرم" answered with "متوجه نشدم"

What happens: the turn is detected as a guidance request and the model is forced to ask through the card, but when it returns an empty/invalid card payload the request falls through the branches and ends on the generic fallback line.

Fix:
- A guidance turn can never end on the fallback line: if the card payload is empty or invalid, the built-in question card is used.
- When the person already stated the use ("گیمینگ", "دانشجویی", "طراحی", "برنامه‌نویسی", "اداری"), that step is skipped and the card starts at budget/priority — and the stated use is carried into the following search.

## 5. Questions still written as text with bullet options

What happens: the text-to-card safety net requires two or more question marks, so a single question followed by bullet options stays plain text.

Fix: any reply that contains a question plus a bullet/numbered option list becomes a card — one question turns into a single-question card, several turn into steps. This applies to every turn, not only ones detected as guidance, and the option labels come from the model's own bullets so the wording stays natural.

## 6. Dynamic text in the loading bubble

The waiting bubble gets a short rotating line next to the icon, chosen from the person's own message so it never lies:

- product/search intent → «دارم دنبال محصول می‌گردم…», «دارم گزینه‌های بهتر رو گلچین می‌کنم…»
- comparison → «دارم مقایسه می‌کنم…»
- cart/checkout → «دارم سبدت رو به‌روز می‌کنم…»
- plain question / anything else → «دارم درخواستت رو بررسی می‌کنم…»

Same behaviour on desktop and mobile.

## Verification

Replay the exact reported cases: the two gaming requests, "لپتاپ گیمینگ چی بگیرم؟", a normal product request (checking reason lines and no totals), and answering a card (checking a single clean bubble). Response times stay in the current range — no extra model calls are added.

## Technical notes

- `supabase/functions/gpt-commerce-agent/index.ts`: remove the matched_total/candidate-count instructions from the re-rank step and make them conditional on a count/price question; add the per-product reason line to the required output shape; broaden `isQuestionHeavy` into an option-list detector used on every no-tool reply; guidance fallback when `ask_clarification` args are empty/invalid; usage-aware `DEFAULT_GUIDANCE_STEPS`.
- `src/components/gpt-commerce/ChatThread.tsx`, `src/features/gpt-commerce/mobile/MobileChatThread.tsx`: skip empty bubbles, host the resolved-card confirmation inside the bubble, add the loading-bubble label.
- `src/components/gpt-commerce/ClarificationBlocks.tsx`: report resolution upward instead of rendering its own done panel.
- Intent wording for the loading label is derived client-side from the sent message (no extra request).
