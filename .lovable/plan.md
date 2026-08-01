# Playground: isolated storefront replica for UI/UX experiments

A sandbox that looks and behaves like the agentic storefront (Shift / GPT Commerce), so new components can be tested inside a real shopping journey — chat, product cards, cart sidebar, checkout steps — without touching the core products.

Front-end only. No backend, no edge functions, no database.

## Routes

- `/playground` — desktop storefront replica (mirrors `/shift`)
- `/playground/m` — mobile storefront replica (mirrors `/shift/m`)
- Optional dev drawer inside both, toggled by a small floating button

## Structure

```text
src/features/playground/
  PlaygroundShell.tsx        desktop shell: sidebar + chat thread + right panel
  MobilePlaygroundShell.tsx  mobile shell: chat + bottom sheet
  data/mockStore.ts          store branding, products, coupons, addresses
  data/mockJourney.ts        scripted conversation turns for each journey step
  hooks/usePlaygroundChat.ts local-only chat/cart state (no network)
  devtools/DevDrawer.tsx     journey jumper + experiment switcher
  experiments/               new components under test
  registry.ts               experiment list (id, title, status, component)
  styles/playground.css     scoped --pg-* tokens
```

## Storefront replica

The shell is a copy of the Shift storefront layout (RTL Farsi, same density and component slots), rewired to local state:

- Chat thread with assistant/user messages, quick replies, product cards, inline PDP
- Cart sidebar with flat single-vendor cart
- Address + shipping selector, payment selector, order summary, success state
- Agent replies come from a scripted mock responder (keyword matched, instant or with a fake delay) — no AI call

## Journey testing

The dev drawer lets any state be reached in one click instead of chatting through it:

- Jump to a journey step: discovery, product details, cart, address, shipping, payment, confirmation
- Seed cart: empty / 1 item / multiple items / out-of-stock item
- Auth state: guest / logged in
- Viewport frame: mobile 390 / tablet / full
- Slot override: render an experiment in place of the real product card, cart row, or checkout step, so a new component is tested inside the actual flow

## Isolation rules

- Playground never imports from `features/shift`, `features/gpt-commerce`, `features/shift-dashboard`, or `features/vendor-dashboard`; components are copied in, not referenced, so edits can't break core products
- Core products never import from `features/playground`
- Styling scoped under `.playground`; no changes to `tailwind.config.ts` or global `index.css`
- No Supabase client usage; `localStorage` keys prefixed `pg-*` only

## Promotion flow

When an experiment is approved, its file is copied into the target product folder and adapted to that product's tokens and data types; the playground copy remains with status `shipped`.

## Technical notes

- Two lazy routes added to `src/App.tsx`; nothing else outside `src/features/playground/`
- Mock data mirrors the shape of the real product/cart types so promoted components need minimal rewiring
- `registry.ts` is the only file to edit when adding an experiment
