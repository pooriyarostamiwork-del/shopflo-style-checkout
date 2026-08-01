# Playground: isolated UI/UX lab

A self-contained sandbox for designing and testing new components without touching Farsi, GPT Commerce, or Shift. Front-end only, no backend, no shared state.

## Routes

- `/playground` — index: grid of experiment cards (title, description, status chip: draft / review / shipped)
- `/playground/:experimentId` — full-screen canvas rendering one experiment

Nothing outside `src/features/playground/` and two lines in `App.tsx` gets touched.

## Structure

```text
src/features/playground/
  PlaygroundShell.tsx      layout: slim rail of experiments + canvas
  registry.ts              single list of experiments (id, title, desc, status, component)
  styles/playground.css    scoped --pg-* tokens, imported only by the shell
  experiments/
    _template.tsx          copy-paste starter for a new experiment
    example-card.tsx       one seed experiment to prove the harness
```

## Canvas features (design-focused)

- Viewport switcher: mobile 390 / tablet 768 / desktop full, rendered inside a bordered frame
- Direction toggle: RTL / LTR (scoped to the canvas only, does not touch `document.documentElement`)
- Background toggle: canvas / surface / dark, to check contrast
- Optional prop knobs per experiment (simple declarative controls: toggle, select, text) so variants can be compared without editing code

## Isolation rules

- Playground never imports from `features/shift`, `features/gpt-commerce`, `features/shift-dashboard`, or `features/vendor-dashboard`; it may import shadcn primitives from `@/components/ui`
- Core products never import from `features/playground`
- All playground styling lives under a `.playground` scope so tokens can be experimental without leaking
- No Supabase calls, no localStorage writes outside a `pg-*` prefix; mock data lives beside each experiment

## Promotion flow

When an experiment is approved, its file is copied into the target product folder and adapted to that product's tokens; the playground copy stays as reference with status `shipped`.

## Technical notes

- Two new routes in `src/App.tsx`, lazily imported so the playground adds nothing to the main bundle path
- `registry.ts` is the only file to edit when adding an experiment
- Reuses existing Tailwind config; new experimental tokens are defined as CSS vars inside `playground.css`, not in `tailwind.config.ts`
