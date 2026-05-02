
# Mobile /m/gptcommerce — Polish Pass (assets ready)

All three uploaded assets are now in place:
- `src/assets/flowcart-logotype.svg` (new logotype wordmark)
- `src/assets/mobile-slide-drnext.jpg` (new drnext slide — replaces existing)
- `src/assets/mobile-slide-itick.jpg` (new itick slide — replaces existing)

Front-end only. No backend, no schema, no edge functions.

---

## 1. ChatProductCard — bottom-section layout
File: `src/components/gpt-commerce/ChatProductCard.tsx`

- Vertically center the action footer (save / add / details) by giving it a fixed `min-h-[48px]` with `items-center`.
- Add breathing room between price row and the action footer (`mt-3` on price wrap, footer `pt-3` stays, divider stays).

## 2. Universal product image placeholder
File: `src/components/gpt-commerce/ProductImage.tsx` is already the universal solution. Migrate the one remaining raw `<img>` for products on mobile:

- `src/features/gpt-commerce/mobile/MobileChatLanding.tsx` — Hot Deals tile image (line ~390) → use `<ProductImage>`. This fixes the missing placeholder in the landing carousel.

Hero slider images stay as raw `<img>` (brand creative, not products).

## 3. Slider photos — replace
The two slide assets are already overwritten on disk. The existing imports in `MobileChatLanding.tsx` (`slideDrnext`, `slideItick`) will pick up the new files automatically. Also: change the hero slide image rendering from `object-contain` to `object-cover` so the new photos fill the frame edge-to-edge without letterboxing.

## 4. Flowcart logotype — landing footer + chat header
- **Landing footer** (`MobileChatLanding.tsx`, brand block ~lines 447–458): keep gradient mark tile, replace the «فلوکارت» text + subtitle pair with the new logotype SVG (`height: 18px`, auto width). Subtitle stays beneath as before.
- **Chat header** (`MobileGPTCommerceShell.tsx`, lines ~369–382): remove the `Zap` placeholder + literal "Flowcart" text. Render: gradient mark tile (with the existing flowcart-logo.svg mark inside) on the right, and the **logotype SVG on the left** of the mark — DOM order in RTL puts mark first → it appears right, logotype second → appears left. Logotype height ~16px.

## 5. Chat-mode chatbox — match landing transparency
`MobileChatThread.tsx`:
- Convert the bottom input bar from in-flow flex child to absolutely positioned (`absolute inset-x-0 bottom-0 z-30`), keeping the same gradient backdrop as landing (`linear-gradient(180deg, hsl(0 0% 100% / 0), hsl(0 0% 100% / 0.95) 30%)`).
- Add bottom padding to the messages scroll container (`pb-44`) so the last message clears the floating bar.
- The bento decorations behind the chat now show through behind the chatbox, identical to landing.

## 6. Textarea vertical centering — both chatboxes
Both files (`MobileChatLanding.tsx` ~521–536, `MobileChatThread.tsx` ~368–384):
- Set textarea `padding-block: 11px` (so 11 + 22 line-height + 11 = 44px), remove `min-h-[44px]` from the textarea itself (keep on the wrapper), drop the unreliable `self-center` class.
- Mirror the same padding on the placeholder overlay so both align identically.

## 7. New: creative prompt tips & tricks component
Create `src/features/gpt-commerce/mobile/MobilePromptTipsCard.tsx`:

```text
هوشمندانه‌تر بپرس
┌─ horizontal snap carousel (210px tiles) ────────┐
│ [icon] کشف هوشمند        [icon] مقایسه           │
│ ╭───── chat snippet ─╮   ╭───── chat snippet ─╮ │
│ │ بهترین هدفون...     │   │ گلکسی S۲۴ یا...    │ │
│ ╰────────────────────╯   ╰────────────────────╯ │
└──────────────────────────────────────────────────┘
```

Tile:
- 210px wide, `min-h-[140px]`, `rounded-2xl`, soft per-category gradient bg, 1px primary-tinted stroke, blurred decorative blob in corner.
- Top: 28px gradient icon-tile (Lucide: `Sparkles` / `Scale` / `Wallet` / `Wand2` / `Gift`) + Persian title.
- Bottom: chat-bubble snippet of the example prompt with `MessageCircle` glyph.
- Tap → `onSendMessage(example, true)`.

Tips:
1. کشف هوشمند — «بهترین هدفون نویزکنسلینگ زیر ۵ میلیون»
2. مقایسه هوشمند — «گلکسی S۲۴ بهتره یا آیفون ۱۵؟»
3. بودجه‌محور — «یه هدیه شیک تا ۲ میلیون پیشنهاد بده»
4. خرید خودکار — «خودت برام انتخاب کن و سبد رو بچین»
5. پرسش از محصول — «این لپ‌تاپ برای برنامه‌نویسی خوبه؟»

Mount it in `MobileChatLanding.tsx` directly after the Hot Deals carousel and before the `<footer>`.

---

## Files modified / created

- `src/components/gpt-commerce/ChatProductCard.tsx`
- `src/features/gpt-commerce/mobile/MobileChatLanding.tsx`
- `src/features/gpt-commerce/mobile/MobileChatThread.tsx`
- `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx`
- `src/features/gpt-commerce/mobile/MobilePromptTipsCard.tsx` — **new**

Assets already copied:
- `src/assets/flowcart-logotype.svg`, `src/assets/mobile-slide-drnext.jpg`, `src/assets/mobile-slide-itick.jpg`

No backend changes. Scope strictly `/m/gptcommerce`.
