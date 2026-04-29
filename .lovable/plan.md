
# /m/gptcommerce UI Refinements (frontend only)

Scope: only files under `src/features/gpt-commerce/mobile/*` plus narrow, mobile-scoped CSS overrides. No backend, no shared-component prop signature changes that would affect desktop behavior.

## Files to edit

1. `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx`
2. `src/features/gpt-commerce/mobile/MobileChatLanding.tsx`
3. `src/features/gpt-commerce/mobile/MobileChatThread.tsx`

No edits to `PDPProductComponent.tsx`, `CategorySelector.tsx`, `ChatProductCard.tsx`, or `ProductImage.tsx` source — instead we wrap their mobile usages and use scoped CSS overrides (className wrappers) so desktop stays untouched.

---

## 1. PDP (Product Details) is not mobile-friendly

`PDPProductComponent` (used inline in chat via `msg.inlineProduct`) currently renders `flex gap-6` with a fixed `w-56` image — on a 484px viewport this overflows and clips info / actions.

Fix in `MobileChatThread.tsx` only — wrap the inline PDP in a `mobile-pdp` container and inject scoped CSS:

- Force the inner layout `.mobile-pdp .flex.gap-6` → `flex-direction: column; gap: 1rem;`
- Image column `.mobile-pdp .w-56` → `width: 100%;` with `max-width: 280px; margin-inline: auto;`
- Reduce inner padding `.mobile-pdp .p-4` → `padding: 0.875rem`
- Sections (`.rounded-xl` cards) get full width and the spec-row label width changes from `w-28` to wrap (`min-width: 6rem; flex-shrink:0`)
- Action button row stays full width
- Lightbox + suppliers + comments + specs: keep all functions; only layout changes via CSS
- Remove the `mr-9` indent on mobile (`.mobile-pdp` parent → `margin-inline-start: 0`)

All existing handlers (`onAddToCart`, image gallery, suppliers, expand/collapse) remain untouched.

## 2. New-chat icon frame to match category chip exactly

In `MobileGPTCommerceShell.tsx` header: the new-chat button is currently `border: 1px solid hsl(0 0% 0% / 0.12)` with `rounded-xl`. CategorySelector trigger (after our mobile shrink CSS) uses `rounded-[0.625rem]`, `padding 0.4rem 0.7rem`, `border 1px hsl(0 0% 0% / 0.12)`, `background hsl(0 0% 100%)`, no shadow.

Replace the new-chat button styles with the exact same: same border color, same `rounded-[0.625rem]`, same vertical padding (`0.4rem 0.5rem` to keep it square-ish), same hover/active (`hover:scale-105 active:scale-95`), same background, no shadow. Icon size matched to the chip's icon (`w-[14px] h-[14px]`-ish via `0.85rem`).

## 3. Category chip dropdown ~40% smaller and more compact

Already shrunk via `.mobile-cat-selector` CSS. Tighten further:
- `padding: 0.3rem 0.55rem` (was 0.4rem 0.7rem) → ~−25% more
- `font-size: 0.7rem` (was 0.75rem)
- `gap: 0.35rem` between icon/label/chevron
- `border-radius: 0.55rem`
- Icons: `width/height 0.7rem` (was 0.85rem)
- Dropdown content: add scoped CSS for `.mobile-cat-selector + [role=menu]` won't work; instead wrap CategorySelector in a portal-aware className isn't trivial. Simpler: shrink only the trigger (visible) and leave the open menu as-is, since the menu items remain readable.

Net visual reduction on the trigger ≈ 40%.

## 4. Action-bar icons +12.5%, +22.5% spacing

Currently `w-[23px] h-[23px]` and `gap-9` (2.25rem). Update in both `MobileChatLanding.tsx` and `MobileChatThread.tsx`:
- Icon size: 23 × 1.125 ≈ `26px`
- Gap: 2.25rem × 1.225 ≈ `2.75rem` (use `gap-[2.75rem]`)

## 5. Chat-mode chatbox === landing chatbox + placeholder

In `MobileChatThread.tsx` rewrite the bottom input wrapper to match landing exactly:

- Same `min-h-[56px]` (was 44px), same `max-h-[120px]`, same `py-2.5 px-2`, same parent `flex items-center gap-2 p-2 rounded-2xl` (was `items-end`)
- Same auto-resize hook (initialize at `56px`)
- Same Mic + Submit button sizes (`w-9 h-9 rounded-full`)
- Add textarea `placeholder=""` and a positioned overlay span (same pattern as landing) showing `از فلوکارت بخوا` with the exact same classes used for landing's rotating placeholder:
  `text-muted-foreground/50 text-sm text-right w-full whitespace-normal break-words leading-snug`
  Static (no rotation) — only shown when `inputValue` is empty.
- Sticky positioning of the bottom bar in chat mode is already inside a flex column above messages; keep current layout but ensure outer paddings match landing (`px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]`) — already does.

## 6. Prompt-chips title +17.5%

In `MobileChatLanding.tsx`, the "از این‌ها شروع کن" line is `text-xs` (0.75rem). 0.75 × 1.175 ≈ `0.88rem` → use inline `style={{ fontSize: '0.88rem' }}` on that paragraph. Sparkles icon scaled proportionally to `w-4 h-4`.

## 7. Landing inline logo +17.5%

`flowcartLogo` `<img>` is `w-14 h-14` (3.5rem). 3.5 × 1.175 ≈ `4.1rem` → `style={{ width: '4.1rem', height: '4.1rem' }}`, replacing `w-14 h-14`.

## 8. Landing slider +20%

Slides currently `w-[92%]` with aspect `1920/1080`. Width is already constrained by viewport, so "20% larger" means height. Increase visual size by:
- Slide width → `w-[96%]` (small bump so adjacent peek shrinks)
- Wrap track in a container with `style={{ ['--hero-scale' as any]: 1.2 }}` and apply `aspectRatio: '1920 / 1296'` (1080 × 1.2) to each slide so slide height grows ~20% while width stays bounded by viewport.
- Bump `paddingInlineStart` / vertical container padding (`pt-2 pb-5` → `pt-3 pb-6`) so the larger slide isn't cropped.

## 9. Last slide: zero space on left side, mirror right spacing

In `MobileChatLanding.tsx` the flex track currently uses `paddingInlineStart: 1.25rem; paddingInlineEnd: 2rem`. In RTL the *last* visible slide (left side after swiping) is the final flex child. Change to symmetric:
`paddingInlineStart: 1.25rem; paddingInlineEnd: 1.25rem`
and keep slide width at `w-[96%]` so it terminates with mirrored spacing on the left.

## 10. Swap chat bubble alignment (user ↔ assistant)

In `MobileChatThread.tsx` message row:
- User messages should appear on the **right** (RTL conventional "from me"), assistant on the **left**.
- Current code uses `flex-row-reverse` for user, normal for assistant — given `dir="rtl"`, that puts user on the LEFT visually. Invert:
  - `msg.role === "user"` → `flex flex-row` (no reverse) and `justify-end`
  - `msg.role === "assistant"` → `flex flex-row-reverse` and `justify-end`
- Bubble corners stay the same (already asymmetric).
- Avatar (Zap) stays adjacent to assistant bubble, on the visual left side after reversal.
- Loading bubble already mimics assistant — update it identically (`flex-row-reverse justify-end`).

## 11. Remove 2-letter placeholder label from product images on mobile

`ProductImage` renders a small uppercase `<span>` (first 2 chars of alt) inside the fallback. Without changing the shared component:

- In `MobileChatThread.tsx` and `MobileChatLanding.tsx`, wrap product surfaces in a class `mobile-no-img-label` and inject scoped CSS:
  `.mobile-no-img-label [role="img"] > span { display: none !important; }`

This hides the label only on mobile (the wrapper class is only added in mobile files).

## 12. Mobile carousels: −50% gap between cards, hide scrollbar

`MobileChatThread.tsx` carousel uses `flex gap-3` (0.75rem) → change to `gap-[0.375rem]` (−50%).
Track already has `scrollbar-none` class. Add scoped CSS to be safe across browsers:
```text
.mobile-no-img-label .scrollbar-none::-webkit-scrollbar { display: none; }
.mobile-no-img-label .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
```

---

## Acceptance check

- PDP fully readable on 360–484px; image stacks above details; all sections expand/collapse; lightbox works.
- New-chat button is visually identical (border, radius, padding, bg, no shadow) to the category chip trigger.
- Category trigger ~40% smaller; dropdown still functional.
- Action-bar icons larger and more spaced on both landing and chat mode.
- Chat-mode chatbox visually identical to landing chatbox; shows "از فلوکارت بخوا" placeholder.
- "از این‌ها شروع کن" larger; logo larger; slider larger.
- Last slide ends flush with right-symmetric left spacing.
- User chat bubbles render on the right; assistant on the left.
- No 2-letter labels visible on product placeholders inside /m/gptcommerce.
- Carousel cards tighter; no scrollbar visible.
- All existing handlers unchanged — no backend touched.
