# Mobile Landing Redesign + Placeholder Fixes

Frontend-only. No backend/edge function changes.

## Scope summary
| # | Change | Scope |
|---|---|---|
| 1 | Placeholder text can wrap (no truncate) so long Persian phrases fit | `/m/gptcommerce` + `/gptcommerce` chat input |
| 2 | Add rotating placeholder to desktop chat-mode input | `/gptcommerce` |
| 3 | Remove `برگشت` button from header | `/m/gptcommerce` |
| 4 | Move prompt chips ABOVE chatbox in landing, cap to max 3 rows | `/m/gptcommerce` |
| 5 | Add a hero promo slider above chips, below logo/title | `/m/gptcommerce` |
| 6 | Delete the "فلوپی" loan pill | `/m/gptcommerce` |
| 7 | Logo + subtitle slightly larger | `/m/gptcommerce` landing |
| 8 | Delete logo block from landing (keep only header logo) | `/m/gptcommerce` |
| 9 | Remove rotating placeholder from chatbox in chat-mode (keep only landing) | `/m/gptcommerce` |

## File changes

### `src/features/gpt-commerce/mobile/MobileChatLanding.tsx` (the big one)

Restructure to this vertical order:
1. ~~Logo + greeting block~~ — **DELETE** (per item 8). Replace with just the personalized greeting line if authenticated (`سلام {name} جان 👋`), or nothing.
2. **NEW: Hero slider** — horizontal swipeable carousel of 3–4 promo cards (e.g. "وام فلوپی تا ۱۰۰ میلیون", "پیشنهادهای داغ امروز", "ارسال رایگان"). Native scroll-snap, dots underneath. Compact (~120px tall).
3. **Prompt chips** — moved here, directly above the chatbox. Cap rendered chips so they fit in **max 3 rows**: keep current `flex-wrap` but slice the array to first ~6 chips so layout never exceeds 3 rows on a 360–430px viewport.
4. **Chatbox** — keep card style, keep rotating placeholder (this is the only place it should remain).
5. ~~فلوپی loan pill~~ — **DELETE** (item 6).

Layout switches from "scroll → fixed bottom input" to a single scroll column with the input still sticky at bottom.

### `src/features/gpt-commerce/mobile/MobileChatThread.tsx`

- Remove the `placeholderTexts` array, `placeholderIndex` state, the rotating `useEffect`, and the absolute-positioned rotating `<span>`.
- Replace with a single static placeholder via the textarea's native `placeholder` attribute, e.g. `چی می‌خوای بخری؟`.

### `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx`

- Delete the `برگشت` button (lines ~323–331) and its `ArrowRight` import if unused.

### `src/components/gpt-commerce/ChatThread.tsx` (desktop chat mode)

- Add rotating placeholder identical to landing's: `placeholderTexts` array, `placeholderIndex` state, 3.5s interval, absolute-positioned `<span>` overlay shown only when `!inputValue`. Remove the static `placeholder=""` attr from the textarea.

### Placeholder wrapping fix (items 1–2)

Currently the rotating placeholder `<span>` uses `truncate` (or `overflow-hidden` + single line) which clips long Persian phrases. Fix in **both** places:
- `src/features/gpt-commerce/mobile/MobileChatLanding.tsx`
- `src/features/gpt-commerce/mobile/MobileChatThread.tsx` (becomes moot after removal)
- `src/components/gpt-commerce/ChatThread.tsx` (after adding the rotating placeholder)

Change the overlay container from `items-center ... overflow-hidden` + `<span class="truncate">` to `items-start` (top-aligned) with `<span class="text-right w-full whitespace-normal break-words leading-snug">` so multi-line placeholders render fully. Also raise the textarea's `min-h` slightly (e.g. 44 → 56px) so 2-line placeholders don't visually overflow the input box.

## Hero slider — technical notes

Implement inline (no new component file) using native CSS scroll-snap to keep it lightweight:

```tsx
<div className="overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-5 px-5">
  <div className="flex gap-3">
    {slides.map(s => (
      <div key={s.id} className="snap-center shrink-0 w-[85%] rounded-2xl p-4 ...">
        ...
      </div>
    ))}
  </div>
</div>
```

Slides content (Persian, brand-aligned):
1. 💸 وام فلوپی — تا ۱۰۰ میلیون اعتبار خرید
2. 🔥 پیشنهادهای داغ امروز — تا ۴۰٪ تخفیف
3. 🚚 ارسال رایگان برای سفارش بالای ۲ میلیون

Tap on a slide does nothing for now (or focuses chatbox) — purely visual marketing.

## Out of scope
- No backend changes
- No new files (slider is inline)
- No changes to desktop landing (`ChatLanding.tsx`)
