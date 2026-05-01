
# Mobile /m/gptcommerce — Round of Refinements

Frontend-only. No backend/edge-function/SQL changes. Scope per item is annotated.

---

## 1. In-chat components — alignment to new bubble side
Scope: `/m/gptcommerce` only.

Now that **assistant bubbles render on the LEFT** and **user bubbles on the RIGHT**, every assistant-attached interactive component (which currently has `mr-9` = right margin) is misaligned. They should hug the **left edge** under the avatar.

In `MobileChatThread.tsx`, replace `mr-9` with `ml-9 mr-0` (or simply `ml-9`) on the wrappers for these per-component blocks:

| Component | File | Mobile wrapper change |
|---|---|---|
| `AddressShippingSelector` | wrapper in MobileChatThread | `mr-9` → `ml-9` |
| `AddressSelector` | wrapper | `mr-9` → `ml-9` |
| `AddressConfirmation` (legacy) | wrapper | `mr-9` → `ml-9` |
| `PaymentSelector` | wrapper | `mr-9` → `ml-9` |
| `CartSummaryCard` (Order Summary) | wrapper | `mr-9` → `ml-9` |
| `QuickReplyButtons` | wrapper | `mr-9` → `ml-9` + add `justify-start` to inner flex via wrapper class |
| `CTAButton` | wrapper | `mr-9` → `ml-9` |
| Product cards row (chat carousel) | already uses `-mx-3 px-3`, but inner `pr-9` | swap `pr-9` → `pl-9` so the leading offset sits on the left under avatar |
| `PDPProductComponent` (`mobile-pdp`) | full-width — leave as is |

Internal layout of the cards themselves (PaymentSelector rows, address rows etc.) stays RTL via `dir="rtl"` from the parent — only the **outer offset** moves from right to left to sit under the assistant avatar.

No props or component internals changed.

---

## 2. Chat mode background — match landing gradient
Scope: `/m/gptcommerce` only.

`MobileChatThread.tsx` root currently uses `bg-gradient-to-b from-background via-background to-primary/5`.
Landing uses `bg-gradient-to-br from-background via-background to-primary/5` plus the floating bento background cards behind content.

Change:
- Update the chat root to **exact same gradient direction** as landing: `bg-gradient-to-br from-background via-background to-primary/5`.
- Add the same low-opacity floating bento decorations (`absolute pointer-events-none` layer with the four soft cards from `MobileChatLanding`) behind the messages, with `z-0`; messages get `relative z-10`. Opacity stays at the existing `0.29` so it reads as subtle texture.

---

## 3. Supplier icon + rating icon unification
Scope: **both** `/m/gptcommerce` and `/gptcommerce`.

Goal: drop emoji per merchant and the ⭐ for ratings; use one universal lucide icon for **supplier** and one elegant lucide icon for **rating**.

- Supplier icon: `Store` (lucide) — small, neutral, color `text-muted-foreground`.
- Rating icon: `Star` (lucide) with `fill-current text-amber-400` and `w-3 h-3` — keeps the "rating" semantic but elegant + consistent.

Replace in each location, and **remove `{product.merchant.logo}`** rendering everywhere it's used purely as a leading emoji (keep merchant.name text):

- `src/components/gpt-commerce/ChatProductCard.tsx` (lines 99, 101)
- `src/components/gpt-commerce/ProductCard.tsx` (lines 65, 67)
- `src/components/gpt-commerce/ProductCarousels.tsx` (lines 245, 247)
- `src/components/gpt-commerce/PDPProductComponent.tsx` (line 227 — supplier only)
- `src/components/gpt-commerce/ProductQuickViewModal.tsx` (line 179 — supplier only)
- `src/components/gpt-commerce/AgenticMessageComponents.tsx` line 157 (vendor header in CartSummaryCard) — replace `{vendor.merchant.logo}` with `<Store className="w-4 h-4 text-muted-foreground" />`
- `src/components/gpt-commerce/RightPanel.tsx` line 348 — same
- `src/features/gpt-commerce/mobile/MobileBottomSheet.tsx` line 181 — same
- `src/components/gpt-commerce/AddressShippingSelector.tsx` line 320 — same
- `src/components/gpt-commerce/AccountPanel.tsx` line 127 — same

Pattern (rating + supplier together):
```tsx
<div className="flex items-center gap-1 mt-2">
  <Star className="w-3 h-3 fill-current text-amber-400" />
  <span className="text-xs text-muted-foreground">{toPersianNumber(product.rating)}</span>
  <span className="mx-1 text-xs text-muted-foreground/60">|</span>
  <Store className="w-3 h-3 text-muted-foreground" />
  <span className="text-xs text-muted-foreground">{product.merchant.name}</span>
</div>
```

`merchant.logo` field stays in the data (no backend touch); we just stop rendering it.

---

## 4. Mobile chatbox input typography
Scope: `/m/gptcommerce` only.

Current: textarea uses `text-base` (16px) + lineHeight 1.5, and is too tall (`min-h-[56px]`) which causes the cursor/text to sit toward the top.

Changes (both `MobileChatLanding.tsx` and `MobileChatThread.tsx` textarea):
- Class swap: `text-base` → `text-[15px] font-normal`.
- `min-h-[56px]` → `min-h-[44px]`; auto-resize floor changes from 56 → 44 (script `style.height = "44px"`).
- Padding: `py-2.5 px-2` → `py-0 px-2` and let flex-center handle vertical alignment by wrapping the textarea container with `flex items-center min-h-[44px]`.
- Placeholder span: keep `text-sm` (14px), `text-muted-foreground/50`, vertically centered (already `items-center`).
- Letter-spacing: `-0.005em` for a calmer feel.

This makes the typed text the same weight/size as the placeholder and visually centered.

---

## 5. Landing product carousel — full redesign (no buttons, click-to-chat)
Scope: `/m/gptcommerce` only.

Replace the current "داغ‌ترین تخفیف‌ها" block in `MobileChatLanding.tsx` that uses `ChatProductCard`. New design rules:

- **No buttons inside the card.** Whole card is a single `<button>` that, on click, calls `submit(\`درباره ${p.name} بیشتر بگو\`)` — drops the user into chat mode where the inline PDP is shown.
- Visual style **matches the design system** (white surface, 1px stroke `hsl(0 0% 0% / 0.08)`, 16px radius, no shadow — per memory).
- Card spec (mobile carousel-only variant, internal to landing — does **not** replace canonical `ChatProductCard`):
  - Width 168px, height auto.
  - Square image (`aspect-square`, `object-cover`) using `getChatProductImage()` (single source of truth, per memory).
  - Top-left discount chip (red, same gradient as ChatProductCard) when `originalPrice` exists.
  - Below image: `p-3` block with
    - product name `text-[13px] line-clamp-2 leading-snug min-h-[2.6em]`
    - rating row: `Star` + Persian number + `Store` + merchant.name (the unified row from #3)
    - price: bold current price + smaller strikethrough original.
- Carousel: horizontal, `snap-x snap-proximity`, `gap-2.5`, edge padding `1.25rem`, scrollbar hidden (already supported via `scrollbar-none`).
- Section header: keep current pattern (`Sparkles` + "داغ‌ترین تخفیف‌ها" at `0.88rem`) so it matches prompt-chips title style (already consistent with #4 of last round).
- Loading skeletons: smaller dimensions to match the new card.

Behavior contract:
- Click card → `onSendMessage(\`درباره ${p.name} بیشتر بگو\`, true)` (forces a new basket like prompt chips do).
- No add-to-cart, no save, no compare, no info button rendered on landing.
- `ChatProductCard` (canonical, with buttons) is unchanged and continues to be used inside chat threads.

---

## 6. Chat product card — wider to absorb long prices
Scope: **both** `/m/gptcommerce` and `/gptcommerce`.

`ChatProductCard` is fixed at `w-[220px]` (per memory: 220×420). Long Persian prices like `۱۲٬۸۵۰٬۰۰۰ تومان` plus the strikethrough original wrap awkwardly and break the bottom action row alignment.

Change:
- Update the canonical card width: `w-[220px]` → `w-[240px]` (≈ +9%) and keep height `h-[420px]`.
- Update memory-pinned spec note locally (no memory edit required for the size bump since the rule was "uniform"; new uniform = 240×420).
- Update the matching desktop wrapper widths inside `ChatProductCarousels` only if a hard width is set (verify — most consumers use the card's internal width).
- Mobile chat thread already uses `w-[260px]` wrappers — change to fit-content (`w-auto`) so wrapper hugs the new 240px canonical card (avoids double sizing).
- Inside the card price row: add `flex-wrap items-baseline` and let `originalPrice` drop to a second line gracefully if prices are extreme; bottom action row stays pinned via existing `mt-auto`.

Outcome: long prices fit on one line in 95% of cases; layout integrity preserved.

---

## 7. Mobile landing footer
Scope: `/m/gptcommerce` only.

Add a new compact, elegant footer rendered at the bottom of `MobileChatLanding` content (above the existing `pb-56` reserved space for the sticky input). Sits **inside** the scrollable area, after the Hot Deals carousel.

Design (matches calm/minimal system, 1px strokes only — no shadows):

```
─────────────────────────────────────────
[ Flowcart logo · 22px ]   فلوکارت
دستیار خرید هوشمند

[درباره ما]  [پشتیبانی]  [حریم خصوصی]   ← 3 small ghost links

[Instagram] [Twitter] [Linkedin]          ← 32px circle icons, muted

تمامی حقوق محفوظ است · ۱۴۰۴
ساخته‌شده با ❤︎ در ایران
─────────────────────────────────────────
```

Implementation notes:
- New inline subcomponent inside `MobileChatLanding.tsx` (`<MobileLandingFooter />`) — keeps file boundary tight.
- Container: `mt-10 px-5 py-6 border-t` with `borderColor: 'hsl(0 0% 0% / 0.06)'`, no background fill (lets the gradient show through).
- Logo: SVG from `@/assets/flowcart-logo.svg` in a 36px primary-tinted rounded-xl tile (mirrors header styling for brand consistency).
- Links: `<button>`s with no-op handlers (demo scope per memory), `text-xs text-muted-foreground` and 1px outlined chips matching prompt chip stroke.
- Social icons: `Instagram`, `Twitter`, `Linkedin` (lucide), 32px circles with 1px stroke, hover/active scale only.
- Copyright: `text-[11px] text-muted-foreground/70`, centered, Persian digits via `toPersianNumber(1404)`.
- Keep RTL layout via `dir="rtl"` inheritance (per memory rule — no `flex-row-reverse`).

---

## Files to be modified

- `src/features/gpt-commerce/mobile/MobileChatThread.tsx` — items 1, 2, 4
- `src/features/gpt-commerce/mobile/MobileChatLanding.tsx` — items 4, 5, 7
- `src/components/gpt-commerce/ChatProductCard.tsx` — items 3, 6
- `src/components/gpt-commerce/ProductCard.tsx` — item 3
- `src/components/gpt-commerce/ProductCarousels.tsx` — item 3
- `src/components/gpt-commerce/PDPProductComponent.tsx` — item 3
- `src/components/gpt-commerce/ProductQuickViewModal.tsx` — item 3
- `src/components/gpt-commerce/AgenticMessageComponents.tsx` — item 3
- `src/components/gpt-commerce/RightPanel.tsx` — item 3
- `src/components/gpt-commerce/AddressShippingSelector.tsx` — item 3
- `src/components/gpt-commerce/AccountPanel.tsx` — item 3
- `src/features/gpt-commerce/mobile/MobileBottomSheet.tsx` — item 3

No backend / edge function / supabase migration / SQL changes. Approve to apply.
