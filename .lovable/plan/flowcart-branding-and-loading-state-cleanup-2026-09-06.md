# Flowcart branding and loading-state cleanup

## Scope
- Apply only to `/gptcommerce` and `/m/gptcommerce`; Shift and other products remain unchanged.
- Use the uploaded Flowcart icon as the canonical brand mark, including the site favicon.

## Branding changes
- Prepare the uploaded transparent icon for app use without stretching or its large empty canvas, and keep the visible mark centered at every size.
- Create shared Flowcart brand primitives so the icon/logotype proportions cannot drift between screens.
- Standardize the logotype around a visually balanced `115 × 35px` footprint, with a smaller responsive equivalent only where mobile space requires it.
- Replace the landing-page placeholder bolt with the uploaded icon above the logotype.
- Replace assistant message/loading avatars on desktop and mobile with the uploaded icon.
- Replace footer bolt/placeholder icons with the uploaded icon beside the consistently sized logotype.
- Fix the desktop chat/sidebar and mobile chat-header branding so the mark, logotype, subtitle, and surrounding spacing align cleanly without overlap.
- Preserve database-configured custom logos where they already intentionally override the default Flowcart branding.

## Loading animation
- Build a reusable compact version of the supplied Uiverse loader, retaining its rotating masked form, color cycling, glow, and dynamic intent-aware loading text.
- Replace the three bouncing dots in both desktop and mobile assistant loading bubbles.
- Scale the animation to the chat bubble rather than its original 100px demo size, use semantic theme tokens for its palette, and include a reduced-motion fallback.

## Technical details
- Store the uploaded binary through the project asset flow; create a separate optimized square favicon in `public/` and update the document icon reference.
- Keep logo dimensions in reusable component variants instead of scattered inline values.
- Add loader keyframes and color roles to the existing design system, avoiding global effects outside GPTCommerce.

## Verification
- Check desktop and mobile landing, active chat, assistant messages, loading state, and footer at representative viewport widths.
- Confirm no logo clipping, stretching, overlap, layout shift, or RTL reversal.
- Run the project typecheck and relevant automated browser checks.
