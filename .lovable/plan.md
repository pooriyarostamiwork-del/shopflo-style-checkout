## Scope

Frontend-only polish across `src/features/shift-dashboard/` for both `/shift/dash/lite` and `/shift/dash/pro`. No layout or feature changes — same sections, same controls, same data.

---

## 1. Small-screen optimization

**File: `ShiftDashboard.tsx`**
- Collapse the top bar padding and shrink the welcome text on `<sm`.
- Convert the desktop sidebar into a swipeable drawer on `<lg` (already exists) but ensure the trigger is a 44×44 tap target and the drawer width caps at `min(300px, 88vw)`.
- Reduce outer container padding: `px-5 py-6` → `px-3 py-4 sm:px-5 sm:py-6`.
- Sticky footer safe-area (`env(safe-area-inset-bottom)`) inside the drawer.

**File: `dashboard.css`**
- Global mobile rules under `@media (max-width: 640px)`:
  - `.sd-headline` scales `30px → 22px`, tighten leading.
  - `.sd-card` radius `20px → 16px`, padding trimmed.
  - `.sd-btn-*`, `.sd-tab`, `.sd-switch`, `.sd-nav-item` → `min-height: 44px`.
  - `.sd-tab-group` becomes horizontally scrollable (`overflow-x:auto; scroll-snap`) with hidden scrollbar.
  - `.sd-table` → `display:block; overflow-x:auto` wrapper.

**Section files** (`PerformanceHome`, `AgentControl`, `VisualCustomization`, `Settings`, `PlansBilling`, `Support`)
- Audit every `grid-cols-*` and `flex` cluster: enforce `grid-cols-1 sm:grid-cols-2 lg:grid-cols-*` stacking, wrap action clusters with `flex-wrap gap-2`.
- KPI hero row: single column on mobile with hero card first.
- Pricing tier cards stack; segmented meters remain 10-cell but shrink cell height.

---

## 2. Interaction states (hover / focus / active)

**File: `dashboard.css`**
- Add a shared focus ring token: `--sd-focus: 0 0 0 3px hsl(var(--sd-primary) / .28)`.
- Apply `:focus-visible` outline on all of: `.sd-btn-primary`, `.sd-btn-ghost`, `.sd-btn-dark`, `.sd-tab`, `.sd-nav-item`, `.sd-switch`, `.sd-seg button`, `.sd-input`, `.sd-chip` (when interactive).
- Consistent transitions: `transition: background .15s, border-color .15s, transform .15s, box-shadow .15s`.
- Active/pressed: `transform: translateY(1px) scale(.99)` on primary/dark/ghost buttons and tabs.
- Hover: hairline strengthens (`--sd-stroke → --sd-stroke-strong`) instead of shadow shifts. Keep hover disabled on `(hover: none)` devices via `@media (hover: hover)` gating.
- Switch: add pressed halo and `:focus-visible` ring around the track.

**Files: `SectionTabs.tsx`, `AgentStatusToggle.tsx`, `Switch.tsx`**
- Add `aria-selected` / `aria-pressed` where missing so styles hook cleanly; add `role="tablist"` on tab groups.

---

## 3. RTL typography & spacing rhythm

**File: `dashboard.css`**
- Load Vazirmatn with `wght` axis 300–700 (self-hosted or `@import` — same as current).
- Establish rhythm tokens:
  ```
  --sd-lh-tight: 1.25;
  --sd-lh-body:  1.7;
  --sd-lh-num:   1.1;
  --sd-tracking-fa: 0;      /* Vazirmatn dislikes negative tracking in Farsi */
  --sd-tracking-num: -0.01em;
  ```
- Split rules: Persian text uses `letter-spacing: var(--sd-tracking-fa)`; `.sd-num` uses the numeric tracking. Remove the global `-0.005em` currently on `.shift-dash`.
- Headline scale: `36 / 28 / 22 / 18 / 15 / 13 / 11.5` — align every `.sd-headline`, `.sd-sublead`, `.sd-eyebrow`, KPI value, KPI label, chip, and table cell to one of these steps.
- Vertical rhythm: standardize section gaps to `mb-6 sm:mb-8`, card inner padding to `p-4 sm:p-5`.
- Table row line-height 1.6; chip line-height 1.5; button 1.2.
- `unicode-bidi: plaintext` on multi-lingual labels that mix Farsi + latin brand names.

---

## 4. Skeleton loading states

**New file: `shared/Skeleton.tsx`**
- Base `<Skeleton />` primitive (`sd-skel` class) with animated shimmer keyframe defined in `dashboard.css` (`@keyframes sd-shimmer`).
- Preset components:
  - `KpiCardSkeleton` (matches KPI + hero layouts)
  - `TrendChartSkeleton` (title bar, timeframe pills, faint chart bars)
  - `TableRowSkeleton`
  - `ListItemSkeleton`
  - `IntentCloudSkeleton`

**File: `context/DashboardContext.tsx`**
- Add a `loading: boolean` flag (defaults to `true` for ~800 ms on mount via `setTimeout`, cleared afterward). Purely for perceived-perf demo — no data source changes.

**Section files**
- Each section reads `loading` from context; renders the matching `*Skeleton` cluster while true, then swaps to the real content. Same grid so the layout doesn't shift.

---

## 5. Chart redesign from the ground up

**File: `shared/TrendChart.tsx` — rewrite**

Direction: an editorial split-metric chart, one per card, replacing the current dual-axis area+dashed-line combo.

- **Structure**
  - Header row (unchanged spot): eyebrow + title on the right, timeframe pill group on the left.
  - Metric ribbon under the header: primary value (large `.sd-num`), delta chip, muted secondary metric with its own dot legend. This kills the recharts `<Legend>` and gives an at-a-glance answer above the chart.
- **Primary series (`a`)**: smooth monotone area, single soft gradient (`--sd-primary` at 22% → 0%), 2 px stroke, rounded caps. Dots only on hover.
- **Secondary series (`b`)**: thin 1.5 px solid line (drop the dashed pattern) in `--sd-ink-2`, opacity 0.55.
- **Grid**: horizontal hairlines only, 4 evenly-spaced levels; no vertical grid. Y-axis labels shown on the right (RTL), muted, tabular-nums.
- **X-axis**: 5–7 tick target with auto-thin on mobile; today's tick highlighted with a filled primary dot below the axis.
- **Peak & trough markers**: small primary/ink dots on the max and min of series A with a floating tag on hover.
- **Hover**: vertical guide line + a single unified card tooltip (RTL, rounded 12 px, hairline border) that lists both series with color dots and formatted values. Uses `<Tooltip cursor>` custom render.
- **Empty / loading**: reuses `TrendChartSkeleton`.
- **Motion**: draw-in animation via `<Area isAnimationActive>` with 400 ms ease-out; disabled when `prefers-reduced-motion`.

Same props (`title`, `seriesA`, `seriesB`, formatters) — drop-in replacement in `PerformanceHome.tsx` (both graphs there) so no consumer changes.

---

## Technical notes

- Recharts stays; no new deps.
- All new classes are `.sd-*` scoped inside `.shift-dash` — no leakage.
- No changes to `mockDashboard.ts`, routing, or any section's feature composition.
- Verify after build: Playwright screenshot at 375×812 and 1440×900 for both `/shift/dash/lite` and `/shift/dash/pro`, plus tab-key focus walk to confirm outlines.
