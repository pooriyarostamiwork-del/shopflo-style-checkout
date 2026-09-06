# Fix the repeated «متأسفانه مشکلی پیش اومد» reply (/gptcommerce, /m/gptcommerce)

## What is actually happening

That sentence is not an AI failure and not a timeout. The latest real request at 20:55:59 UTC completed successfully in 3.5 seconds and returned an `ask_clarification` tool call with three populated steps. The problem occurs after that successful tool call, while the function grounds and returns the card or while the client interprets that response.

- `src/features/gpt-commerce/hooks/useAgentMessages.ts:673` and `:748` — `data?.content || 'متأسفانه مشکلی پیش اومد...'`.
- The main client renders a clarification only when the returned card still has `options` or `steps`; otherwise it falls through to line 673 and converts the intentionally empty clarification text into the generic error.
- The function deliberately returns `content: ""` for `ask_clarification`. Therefore a valid AI tool call can still produce the reported message if grounding returns a malformed/empty card or the response shape is lost before the clarification branch.

Three ways the text ends up empty today:

1. The final answer is cleaned twice — internal signal lines and id removal (`sanitizeVisibleText`), then removal of any sentence that talks about counts/totals (`stripCountTalk`). When the model's reply was short and count-flavoured («از بین ۱۲ کاندیدا این ۶ مدل رو انتخاب کردم»), the cleaning can wipe the whole reply, leaving nothing to show even though products were found.
2. Question-card turns are intentionally sent with empty text plus a card. The latest AI output proves its original card was valid; the remaining failure boundary is catalog grounding / response serialization / client card validation after the tool call.
3. The reply may consist only of machine lines (e.g. only `SELECTED_IDS:[...]`), which sanitising removes entirely.

## The fix

Server side (`supabase/functions/gpt-commerce-agent/index.ts`):

- Validate the **final grounded card**, not only the original tool arguments. A card is valid only when a single question has usable options, or every retained step has a question and usable options.
- If grounding empties or damages the card, rebuild it from database-grounded default steps and validate again. If no valid card can be built, return a visible guidance response rather than `content: ""`.
- Return an explicit response discriminator such as `response_type: "clarification" | "products" | "message" | "cart"`, so the client does not infer the response type from whether text happens to be empty.
- After cleaning, if the visible text is empty but products were selected, send a short natural lead-in instead of nothing (e.g. «این گزینه‌ها به درخواستت می‌خوره:»); if there are no products either, send a helpful line that asks a concrete follow-up rather than a dead end.
- Make the count-stripping non-destructive: only drop a sentence when something readable remains on that line; never let it empty the whole answer.
- Log only safe structural diagnostics for clarification responses: response type, original step count, grounded step count, and option counts. This will expose future card-shape failures without logging customer text.

Client side (both chat surfaces):

- Route by the explicit response discriminator and render a validated clarification card even though its text is intentionally empty.
- Treat "empty text + no valid card + no products + no cart action" as an invalid server response. Do **not** silently repeat the AI request (which can duplicate latency and credit use); show a specific recoverable message and preserve the user's turn for a manual retry.
- Distinguish the three cases in the bubble text: slow answer, connection problem, nothing found.

## Verification

Replay the exact confirmed request, «برای کارهای روزمره چه لپتاپی باید بگیرم», and assert that the HTTP response is `response_type: "clarification"` with non-empty grounded steps before checking the UI. Then verify the tappable card appears on desktop and mobile without a generic error bubble. Also replay a product search whose answer is mostly a count sentence, guidance on a category with very few in-stock items, and a plain conversational question; every response must resolve to exactly one valid response type and never blank content without a valid structured payload.
