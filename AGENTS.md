# Architecture rules

- Product entry from storefront cards and `?p` deep links must use `seedProductConversation`; this keeps desktop/mobile and Flowcart/PetAbad on one conversational path without a classical PDP.- Product-entry conversations are local drafts (`Basket.isDraft`) excluded from history and DB sync until the first message or add-to-cart; this keeps History clean and `?p` links shareable.
- Chat URLs carry `?p=<product>` alongside `?c=<basket>`; an unowned `?c` falls back to a fresh PDP, so shared links never 404 or leak another user's chat.
- Composer Quick Replies come only from `resolveQuickReplies` in `src/lib/quickReplies.ts` and render via `QuickReplyBar`; one funnel-stage engine serves every shell.
- Desktop chat uses LTR positioning rails with RTL content; assistant text, loading, and commerce blocks share the same left inset without changing Persian reading direction.
- Desktop cart panels share `CartPanelHeader`; one stroke-based header keeps title geometry and close controls consistent across storefronts.
- Telegram bot (@Flowcartbot) lives in `telegram-webhook`, uses `petabad-agent` in agentic mode and opens PetAbad as a Mini App via `?tg=<session_token>` (read by `telegram-session` + `useTelegramSession`); per-chat state stays in service-role-only `telegram_chats`, mirrored to `baskets` only when the phone matches an account, so the bot never forks agent logic.

- Telegram chat lifecycle is lazy and topic-based: archived topics retain their checkout selections, new-topic command/navigation pairs expire together on incoming updates, and completion opens a fresh topic without renaming the old title; this keeps session state isolated without a cron.
- PetAbad app and Telegram import greeting and shipping definitions from a runtime-neutral shared module under functions/_shared; this prevents copy, shipping IDs and fees drifting between channels.
- Mini App checkout receives owner-validated address/shipping from telegram-session, and completion requires an authenticated owner and matching order; bearer links alone never authorize checkout mutations.
- Telegram Mini App SSO only trusts HMAC-verified `initData` whose user id equals the chat's `chat_id` and which has a confirmed phone (`_shared/telegramAuth.ts`); the session token alone never grants login.
- Free-text checkout replies go directly to the main LLM with live checkout state; its checkout tool selects or confirms the current step, and stage guards prevent invalid advancement without a separate intent classifier.
- PetAbad questions are reasoning-first: the model decides via `ask_clarification` only when a concrete, outcome-changing unknown exists; no pre-written questionnaire (`startFlow`) is started, so questions always come from live context.
- Master catalogs are the base tables `digital_master` and `pet_master` (identity/content, `catalog_status`, `flowcart_eligible`, `origin`, `merged_into_id`); legacy names `products`/`pet_products` are security-invoker views showing only active masters, so drafts/merged duplicates never reach search, agents or storefronts.
- Chat stop/resend use a per-hook generation counter: stopping discards late replies, and resend re-runs the same user bubble (`deliveryStatus`).
- Old Shift storefront removed; `/shift` redirects to dashboards; Shift tables kept until deletion is approved.
- Vendor layer (`vendors`, `shipping_methods`, `discounts`, `vendor_inventory`) is additive and unread by agents yet, so live PetAbad is unchanged until switch-over.

- PetAbad uses no Jev calls: the existing main LLM reads LIVE_CONTEXT and owns routing, questions, checkout_action and structured cart qty_mode/amount; execution validates ids, quantities and checkout stages without a second model overriding intent.