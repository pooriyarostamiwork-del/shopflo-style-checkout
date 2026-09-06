# Fix the repeated «متأسفانه مشکلی پیش اومد» reply (/gptcommerce, /m/gptcommerce)

## What is actually happening

That sentence is not an error from the server and not a timeout. It is a placeholder the chat shows whenever the assistant's answer comes back **with empty text**. Confirmed in the code:

- `src/features/gpt-commerce/hooks/useAgentMessages.ts:673` and `:748` — `data?.content || 'متأسفانه مشکلی پیش اومد...'`.
- A real failure or a slow answer shows a different sentence («پاسخ‌گویی بیشتر از حد معمول طول کشید…»), and the recent function logs contain no errors — so the message the user sees comes from the empty-text path.

Three ways the text ends up empty today:

1. The final answer is cleaned twice — internal signal lines and id removal (`sanitizeVisibleText`), then removal of any sentence that talks about counts/totals (`stripCountTalk`). When the model's reply was short and count-flavoured («از بین ۱۲ کاندیدا این ۶ مدل رو انتخاب کردم»), the cleaning can wipe the whole reply, leaving nothing to show even though products were found.
2. Question-card turns are intentionally sent with empty text plus a card. If the card ends up with no usable steps (all option lists dropped by the catalog grounding), the app finds no card, falls into the normal branch and shows the placeholder.
3. The reply may consist only of machine lines (e.g. only `SELECTED_IDS:[...]`), which sanitising removes entirely.

## The fix

Server side (`supabase/functions/gpt-commerce-agent/index.ts`):

- After cleaning, if the visible text is empty but products were selected, send a short natural lead-in instead of nothing (e.g. «این گزینه‌ها به درخواستت می‌خوره:»); if there are no products either, send a helpful line that asks a concrete follow-up rather than a dead end.
- Make the count-stripping non-destructive: only drop a sentence when something readable remains on that line; never let it empty the whole answer.
- Never emit a question card that has no steps/options — if grounding removes everything, fall back to the built-in usage/priority questions, and if even those are unavailable, return a normal text answer.

Client side (both chat surfaces):

- Treat "empty text + no card + no cart action" as a state that retries once silently, and only then shows a human message that says what to do next, worded as guidance rather than a generic failure.
- Distinguish the three cases in the bubble text: slow answer, connection problem, nothing found.

## Verification

Replay the turns that produce it: a product search whose answer is mostly a count sentence, a guidance turn on a category with very few in-stock items, and a plain conversational question. Each must end with visible text (and cards where products exist), on desktop and mobile.
