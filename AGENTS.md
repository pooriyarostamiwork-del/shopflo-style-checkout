# Architecture rules

- Product entry from storefront cards and `?p` deep links must use `seedProductConversation`; this keeps desktop/mobile and Flowcart/PetAbad on one conversational path without a classical PDP.- Product-entry conversations are local drafts (`Basket.isDraft`) excluded from history and DB sync until the first message or add-to-cart; this keeps History clean and `?p` links shareable.
- Chat URLs carry `?p=<product>` alongside `?c=<basket>`; an unowned `?c` falls back to a fresh PDP, so shared links never 404 or leak another user's chat.
- Composer Quick Replies come only from `resolveQuickReplies` in `src/lib/quickReplies.ts` and render via `QuickReplyBar`; one funnel-stage engine serves every shell.
