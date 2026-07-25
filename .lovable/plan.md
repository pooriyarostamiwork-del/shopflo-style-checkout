## Shift Dashboard — Shell Refinement (Phase 1: Shared Chrome)

Scope: `/shift/dash/lite` and `/shift/dash/pro`. Only the shared shell — header (top bar), sidebar, and nav. Section bodies untouched in this pass.

### 1. Top bar redesign

Rebuild the top bar in `ShiftDashboard.tsx` as a lighter, more editorial strip:

- **Left cluster**: mobile menu button + a slim breadcrumb showing the active section title (derived from `FLAT.find(activeSection).label`) with a subtle eyebrow ("Shift Dashboard / …"). This replaces the tri-state agent toggle that currently sits there.
- **Right cluster**: a modern **plan chip** (Lite/Pro) + user greeting "خوش آمدید، سارا" + avatar. The chip becomes the primary status signal in the top bar.
- Refined visuals: taller bar (56px), hairline bottom border only, no shadow, softer blur, tighter type scale. Avatar gets a subtle ring on hover.
- Remove: `AgentStatusToggle` from the top bar entirely (component file stays — it's still used inside Agent Control section).

### 2. Sidebar redesign

Rework the sidebar in `ShiftDashboard.tsx` for a more elegant, professional feel:

- **Top**: refined wordmark (`Shift.`) with tighter tracking and a subtle version/plan micro-label under it.
- **Groups**: keep the 3 groups (داشبورد / مدیریت / حساب) but restyle labels as uppercase micro-eyebrows with more breathing room; add 1px hairline dividers between groups instead of just spacing.
- **Nav items**: taller rows (40px), softer active state (filled pill in `--sd-surface` with primary-tinted left border in RTL = right border), animated icon color transition, hover uses a very light tint instead of the current stronger fill.
- **Bottom section**: **delete entirely** — remove the store-name + PlanTag block at the bottom of the sidebar. Sidebar ends at the nav list. `PlanTag` import stays (still used in `PlansBilling`), but the bottom `<div>` block is removed.

### 3. Plan chip (moved to top bar)

- Reuse the existing `PlanTag` styling as the base, but slightly refined: smaller radius (`rounded-md` → keep pill), subtle gradient for Pro, monochrome outline for Lite, and it sits inline with the greeting.
- Plan is read from `useDashboard().plan` (already available).

### 4. Mobile shell

- Same changes propagate to the mobile drawer: no bottom store block; drawer header shows the wordmark only.
- Top bar on mobile: hamburger + section title on the left, plan chip + avatar on the right (greeting text hidden < md, already the pattern).

### Files touched

- `src/features/shift-dashboard/ShiftDashboard.tsx` — top bar + sidebar rebuild.
- `src/features/shift-dashboard/shared/PlanTag.tsx` — minor visual polish for inline use.
- `src/features/shift-dashboard/styles/dashboard.css` — refine `.sd-nav-item`, `.sd-nav-label`, add top-bar breadcrumb + greeting styles, tighten hover/active tokens.

### Not in this pass

- Section content (Performance Home, Agent Control, etc.) — refined in later phases, one by one as you go.
- `AgentStatusToggle` component itself — kept in place inside Agent Control where it belongs.
- Footer — the dashboard has no footer today; not adding one unless you want it.

### Confirm before I build

- OK that the agent status tri-toggle disappears from the top bar and only lives inside the Agent Control section going forward?
- OK to hardcode the greeting name as "سارا" (current mock) until real auth data is wired?
