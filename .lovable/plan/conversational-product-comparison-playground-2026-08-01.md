# Conversational Product Comparison (Playground)

A layered comparison component for the playground chat: conclusion first, evidence on demand, up to 3 products, and graceful behavior when the AI-triggered comparison is imperfect (mixed categories, external products, missing data).

## What the component shows (in order)

1. **Header** — 2 or 3 product chips (thumb + short name + price), an `خارجی` badge for products we don't sell, and a scope line ("مقایسه بر اساس گفتگوی تو").
2. **AI Verdict** — one-sentence recommendation, winner name, and a confidence indicator (بالا / متوسط / پایین) with a short "why this confidence" note.
3. **Top 3 Differences** — the three decision-driving factors, each with a per-product winner mark.
4. **Comparison Radar** — parallel score bars per dimension (عملکرد، باتری، راحتی، ارزش قیمت، پشتیبانی) shown side by side per product; on mobile the bars stack per dimension so products stay visually compared.
5. **Feature Comparison** — collapsed by default: "نمایش همه ۱۸ مشخصه" expands the full attribute list with winner highlighting and `—` for unknown values.
6. **Use-case Recommendations (never end with a table)** — always the final block: "اگر A را بخر که: ✓ … / اگر B را بخر که: ✓ …" per product, 2-4 bullets each.
7. **Reasons to Switch** — only when one column is the user's current selection/cart item: ✔ gains and ✖ costs versus that item.
8. **Context-aware CTA row**
   - internal vs internal: افزودن برنده به سبد / دیدن هر دو / مقایسه با مورد دیگر
   - internal vs external: مشابه‌های ما / بهترین جایگزین ما / افزودن پیشنهاد ما

## Smart comparison chips

Under every product card in chat (playground card only): `مقایسه`، `در برابر مشابه`، `در برابر ارزان‌تر`، `در برابر پرمیوم`، `در برابر پرفروش`. Tapping a chip immediately emits a comparison message built from the mock catalog (cheaper = best cheaper item in same category, etc.). Chips that have no candidate are hidden rather than disabled-looking.

## Conversational error / edge states

Because comparisons come from chat rather than manual picking, the component renders explicit states instead of a broken table:

- **Mixed categories** — banner "این دو در یک دسته نیستند"; the component switches to *use-case framing only*: no winner, no radar, verdict replaced by "برای چه کاری می‌خواهی؟" plus two quick replies to pick an intent. Shared dimensions only (price/rating) stay in the table.
- **Only one product resolved** — no comparison; a short note plus suggested second candidates as chips.
- **More than 3 mentioned** — compares the top 3 and shows "۲ مورد دیگر حذف شد" with a chip to swap a column.
- **Duplicate / same product mentioned twice** — dedupe and ask for a second product.
- **External / unknown product** — column marked `خارجی`, values marked "بر اساس داده عمومی، تأییدنشده", confidence forced to متوسط/پایین, CTA switches to alternatives.
- **Missing specs** — `—` cells, excluded from winner calculation, and a footnote "۳ مشخصه برای مقایسه کافی نبود".
- **Out of stock column** — ناموجود tag; verdict prefers an in-stock winner and says so.
- **Price-incomparable** (no price for external) — value dimension omitted rather than guessed.
- **Low confidence overall** — verdict block turns into "مطمئن نیستم" with a clarifying question and quick replies.

## Technical section

New files under `src/features/playground/`:

- `data/mockComparison.ts` — types (`PgComparison`, `PgCompareColumn`, `PgCompareRow`, `PgCompareIssue`, `PgVerdict`, `PgUseCase`, radar dimension scores) plus pure builders: `buildComparison(products, opts)`, `resolveChipTarget(product, kind)`, winner/score helpers, and one external-product fixture. No network, no AI.
- `components/PgComparison.tsx` — the layered component: header, verdict, top-3 differences, radar bars, expandable spec table, use-case block, switch block, CTA row, plus the issue banners for each edge state above.

Edits:

- `data/mockJourney.ts` — add `comparison?: PgComparison` to `PgMessage`; keyword responder handles «مقایسه»، «بهتره»، «کدوم رو بگیرم»، «در برابر» and returns comparison messages, including a mixed-category demo phrase.
- `hooks/usePlaygroundChat.ts` — `showComparison(kind)` and `compareFromChip(product, kind)` actions; CTAs reuse existing `addToCart` / `send`.
- `components/PgChatThread.tsx` — render `m.comparison`.
- `components/PgProductCard.tsx` — comparison chips row under the card actions.
- `components/PgDevDrawer.tsx` — lab triggers: ۲ ستونه، ۳ ستونه، داخلی/خارجی، دسته‌های ناهمگون، داده ناقص، اعتماد پایین.

Styling stays on existing semantic tokens and playground CSS; RTL via `dir` inheritance, Persian digits through `toFa`/`faPrice`. Front-end only, playground-scoped, no core-product files touched.
