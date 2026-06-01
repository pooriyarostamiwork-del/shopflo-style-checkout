All changes are frontend-only and scoped to `/m/gptcommerce`. No backend, edge function, SQL, or shared desktop component behavior is modified.

## 1. Prompt template modal — semi static, just like action bars modal background

File: `src/features/gpt-commerce/mobile/MobilePromptTemplateModal.tsx`

- Remove the `slideUp` keyframes, the `animation: "slideUp ..."` inline style, the `animate-fade-in` on the backdrop, and the `animate-slide-in-right` class on the sheet.
- The sheet just renders in place when `open` is true. Backdrop stays static (semi-transparent, click-to-close).

## 2. Prompt template modal — fully visible content + CTA

Same file. Current problems: sheet uses `max-h: 85vh` and bottom safe-area padding, but with header + preview block + N inputs (some templates have 2 slots) + send button, the CTA gets pushed below the fold on small viewports, and there is no internal scroll because the outer container is the scroll surface — the button can be clipped behind the keyboard or sit at the screen edge with no breathing room.

Fix:

- Make the sheet a flex column: fixed `max-height: 88vh`, internal regions:
  - header (drag handle + title row) — non-scrolling.
  - middle scroll area (`flex-1`, `overflow-y-auto`) containing live preview + slot inputs.
  - sticky footer holding the send button with a top hairline border and the safe-area bottom padding.
- Pin the send CTA to the footer so it is always visible regardless of slot count or keyboard.
- Slight padding tweaks so inputs don't crowd the CTA.

## 3. Landing product card tap — fill the empty assistant bubble

File: `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx` → `handleLandingProductTap`.

Currently the assistant message is created with `content: ""`, so the bubble is empty above the inline PDP. Replace with a short Farsi line, for example:

```
این هم جزئیات «{product.name}». اگه سوالی داری یا خواستی به سبد اضافه کنی، همین‌جا بگو.
```

Apply in both branches (new basket + existing basket) so the bubble is never empty.

## 4. Swipeable photo gallery in `ChatProductCard`

File: `src/components/gpt-commerce/ChatProductCard.tsx`

The card currently renders a single `<ProductImage>`. Add a horizontally-swipeable gallery for `product.imageUrls` while keeping current visual size (square area at top, `aspect-square`, `object-cover`).

Implementation:

- Compute `images = product.imageUrls?.length ? product.imageUrls : [getChatProductImage(...)]`.
- Replace the single image with a horizontal scroll container:
  - `overflow-x-auto snap-x snap-mandatory scrollbar-none`, `dir="ltr"` on the inner track to keep natural swipe direction, RTL preserved on the card itself.
  - Each slide is a `flex-shrink-0 w-full aspect-square snap-start` wrapping `<ProductImage>` with `object-cover`.
- Track active slide via `onScroll` (compute `Math.round(scrollLeft / clientWidth)`) and render small dot indicators bottom-center over the image (only when `images.length > 1`), styled with the existing primary token.
- Preserve existing badges (number, discount) and `fastDelivery` ribbon — they sit absolutely above the gallery and are unaffected.
- Stop click propagation on swipe area so it doesn't accidentally trigger card-level handlers; existing button actions stay intact.

This change applies everywhere `ChatProductCard` is used; behavior is identical when a product has only one image (single slide, no dots), so it's backward-compatible. No business logic touched.

## 5. Enable scrollable photos in `PDPProductComponent` on mobile

File: `src/components/gpt-commerce/PDPProductComponent.tsx`

Gallery already exists but is gated behind `showImageNavigation`. On mobile we use the inline PDP without that flag, so multiple `imageUrls` are hidden.

Two-part fix, additive only:

a. Add a new optional prop `enableSwipeGallery?: boolean`. When true:

- Render the existing `productImages` as a touch-swipeable horizontal scroller (same pattern as ChatProductCard: snap-x mandatory, full-width slides, dots indicator under the image).
- Keep the existing prev/next arrows and lightbox path off (those are for desktop hover); mobile uses native swipe + dots.
- Tapping a dot scrolls programmatically to that slide and updates `currentImageIndex`.

b. In `src/features/gpt-commerce/mobile/MobileChatThread.tsx`, pass `enableSwipeGallery` when rendering `<PDPProductComponent>` inline. No change to desktop usage.

This keeps desktop PDP untouched while giving mobile the swipeable gallery.  
  
currently photos are ready to use database wise. products database > image_urls column

## Out of scope

- No edits to `/farsi`, desktop `GPTCommerceShell`, hooks, edge functions, SQL, agent logic, or `gptCommerceData.ts`.
- No new packages; native scroll-snap + a tiny `onScroll` handler is enough.