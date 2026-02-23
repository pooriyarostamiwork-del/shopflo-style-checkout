

# Redesign Root Landing Page (`/`)

## Overview

Transform the current simple two-button picker into a polished, brand-forward landing page with three sections: hero with brand identity, an embedded pitchdeck viewer (placeholder for now), and two product path cards.

## Design Direction

The page will use the brand primary color (#696FC7 / lavender-indigo) as the anchor, with a clean white background, subtle gradient accents, and the stroke-based separation aesthetic already established in the project. The layout is vertically stacked, centered, and responsive.

### Layout (top to bottom)

```text
+--------------------------------------------------+
|                                                    |
|              [Flowcart Logo Icon]                  |
|                  فلوکارت                           |
|     دستیار خرید هوش مصنوعی و سبد خرید یک کلیکی    |
|                                                    |
+--------------------------------------------------+
|                                                    |
|         +--------------------------------+         |
|         |                                |         |
|         |       Pitchdeck Viewer         |         |
|         |    (PDF / Slide Placeholder)   |         |
|         |                                |         |
|         +------[<] [1/N] [>] [expand]----+         |
|                                                    |
+--------------------------------------------------+
|                                                    |
|   +------------------+  +------------------+       |
|   |   GPT Commerce   |  |    Checkout      |       |
|   |   AI Shopping    |  |   One-Click      |       |
|   |   Assistant      |  |   Persian Cart   |       |
|   |      [->]        |  |      [->]        |       |
|   +------------------+  +------------------+       |
|                                                    |
+--------------------------------------------------+
```

## Technical Implementation

### New Component: `src/pages/Landing.tsx`

Replace the inline `LandingPicker` in `App.tsx` with a dedicated page component.

**Hero Section**
- Centered Zap icon in a primary-gradient rounded container (reuse the pattern from ChatLanding)
- "فلوکارت" as a large bold title (text-4xl/5xl)
- Subtitle in muted-foreground
- Subtle animated floating decorative elements using existing `animate-float-slow`

**Pitchdeck Viewer**
- A container with 16:9 aspect ratio, max-width ~900px
- Navigation bar at the bottom: previous/next slide buttons, slide counter (e.g. "1 / 12"), fullscreen toggle
- Placeholder state: shows a branded slide mockup with "Pitchdeck Coming Soon" message
- Uses `1px solid border` stroke separation, rounded-2xl corners
- Fullscreen mode: uses browser Fullscreen API, dark overlay background
- State: `currentSlide`, `totalSlides`, `isFullscreen`
- When a real PDF is added later, this can be swapped to render PDF pages via canvas or an iframe

**Product Path Cards**
- Two side-by-side cards in a flex row (stack on mobile)
- Each card: icon/emoji, product name (bold), subtitle description, arrow indicator
- Hover: subtle border color change to primary, slight translateY lift
- Links to `/gptcommerce` and `/farsi`
- Cards use stroke separation (1px border), no shadows per design system

**Decorative Elements**
- Small floating abstract shapes (circles, rounded rectangles) in primary/5 and primary/10 opacity, using `animate-float-slow` with staggered delays
- A subtle radial gradient behind the hero: `bg-gradient-to-b from-primary/3 via-background to-background`

### Modified: `src/App.tsx`

- Import `Landing` from `src/pages/Landing.tsx`
- Replace inline `LandingPicker` component with `<Landing />`
- Remove the old `LandingPicker` function

### New Animations in `src/index.css`

- Add `@keyframes slideUp` for staggered entrance of sections on load
- Add `.animate-slide-up` utility class

## Files

| File | Action |
|---|---|
| `src/pages/Landing.tsx` | Create -- new landing page component with hero, pitchdeck viewer, product cards |
| `src/App.tsx` | Edit -- replace `LandingPicker` with new `Landing` component import |
| `src/index.css` | Edit -- add slide-up entrance animation keyframes |

