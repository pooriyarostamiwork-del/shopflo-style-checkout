# Fix slow / non-responding chat on /gptcommerce and /m/gptcommerce

## What is actually happening (verified)

Gateway logs for this project show a 180-second request that ended in an upstream 503:

```text
20:17:31  google/gemini-2.5-flash-lite   180042 ms   upstream_error (503)
20:24:08  google/gemini-2.5-flash          1700 ms   success
20:24:11  google/gemini-2.5-flash          2718 ms   success
```

The 180s call is the `classify-intent` edge function (the only place `gemini-2.5-flash-lite` is used). The two fast calls are the real agent (`gpt-commerce-agent`), which answers in ~5s end to end.

Why it starts on the second message: the first message from the landing screen goes straight to the agent (`sendMessageToBasket` calls `gpt-commerce-agent` with `mode: 'discovery'`). Every message after that goes through `handleSendMessage`, which awaits `classify-intent` first, then routes to the agent. So turn 2 onward adds a blocking classifier hop with no timeout — when it stalls, the user waits the full stall before anything happens.

Secondary cost: a discovery turn is 3 sequential LLM calls (classifier -> tool-selection -> re-rank with ~17k input tokens).

## The fix: drop the classifier agent, use one tool-calling agent

An intent-classifier agent that routes to sibling agents is not the standard pattern for agentic commerce. The standard pattern (and what the `/shift` product already partly does) is: one agent, one turn, a small set of well-described tools; the model picks the tool. Deterministic phrasings are handled locally in code, not by an LLM.

1. **Local fast paths first (no network).** `/shift` already does this: regex on the normalized Persian message for add-by-number, remove, quantity up/down, and checkout. Port the same fast paths into `/gptcommerce`'s `useAgentMessages.ts`. These resolve instantly and cover most turn-2+ traffic.
2. **Everything else goes to `gpt-commerce-agent` in one call.** Remove the `classifyIntent` call and the intent switch from `handleSendMessage`. The agent receives the message plus trimmed history, cart context, and the last recommended products, and decides via tools.
3. **Give the agent the cart tool alongside search.** Instead of picking a `mode` client-side, send one unified mode whose tool set is `search_products`, `get_product_details`, and `cart_operations`. The model calls whichever it needs; the client executes returned `cart_actions` exactly as it does today.
4. **Delete `classify-intent`.** Remove the edge function and its `config.toml` entry once nothing calls it. `/shift` also calls it — it gets the same treatment so both products stay on one architecture.
5. **Make a slow model call fail fast instead of hanging.** Bound the agent request client-side (~20s) and show a retry-able error message rather than an indefinite spinner.
6. **Trim the second LLM hop.** Send the re-rank candidates as a compact list (id, name, price, key tags) instead of full tool JSON, which is what pushes that call to ~17k input tokens.

Nothing about the visual chat UI, product cards, cart, or checkout steps changes.

## Files

- `src/features/gpt-commerce/hooks/useAgentMessages.ts` — remove `classifyIntent` + intent routing, add local fast paths, single agent call, timeout.
- `src/features/shift/hooks/useAgentMessages.ts` — same removal (keeps its existing fast paths).
- `supabase/functions/gpt-commerce-agent/index.ts` — unified tool set, leaner re-rank payload.
- `supabase/functions/shift-agent/index.ts` — same change for parity.
- Delete `supabase/functions/classify-intent/`.

Mobile (`/m/gptcommerce`) shares the same hook, so it is fixed by the same change.

## Verification

Send a first message, then three follow-ups (a new search, "محصول شماره ۲ رو اضافه کن", "نهایی کردن خرید") and confirm each replies in a few seconds, with gateway logs showing at most two model calls per turn and no 180s entries.
