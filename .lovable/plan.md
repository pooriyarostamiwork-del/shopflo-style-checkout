## Scope
Front-end only, `/m/gptcommerce`. Files touched:
- `src/features/gpt-commerce/mobile/MobileChatLanding.tsx`
- `src/features/gpt-commerce/mobile/MobileChatThread.tsx`
- `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx`
- `src/features/gpt-commerce/mobile/MobileBottomSheet.tsx`
- `src/components/gpt-commerce/ProductImage.tsx` (placeholder icon swap is global; see note)

No backend, no schema, no edge function changes.

---

## 1. Landing logo +10% (SVG only, frame unchanged)
`MobileChatLanding.tsx` — keep the `4.1rem × 4.1rem` gradient tile. Bump the `<img>` from `width/height: 70%` to `77%` (70 × 1.10).

## 2. Prompt chips +10% (chip only, title unchanged)
`MobileChatLanding.tsx` — multiply chip tokens by 1.10:
- `CHIP_FONT_SIZE`: `0.638rem` → `0.702rem`
- `CHIP_PADDING_X`: `0.74rem` → `0.814rem`
- `CHIP_PADDING_Y`: `0.425rem` → `0.468rem`
Title (`پرطرفدارترین‌های امروز`, `0.88rem`) untouched.

## 3. Chat avatar — move to LEFT and use the SVG logo
`MobileChatThread.tsx`:
- Import `flowcartLogo` from `@/assets/flowcart-logo.svg`.
- Assistant row currently uses `justify-end` with avatar appearing on the right (RTL). Change to `justify-start flex-row-reverse` so avatar sits on the LEFT edge with the bubble flowing right-to-left next to it. (User row stays `justify-end flex-row-reverse` → user on right.)
- Replace the `<Zap />` inside the avatar circle with `<img src={flowcartLogo} alt="" style={{ width:'70%', height:'70%' }} />`. Keep the gradient circle frame as-is.
- Apply the same change to the `isProcessing` typing-bubble row.

## 4. Header chips polish
`MobileGPTCommerceShell.tsx` (scoped CSS in the existing `<style>` block):
- Category chip font: lighter + tighter. Override: `font-weight: 400 !important; letter-spacing: -0.01em !important;` and reduce `font-size` from `0.945rem` to `0.84rem`. Trigger height stays `2.25rem`.
- New-chat icon: bump from `1.05rem` to `1.25rem` (≈ +19%). Button frame size unchanged (`2.25rem × 2.25rem`).

## 5. Bottom-sheet tab order
`MobileBottomSheet.tsx` — current order is Cart | Chats | Account. Per request, move Chats to the right (first in RTL) and Basket (Cart) to the middle. New visual order in RTL (right→left):
```
چت‌ها | سبد | حساب
```
Reorder the three `<SheetTabBtn>` calls to: `baskets`, then `cart`, then `account`. No logic changes.

## 6. Placeholder icon — swap `ImageOff` for the Flowcart SVG
`ProductImage.tsx`:
- Replace the `<ImageOff />` lucide icon inside the fallback with the imported `flowcartLogo` SVG (`<img src={flowcartLogo} ... className="w-1/3 h-1/3 max-w-[40px] max-h-[40px] opacity-40" />`).
- Keep the existing `[role="img"] > span` text-label hide rule (mobile already strips it via `.mobile-no-img-label`).

Note: `ProductImage` is shared. The icon swap is a global visual change to the empty-image fallback only — no behavior change. Per request, this is purely front-end. If you want the swap restricted to mobile only, say so and we'll gate it via a class instead.

## 7. New mobile Hot Deals carousel under prompt chips
Add an elegant, mobile-friendly horizontal product carousel inside `MobileChatLanding.tsx`, rendered directly below the prompt-chips block.

Design:
- Section header (RTL): small flame `🔥` + title `داغ‌ترین تخفیف‌ها` (matching desktop tone).
- Horizontal scroller, `overflow-x-auto scrollbar-none snap-x snap-proximity`, gap `0.5rem`, edge padding `1.25rem`.
- Card: `w-[150px] flex-shrink-0`, white bg, `1px hsl(0 0% 0% / 0.06)` stroke, radius `1rem`, no shadow (per design memory).
  - Square 1:1 image via `ProductImage` (`object-cover`).
  - 2-line clamped name (`text-[12px] leading-tight`).
  - Price row: `formatPersianPrice(price)` in primary; if `originalPrice`, show strike-through smaller above and a discount % pill (`-٪۲۰`) in primary/10 bg.
  - Tap card → call `onSendMessage(\`درباره ${name} بیشتر بگو\`, true)` (reuses existing prop, opens chat, no new wiring).

Data: reuse existing pattern from `ProductCarousels.tsx` — `useQuery(['mobile-hot-deals'], ...)` against `supabase.from('products').select('*').eq('in_stock', true).not('original_price','is',null).order('original_price',{ascending:false}).limit(60)`, then sort by discount %, slice top 12, map via existing `mapDbProduct` (import from `ProductCarousels` or duplicate the small mapper). This is a client-side read using the existing Supabase client — **no new backend code**, no new tables, no edge function.

Loading state: 6 skeleton cards (same shimmer style as the hero slider) so layout is stable.
Empty state: render nothing (silent).

---

## ASCII layout after changes
```text
─ landing ─
  [logo +10%]  subtitle
  hero slider
  prompt chips title
  [chip] [chip] [chip]   ← chips +10%
  🔥 داغ‌ترین تخفیف‌ها
  ← [card][card][card][card] →   ← new carousel
─ sticky bottom ─
  chatbox
  [Baskets] [Cart] [Account]

─ chat ─
  [avatar(logo)] ┃ assistant bubble        ← avatar LEFT
                  user bubble  ┃   ← user RIGHT

─ bottom sheet tabs (RTL) ─
  چت‌ها | سبد | حساب
```

## Out of scope
- No changes to `/gptcommerce` desktop, `/farsi`, or any other route.
- No backend, RLS, edge function, migration, or schema work.
