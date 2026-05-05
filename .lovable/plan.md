
# /gptcommerce/docs/ai — AI & Agentic Architecture Docs

A long-form, dark-themed engineering wiki documenting **every** AI/agent line in the codebase, plus a docs-grounded chatbot. Built so credit limits never compromise depth: split into 5 self-contained steps that can resume cleanly between sessions.

---

## What I read in the codebase (grounding the doc)

Confirmed implementation surface for `/gptcommerce` + `/m/gptcommerce`:

- **Edge functions**: `classify-intent` (Gemini 2.5 Flash Lite, structured tool-call JSON), `gpt-commerce-agent` (Gemini 2.5 Flash, modes: `discovery|comparison|info_retrieval|conversational|cart_manipulation` with `search_products`, `get_product_details`, `execute_cart_operations` tools, parallel embedding via `Supabase.ai.Session("gte-small")`, 2-step retrieve → re-rank with `SELECTED_IDS:[...]` parsing), `generate-embeddings` (batched gte-small backfill), `enrich-products`, `scrape-digikala` (Firecrawl), `process-csv-products`, `import-csv-from-storage`, `send-otp`/`verify-otp` (Kavenegar).
- **DB**: `products` (pgvector `embedding`, `tsvector search_vector`, GIN trigram, `specs` jsonb, `color_options[]`), RPC `hybrid_product_search` (FTS 0.30/0.35 + trigram name 0.20 + trigram tags 0.10 + vector 0.30 + subcategory boost), `normalize_persian()`, `products_search_vector_update()` trigger; `baskets` (jsonb messages/cart/agentic_state), `orders`, `user_addresses`, `profiles`, `otp_codes`. RLS owner-only on user data.
- **Frontend agent loop**: `useAgentMessages.ts` (819 lines) — intent → switch → transactional fast paths (`cart_add`, `cart_add_by_name` with fuzzy match + disambiguation chips, `cart_remove`, `quantity_update`, `checkout_initiate`, `checkout_direct`, `save_for_later`, `order_status`) vs LLM agent calls (`callAgent`, `callCartManipulationAgent`, `sendMessageToBasket`); `executeCartActions` batched reducer; `extractSmartName` basket auto-naming; `mapDbProduct` adapter.
- **State**: `useBasketState`, `useCartPersistence` (1s debounced sync, hydration filter, version migration), `useCheckoutFlow`, `useUserData`; isolated per-basket conversation context.
- **UI surface**: `GPTCommerceShell`, `MobileGPTCommerceShell`, `ChatThread`, `AgenticMessageComponents`, `ProductCarousels`, `MobilePromptTipsCard`, `OTPModal` (Kavenegar token exchange).

The doc will quote real symbol names, file paths, line ranges, and SQL signatures so it stays a true reference, not a paraphrase.

---

## Architectural decisions

1. **Route**: `/gptcommerce/docs/ai` added to `src/App.tsx` as a standalone route (no GPTCommerceShell — docs has its own `DocsLayout`).
2. **Content as data**: A single `src/pages/docs/ai/content/` folder with one TS module per Part (`part1-overview.ts` … `part9-roadmap.ts`), each exporting `{ id, title, sections: Section[] }` where `Section` supports prose blocks, code blocks (lang + code), Mermaid blocks, callouts (`to-be-implemented` / `not-needed` / `info` / `warning`), and tables. This keeps each step's diff small and resumable.
3. **Tagging policy**: Every workflow/section the prompt requests but the codebase doesn't implement gets a visible `<StatusBadge>`:
   - `to-be-implemented` (with a concrete ignition plan: schema delta, edge function name, UI hook)
   - `not-needed` (with one-sentence justification tied to current product scope)
   - `live` (links to file:line ranges).
4. **Chatbot model**: User asked for "latest Claude Sonnet". The Lovable AI Gateway available in this project supports Google Gemini + OpenAI GPT-5 families only — **Claude is not available without a user-supplied Anthropic API key**. Plan offers two options:
   - **A (default)**: ship docs chatbot on `google/gemini-2.5-pro` via existing gateway (no new secret), tagged in UI as "Powered by Gemini 2.5 Pro — Claude planned".
   - **B**: user adds `ANTHROPIC_API_KEY` secret; we build edge function `docs-chat` that proxies to `claude-sonnet-4-5` (or latest) directly. Will prompt for the secret in Step 5 if user picks B.
5. **Docs chatbot grounding**: The chatbot is RAG-lite — at request time we ship the entire docs corpus (~30–60KB after compaction) as system context. No vector store needed because content is fully static and self-contained per the user's spec.

---

## Step-by-step plan (resumable across sessions)

Each step ends in a deployable, navigable state. If credits run out mid-step, the next session opens the same plan and continues from the next checkbox.

### Step 1 — Scaffold + routing + dark-theme shell (small)
- Add route `/gptcommerce/docs/ai` in `src/App.tsx`.
- Create `src/pages/docs/ai/DocsAIPage.tsx` and `src/pages/docs/ai/components/`:
  - `DocsLayout.tsx` (sticky left sidebar 280px, content max-w-4xl, dark `#0b1120` bg, indigo-500 accent, gray-100 text).
  - `DocsSidebar.tsx` with TOC tree, sticky search input (client-side filter over section titles + headings), mobile hamburger drawer (shadcn `Sheet`).
  - `DocsContent.tsx` renderer that walks the section tree.
  - `CodeBlock.tsx` (react-syntax-highlighter `oneDark`, copy-to-clipboard with Lucide `Copy`/`Check`).
  - `MermaidDiagram.tsx` (lazy-init `mermaid` via `useEffect`, dark theme, unique id per render, error boundary).
  - `StatusBadge.tsx` (`live | to-be-implemented | not-needed`).
  - `Callout.tsx` (info/warning/idea variants).
- Install `mermaid` and `react-syntax-highlighter` (+ types).
- Smoke-test rendering with one stub section per Part.

### Step 2 — Parts I–III content (Architecture, Discovery, Intent)
- `part1-overview.ts`: high-level architecture prose; **Mermaid C4-style architecture diagram** (User → MobileShell/Shell → useAgentMessages → classify-intent → gpt-commerce-agent → hybrid_product_search RPC → products+pgvector → Supabase Realtime back to ChatThread). Component responsibility table with file paths.
- `part2-discovery.ts`:
  - Prompt-processing pipeline traced line-by-line through `useAgentMessages.handleSendMessage` → `classifyIntent` → `callAgent('discovery')` → edge function 2-step (tool-call retrieve → re-rank with `SELECTED_IDS`).
  - SQL listing of `hybrid_product_search` (full body) with weight breakdown table.
  - `normalize_persian()` and `products_search_vector_update()` trigger explained.
  - `mapDbProduct` adapter and `extractSmartName` documented.
  - Personalization section: tagged `to-be-implemented` with ignition plan (extend `profiles` with `preferences jsonb`, inject into agent system prompt, add `purchase_history` projection from `orders`).
  - Mermaid sequence diagram: "Compare Sony WH-1000XM5 vs Bose QC45" → comparison-mode flow using existing `comparison` prompt + `products_context` injection.
- `part3-intent.ts`:
  - Full `classify-intent` system prompt + tool schema reproduced verbatim.
  - All real intent subtypes from the codebase enumerated with routing target (transactional fast path vs which agent mode).
  - User's requested intents not in code (BOOK_APPOINTMENT, SET_PRICE_ALERT, MANAGE_SUBSCRIPTIONS, RETURN_ITEM, FIND_DEALS, REORDER_LAST, NEGOTIATION) listed with `to-be-implemented` or `not-needed` badges + ignition notes.
  - Confidence/fallback logic (current: silent fall-through to `discovery` on parse failure) — clarification-question pattern is `to-be-implemented` (proposal: threshold 0.55 → emit clarifying assistant message with `quickReplies`).
  - Code listing: real `classifyIntent` function from `useAgentMessages.ts` (lines 86–111).

### Step 3 — Part IV: every agentic workflow (the meat)
For each workflow: trigger intent, preconditions, step-by-step pseudocode citing real functions/tables, error handling, user-visible status, end state. Each gets its own collapsible card + Mermaid sequence diagram.

Workflows documented as **live**:
1. Cart manipulation (add/update/remove/replace/batch/cheapest) — split into transactional fast path vs `cart_manipulation` LLM mode (`execute_cart_operations` tool, `executeCartActions` batched reducer, disambiguation chips).
2. Checkout / Order placement — `useCheckoutFlow`, `handleFinalizePurchase`, `orders` insert path, address+shipping selection, payment selector states, `automatic-basket-finalization` trigger.
3. Multi-vendor product comparison — `comparison` mode + `products_context` injection.
4. Inline product details (chat PDP) — `handleInlineProductDetails` + `PDPProductComponent`.
5. Save for later / wishlist — `handleSaveProduct` + `savedItems`.
6. Order tracking inquiry — fixed Persian response routing to Orders panel.
7. Smart basket naming + auto-finalization — `extractSmartName`, finalized-zone migration.
8. New-user OTP onboarding (`needsName` flow) — Kavenegar Lookup → `verify-otp` token exchange → profile collection.
9. Cart persistence + hydration — debounced sync, version migration, basket-conversation isolation.
10. Brand disambiguation chips — client-side fuzzy match flow.

Workflows tagged **to-be-implemented** (each with: schema delta + edge function + UI surface + estimated effort):
11. Price Alert Agent — `price_alerts` table (`user_id, product_id, threshold, active`), pg_cron job, `notify-price-drop` edge function, Realtime channel `price_alerts:user_id=eq.X`.
12. Appointment / Doctor Reservation — `appointments` table, vendor adapter pattern, slot picker UI component.
13. Digital Product Delivery — `digital_assets` table, post-payment webhook to mint license, in-chat reveal card.
14. Subscription Management — `subscriptions` + `subscription_events`, Stripe Billing integration plan.
15. Return & Refund — `return_requests` table with state machine (requested → approved → received → refunded), agent intent `RETURN_ITEM`.
16. Real-time order tracking — vendor polling worker + Realtime `orders` updates + `OrderTracker` component.
17. Negotiation Proxy — multi-turn agent loop with vendor offer API; flagged as research-grade.
18. Re-order Previous Purchase — `REORDER_LAST` intent → fetch latest `orders` → batch-add to basket → checkout.
19. Deal Discovery / Flash Sales background agent — pg_cron + `flash_deals` table + push channel.
20. `agent_actions` real-time progress channel — table + per-step inserts from edge function + `AgentActionToast` subscriber.

Workflows tagged **not-needed**:
- Travel / restaurant booking, bill payments — out of scope per current product memory (`shopflo-demo-scope`).
- Fraud check engine — demo scope, no real payments.

### Step 4 — Parts V–VIII (Schema, Loop, UI, Security)
- `part5-schema.ts`: every public table (columns, types, defaults, RLS policies copied from migration history), Mermaid ER diagram, pgvector + GIN index notes, `agent_sessions` / `intent_logs` / `agent_actions` marked `to-be-implemented` with full proposed CREATE TABLE statements + RLS.
- `part6-state-machine.ts`: current implicit state machine (per-basket `agenticState.step`) reverse-engineered from `useBasketState` + `useAgentMessages`; Mermaid `stateDiagram-v2`: IDLE → PROCESSING → PRODUCTS_SHOWN → PRODUCT_ADDED → CHECKOUT_ADDRESS → CHECKOUT_SHIPPING → CHECKOUT_PAYMENT → FINALIZED. Delegation mode tagged `to-be-implemented`.
- `part7-ui.ts`: component inventory with file paths + responsibilities (ChatBubble, `ChatProductCard`, `RightPanel`, `AgenticMessageComponents` subcomponents, `MobilePromptTipsCard`, `ProductCarousels`); real-time hookup section explains current polling-only model and tags Realtime subscription as `to-be-implemented` with code sketch.
- `part8-security.ts`: RLS policies enumerated from schema; OTP token-exchange flow documented; Edge function vs client API key boundary; `service_role` usage pattern; PII redaction in logs (`to-be-implemented`); demo-scope no-real-payments banner.

### Step 5 — Part IX (Roadmap) + Docs Chatbot
- `part9-roadmap.ts`: prioritized matrix of `to-be-implemented` items, dependency graph (Mermaid), suggested 3-phase rollout.
- `DocsChatbot.tsx`: floating panel pinned bottom-right of docs page, shadcn `Sheet` on mobile.
  - Compacts the entire docs corpus (strip Mermaid + dedupe code) into a single system message at request time.
  - Edge function `docs-ai-chat`:
    - **Default (Option A)**: `google/gemini-2.5-pro` via Lovable AI Gateway, no new secret.
    - **Option B (Claude)**: requires user to add `ANTHROPIC_API_KEY`; will use `claude-sonnet-4-5` (or latest available). Will prompt for secret at start of Step 5 only if user opts in here.
  - Streams response, renders markdown, supports follow-ups, "Suggest a feature plan" button that pre-fills a roadmap-generation prompt.

---

## Files to create

```text
src/App.tsx                                              (edit: +1 route)
src/pages/docs/ai/DocsAIPage.tsx
src/pages/docs/ai/components/DocsLayout.tsx
src/pages/docs/ai/components/DocsSidebar.tsx
src/pages/docs/ai/components/DocsContent.tsx
src/pages/docs/ai/components/CodeBlock.tsx
src/pages/docs/ai/components/MermaidDiagram.tsx
src/pages/docs/ai/components/StatusBadge.tsx
src/pages/docs/ai/components/Callout.tsx
src/pages/docs/ai/components/DocsChatbot.tsx
src/pages/docs/ai/content/types.ts
src/pages/docs/ai/content/index.ts                       (assembles all parts)
src/pages/docs/ai/content/part1-overview.ts
src/pages/docs/ai/content/part2-discovery.ts
src/pages/docs/ai/content/part3-intent.ts
src/pages/docs/ai/content/part4-workflows.ts            (largest file; split if >60KB)
src/pages/docs/ai/content/part5-schema.ts
src/pages/docs/ai/content/part6-state-machine.ts
src/pages/docs/ai/content/part7-ui.ts
src/pages/docs/ai/content/part8-security.ts
src/pages/docs/ai/content/part9-roadmap.ts
supabase/functions/docs-ai-chat/index.ts                 (Step 5, Gemini default)
```

No edits to existing `/gptcommerce` runtime code. No DB migrations in this plan (proposed `agent_sessions`/`agent_actions`/`price_alerts`/etc. are documented as `to-be-implemented` only; we'll create them in a follow-up if approved).

---

## Open question before Step 5

**Docs chatbot model**: Claude is not in the Lovable AI Gateway. Pick at the start of Step 5:
- **A**: Ship on `google/gemini-2.5-pro` now, label as "Claude planned" — zero setup.
- **B**: Add `ANTHROPIC_API_KEY` secret and ship on `claude-sonnet-4-5`.

I'll ask once we reach Step 5; Steps 1–4 are model-agnostic.
