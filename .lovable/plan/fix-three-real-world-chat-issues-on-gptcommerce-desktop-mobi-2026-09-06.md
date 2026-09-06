# Fix three real-world chat issues on /gptcommerce (desktop + mobile)

Confirmed by reading the assistant's code and the recent chat logs. All three come from the same assistant service; no UI redesign is involved.

## Issue 1 — It dumps model counts even when nobody asked

What happens: for "همه برندهای لپ تاپتو برام لیست کن" the assistant is instructed to read out the complete brand list *with counts* plus total and price range, every time.

Fix: split "list" from "count".

- Asking for a list → brand names only, in a clean order, no numbers, no price range.
- Only when the person actually asks about quantity ("چند مدل", "چندتا", "تعداد") does the reply include counts.
- Totals and price ranges likewise become opt-in, not default extras.

## Issue 2 — Samsung laptop had no product card, and a line of code leaked into the reply

What happens: the assistant already had that Samsung laptop in its conversation memory, so it answered purely from memory without asking the catalog for it. That path returns text only — no product cards attached — and it also skips the step that strips the internal bookkeeping lines, which is exactly why `LIKED_IDS:[...]` appeared at the end of the message.

Fix (three parts):

1. Always clean internal signal lines (`LIKED_IDS`, `REJECTED_IDS`, `REFERENCE_IDS`, `SELECTED_IDS`, `GOAL`) out of the visible text on **every** reply path, not just the search path. A final guard removes any leftover `LABEL:[...]`/`LABEL:{...}` line so nothing code-like ever reaches the chat.
2. When the reply names products the person has seen before, attach their cards automatically: any product id mentioned in the text is looked up and returned as a card, so "لپتاپ سامسونگ رو بفرست برام" always shows the card.
3. Stop printing raw ids in the message text (the "(شناسه: …)" part) — ids belong to the card, not the sentence.

## Issue 3 — Guidance requests come back as a bullet list of questions instead of tappable cards

What happens: the interactive question card is only requested when two readings point to different products. "راهنماییم کن لپ تاپ بگیرم" doesn't look ambiguous to it, so it wrote the questions as plain text.

Fix:

- Any "help me choose / guide me / نمی‌دونم چی بخرم / راهنماییم کن" style request must produce a step-by-step question card (usage → budget → priority), never a text list.
- Detect those phrasings deterministically before the model call and require the question card for that turn.
- Add a hard rule plus a safety net: if a reply is mostly questions with no card, it is converted into a card instead of being shown as a bullet list.  


## Verification

Replay the exact three messages against the live assistant and confirm: brand list without numbers; Samsung reply with a visible card and no code-like line; guidance request rendering a tappable multi-step card. Watch response times stay in the current 2–6s range (no extra model calls are added).

## Technical notes

- All edits: `supabase/functions/gpt-commerce-agent/index.ts` (prompt rules, `catalog_facets` list-vs-count behaviour, signal stripping moved into one shared sanitizer used by every return path, id-mention product hydration, deterministic guidance detection forcing `ask_clarification`).
- Client already renders `clarification` cards on desktop (`ChatThread.tsx`) and mobile (`MobileChatThread.tsx`) — no client change expected beyond nothing at all.
- Shift is untouched.

## Your other question: is this codebase reusable for a pet-category clone?

Mostly yes, with a few category-specific spots to make configurable. Same product schema (brand, price, subcategory, …) works as is; hybrid search, facets, memory, cart and checkout are category-agnostic. What is currently electronics-specific:

1. The assistant's system prompt hardcodes the subcategory list and electronics wording/examples — it should read subcategories from the catalog instead.
2. Category-specific vocabulary (evidence terms like "بی‌سیم/گیمینگ", brand aliases) is tuned for electronics; a pet catalog needs its own alias/synonym set.
3. Clarification/discovery question sets (usage, budget) are generic today, but pet-specific dimensions (animal, age, weight) would be worth adding.

So: reusable core, plus a per-category configuration layer (subcategories, synonyms, question dimensions, persona). Note the `/shift` product already went down the category-scoped route — if you want a pet clone, we can plan that separately. 