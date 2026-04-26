# Mobile Polish + Image Placeholder Fallback

Front-end only. Zero changes to edge functions, hooks, or DB. Five scoped fixes.

---

## 1. Mobile header — replace Account button with New Chat button
**Scope:** `/m/gptcommerce` only

In `MobileGPTCommerceShell.tsx`, the right-side header cluster currently has `[Account] [Cart]`. Replace the Account icon button with a **New Chat** button (`SquarePen` / `Plus` icon).

- Click → `setPendingNewChat(true)` (same handler the input area uses).
- Account access stays accessible via the bottom-sheet `account` tab (already exists).
- Cart button stays unchanged.
- Desktop `GPTCommerceShell.tsx` is **not touched**.

---

## 2. Landing — replace category icon grid with prompt chips
**Scope:** `/m/gptcommerce` only (`MobileChatLanding.tsx`)

Remove the `quickCategories` 3-column emoji grid entirely. Merge them into the existing horizontal "suggestion chips" row as a single, scrollable group of pill chips. Each chip = a full prompt string that is sent on tap.

New chip set (Persian, prompt-style, not category labels):
- "هدفون بی‌سیم زیر ۵ میلیون پیشنهاد بده"
- "گوشی موبایل با دوربین خوب"
- "لپ‌تاپ برای برنامه‌نویسی"
- "ساعت هوشمند مناسب ورزش"
- "بهترین تخفیف‌های امروز"
- "خودت برام خرید کن"
- "می‌خوام برای دوستم هدیه بخرم"
- "مقایسه دو محصول"

Layout: `flex flex-wrap gap-2` (chips wrap naturally on narrow screens), same primary-tinted pill styling already used. Section title becomes "از این‌ها شروع کن".

---

## 3. Fix top-clipping under sticky header
**Scope:** `/m/gptcommerce` only (`MobileChatThread.tsx`, `MobileChatLanding.tsx`)

**Root cause:** Both screens use `h-[100dvh]` / `min-h-[100dvh]` internally, but they are rendered **inside** the shell's flex container which already accounts for the header. The double-allocation (header + `100dvh` child) pushes the first message's top edge above the visible scroll origin.

**Fix:**
- In `MobileChatThread.tsx`: change root `h-[100dvh]` → `h-full`. Increase top padding of message list from `pt-2` to `pt-4`.
- In `MobileChatLanding.tsx`: change `min-h-[100dvh]` → `min-h-full` and reduce top hero padding from `pt-12` → `pt-6` (header now provides offset).
- In `MobileGPTCommerceShell.tsx`: the body wrapper is already `flex-1 min-h-0 overflow-hidden` — confirm and keep. Add `flex` to enable child `h-full`.

This restores the intended scroll anchor under the sticky header and removes the clipped first-message issue.

---

## 4. Redesign the "چت‌ها" tab in the bottom sheet
**Scope:** `/m/gptcommerce` only (`MobileBottomSheet.tsx`, `baskets` tab body)

Modernize the chats list. Visual upgrades:

- **Hero "+ New Chat" card** at the top: full-width, gradient primary background, larger touch target (~64px), Sparkles + Plus icons, label "گفتگوی جدید". Replaces the dashed-outline button.
- **Section label** "گفتگوهای اخیر" with a count badge.
- **Basket cards**:
  - Slightly taller (p-3.5), softer shadow `0 1px 3px rgba(0,0,0,0.04)`, rounded-2xl.
  - Avatar circle uses a per-basket pastel hue derived from `b.id` hash (4-color rotation: primary/blue/amber/rose tints) to give the list visual rhythm.
  - Two-line content: title (15px, semibold) + meta row with two pills (`{count} کالا` and `{lastActivity}`) instead of a dot-separated single line.
  - Active basket: primary-tinted background + thin primary left border (`border-r-2` in RTL) instead of the heavy `ring-2` outline.
  - Delete becomes a small trailing icon button only revealed on press (active state), reducing visual clutter.
- **Empty state**: larger illustration block with a subtle dashed border and a CTA ghost button "شروع کن".

No data/logic changes — purely presentational rewrite of the `tab === "baskets"` branch.

---

## 5. Image fallback placeholder (desktop + mobile)
**Scope:** Shared component used everywhere a product image renders

Create `src/components/gpt-commerce/ProductImage.tsx`:

```tsx
interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}
```

Behavior:
- Renders an `<img>` with `onError` → swap to fallback state.
- Fallback state renders a styled placeholder div (same dimensions via className) with:
  - Soft gradient background (`from-muted/40 to-muted/20`).
  - Centered `ImageOff` lucide icon (40% opacity).
  - Optional first 2 chars of `alt` as a faint label.
- Also handles empty/missing `src` (treats as error from the start).
- `loading="lazy"` and `decoding="async"` defaults.

**Replace `<img>` with `<ProductImage>` in:**
- `src/components/gpt-commerce/ChatProductCard.tsx` (line 71)
- `src/components/gpt-commerce/ProductCard.tsx` (line 30)
- `src/components/gpt-commerce/PDPProductComponent.tsx` (lines 118, 150, 513)
- `src/features/gpt-commerce/mobile/MobileBottomSheet.tsx` (cart item thumbnail, line 176)
- `src/features/gpt-commerce/mobile/MobileChatThread.tsx` — N/A (uses ChatProductCard)
- `src/components/CartItemLocalized.tsx` if it has a product image (verify during impl)

Single component → consistent fallback across all surfaces, both viewports.

---

## Files Touched
| File | Change |
|---|---|
| `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx` | Header: Account → New Chat button |
| `src/features/gpt-commerce/mobile/MobileChatLanding.tsx` | Replace category grid with prompt chips; fix top spacing |
| `src/features/gpt-commerce/mobile/MobileChatThread.tsx` | Fix `h-[100dvh]` → `h-full`; add top padding |
| `src/features/gpt-commerce/mobile/MobileBottomSheet.tsx` | Redesign baskets tab; swap cart image to ProductImage |
| `src/components/gpt-commerce/ProductImage.tsx` | **New** shared component with onError fallback |
| `src/components/gpt-commerce/ChatProductCard.tsx` | Use ProductImage |
| `src/components/gpt-commerce/ProductCard.tsx` | Use ProductImage |
| `src/components/gpt-commerce/PDPProductComponent.tsx` | Use ProductImage |

No backend, no hooks, no routing, no desktop shell changes.
