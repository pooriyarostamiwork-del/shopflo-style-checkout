# Flowcart chat polish: eyes loader, typing placeholders, header and card cleanup

Scope: only `/gptcommerce` and `/m/gptcommerce` (desktop and mobile). Shift and other products stay untouched.

## 1. Wandering eyes loading animation
- Add a new self-contained "wandering eyes" loader component (two eyes that look around and blink, `9 / 4` aspect ratio, inherited color, tunable duration and expression).
- Replace the current rotating star loader inside the assistant waiting bubble on desktop chat and mobile chat.
- Keep the existing animated waiting text beside it; keep a reduced-motion fallback.
- Retire the old loader component and its styles once nothing uses them.

## 2. Chat mode header
- Remove the subtitle "دستیار خرید هوشمند" shown under the logotype in the chat header (top-right), on desktop and mobile.
- Reduce the chat-header logotype size by about 12% (both the mark and wordmark stay visually balanced together). Landing page logo sizes stay exactly as they are.

## 3. Typewriter placeholders
- Add a reusable typewriter text component (character-by-character reveal with a small stagger delay).
- Use it for the rotating input placeholder suggestions on the landing pages and inside chat mode, desktop and mobile, replacing the current fade-in of each rotating phrase.
- Keep the existing phrases and rotation timing so text has room to finish typing.

## 4. Landing header alignment
- Align the icon, logotype, and slogan on the landing hero to a single shared center axis with consistent spacing, so the three no longer look offset.

## 5. Remove favourites and save
- Delete the علاقه‌مندی tab (and its panel content) from the side panel; the panel keeps only the cart tab.
- Delete the save (bookmark) button from product cards in chat, next to the add-to-basket button, on desktop and mobile.

## Technical notes
- New components: `src/components/gpt-commerce/WanderingEyes.tsx`, `src/components/gpt-commerce/TypingText.tsx`.
- Edits: `ChatThread.tsx`, `ChatLanding.tsx`, `Sidebar.tsx`, `ChatProductCard.tsx`, `RightPanel.tsx`, and mobile `MobileChatThread.tsx`, `MobileChatLanding.tsx`, `MobileGPTCommerceShell.tsx`; `FlowcartBrand.tsx` gains a smaller chat-header variant.
- Remove `FlowcartLoader.tsx` plus its `.flowcart-loader` CSS and `--loader-*` tokens in `src/index.css` after replacement.
- `onSave` / `isSaved` / `savedProductIds` props are dropped from the chat card path only; underlying basket `savedItems` data and the archived-baskets sidebar section are left alone to avoid touching stored state.
- Colors come from existing theme tokens; no hardcoded colors.

## Verification
- Typecheck, then browser-check desktop and mobile landing and chat: loader animation, placeholder typing, header without slogan and slightly smaller, hero alignment, no favourites tab, no save button.
