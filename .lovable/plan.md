All changes scoped to `/m/gptcommerce` only. Frontend-only. No backend/edge function/SQL changes. No edits to shared `ChatProductCard.tsx` (mobile-scoped CSS overrides instead).

## 1. Header logotype not fully visible / size mismatch
**File:** `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx` (header), `MobileChatLanding.tsx` (footer brand block)

**Root cause:** `flowcart-logotype.svg` has a 1080×1080 square viewBox with the wordmark drawn as a narrow horizontal band inside it. Setting only `height: 28px` with `width: auto` produces a 28×28 box where the actual text is tiny. So the logotype looks "cut off" because most of the rendered area is empty padding.

**Fix:**
- Render the logotype with an explicit wider `width` (e.g. `width: ~120-140px, height: auto, object-fit: contain`) so the wordmark appears at a visually meaningful size.
- Slightly bump the adjacent gradient icon square (currently `w-8 h-8` ≈ 32px) to ~`w-11 h-11` (~44px) so the wordmark glyph height visually aligns with the square.
- Apply the same proportions in the mobile-landing footer brand block.

## 2. Chat product cards — Add/Save/Details buttons hidden behind input gradient
**File:** `src/features/gpt-commerce/mobile/MobileChatThread.tsx`

**Root cause:** The floating input has a tall gradient backdrop and the messages container only reserves `pb-44`. Cards are 420px tall and the action row sits flush against the bottom edge of the card, so it is masked by the gradient.

**Fix (mobile-only, no edit to shared `ChatProductCard.tsx`):**
- Increase scroll-area bottom padding from `pb-44` to `pb-56` (or ~`pb-60`) so the last visible content clears the input bar.
- Add scoped CSS in `MobileChatThread.tsx`’s `<style>` block targeting the card wrapper (`.mobile-chat-card-wrap`) to bump card height to ~460-470px and ensure the action row has clearance.
- Wrap each `ChatProductCard` in a `div.mobile-chat-card-wrap` so the override is scoped.

## 3. Landing product carousel cards must NOT trigger AI
**Files:** `src/features/gpt-commerce/mobile/MobileChatLanding.tsx`, `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx`

**Current behavior:** Tapping a Hot Deals card calls `submit(\`درباره ${name} بیشتر بگو\`)` which goes through `handleSendMessageWithPending → sendMessageToBasket` and hits the AI agent.

**Desired behavior:** The same user message bubble appears in the chat, but the assistant reply is a deterministic, locally-rendered PDP for that product (using existing `PDPProductComponent` via `inlineProduct` on a `ChatMessage`). No AI call.

**Fix:**
- Add a new prop `onProductCardTap(product: Product)` to `MobileChatLanding`.
- Tap handler in the carousel calls `onProductCardTap(product)` instead of `submit(...)`.
- Implement `onProductCardTap` in `MobileGPTCommerceShell`:
  1. Create-or-reuse a basket the same way `handleSendMessageWithPending` does (forceNew when on landing).
  2. Directly mutate basket state (`setBasketStates`) to push two messages:
     - user message: `درباره {name} بیشتر بگو`
     - assistant message with `inlineProduct: product` and `content: ""` (or short fixed copy).
  3. Set `hasStartedChat: true`. Do NOT call `useAgentMessages.handleSendMessage`.
- This keeps everything frontend; `MobileChatThread` already renders `msg.inlineProduct` via `PDPProductComponent`.

## 4. Prompt tips become true prompt templates with user-fillable slots
**Files:** `src/features/gpt-commerce/mobile/MobilePromptTipsCard.tsx` (rework), new `MobilePromptTemplateModal.tsx`

**Current behavior:** Tip card directly calls `onSendMessage(tip.example, true)`.

**New behavior:** Each tip is a template with one or more named slots and sensible defaults. Tapping a tip opens a small bottom-sheet/modal where the user edits the slot values, then taps "ارسال" to submit the resolved string via the existing `onSendMessage`.

**Implementation:**
- Restructure each tip to:
  ```ts
  {
    icon, title, gradient, iconBg,
    template: "بهترین {category} زیر {budget} تومان",
    slots: [
      { key: "category", label: "دسته‌بندی", placeholder: "هدفون نویزکنسلینگ", default: "هدفون نویزکنسلینگ" },
      { key: "budget",   label: "بودجه",      placeholder: "۵ میلیون",         default: "۵ میلیون" },
    ],
    preview: "بهترین هدفون نویزکنسلینگ زیر ۵ میلیون"
  }
  ```
- The card visibly shows the template with slot chips highlighted (e.g. `بهترین [هدفون نویزکنسلینگ] زیر [۵ میلیون]`).
- Tap → open `MobilePromptTemplateModal` (reuses existing `Sheet`/`Drawer` styling) with one input per slot (RTL, Persian numerals where relevant), live preview at top, and a primary "ارسال" button. Cancel closes modal.
- On submit: build the resolved string by `template.replace("{slot}", value)` and call `onSendMessage(text, true)`.
- Modal component lives only under `src/features/gpt-commerce/mobile/`.

## 5. Landing carousels alignment with title and visible side margins
**File:** `src/features/gpt-commerce/mobile/MobileChatLanding.tsx` (Hero, Hot Deals), `MobilePromptTipsCard.tsx`

**Root cause:** The scroll containers are full-bleed (`overflow-x-auto` with no horizontal margin), and the inner row uses `paddingInlineStart/End: "1.25rem"` to fake alignment. This causes the first card to start visually flush at the viewport edge during scroll because the scroll container itself has no `px-5` offset; padding inside `flex` is consumed by scroll. Result: appears edge-to-edge with no breathing room and inconsistent with title (which is `px-5`).

**Fix (consistent pattern for all three carousels: hero slider, hot deals, prompt tips):**
- Wrap each carousel scroll container in a `px-5` parent that uses negative margin trick:
  ```tsx
  <div className="px-5">
    <div className="-mx-5 overflow-x-auto scrollbar-none snap-x snap-proximity">
      <div className="flex gap-2.5 px-5">{/* cards */}</div>
    </div>
  </div>
  ```
- Remove the explicit `paddingInlineStart/End: "1.25rem"` style on the inner flex (replaced by `px-5`).
- Ensures: titles and first card align at `1.25rem`, last card has trailing margin, side gradient mask (optional small fade) can be added later but is not required.

## Out of scope
- No changes to `/gptcommerce` desktop, `/farsi`, or any shared component file used by both desktop and mobile.
- No backend / edge function / SQL / RLS / data schema work.
- No copy/text rewrites beyond what is required for new prompt-template slot labels.

## Files to be edited
- `src/features/gpt-commerce/mobile/MobileGPTCommerceShell.tsx` — header logotype sizing, new `onProductCardTap` handler.
- `src/features/gpt-commerce/mobile/MobileChatLanding.tsx` — logotype/footer sizing, carousel alignment wrappers, hot-deals tap wiring, new prop plumbing.
- `src/features/gpt-commerce/mobile/MobileChatThread.tsx` — bottom padding bump, scoped CSS to enlarge chat product card and reveal buttons.
- `src/features/gpt-commerce/mobile/MobilePromptTipsCard.tsx` — convert to template cards + modal trigger, alignment wrapper.
- `src/features/gpt-commerce/mobile/MobilePromptTemplateModal.tsx` — new file (slot-fill modal).
