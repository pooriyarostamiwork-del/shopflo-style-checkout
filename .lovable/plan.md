# Shift Dashboard — UI Refinement (Lite + Pro)

Goal: rebuild the visual layer of `/shift/dash/lite` and `/shift/dash/pro` from scratch, keeping every existing section, tab, feature, and user journey exactly where it is today. Front-end only. Farsi, RTL-first, Vazirmatn.

## Benchmark takeaways from the 3 references

- **Kanto (ref 1)** — airy off-white canvas, oversized editorial headline, soft rounded cards with hairline borders, a floating "insight" glass card, ghost bar-chart placeholders, tight sidebar-less top nav.
- **CreditTB (ref 2)** — punchy accent color (lime) used sparingly on one hero KPI, big arc/gauge, dark inline card as the "focus of the day", generous whitespace, chip tabs with an active pill.
- **Fleetly (ref 3)** — one filled hero KPI in brand color while siblings stay white, clean left rail with grouped nav, subtle grid dividers, orange used only for CTAs / active states, structured tables with tag chips.

Common language we'll adopt: **soft neutral canvas, one saturated accent (`#FF3737` — kept), hairline 1px strokes, 20px card radius, generous padding, one "hero" element per view, tabular numerics, no drop shadows beyond a whisper on floating popovers.**

## What changes

Design system only. No component moves, no route changes, no data changes.

### 1. Design tokens (`src/features/shift-dashboard/styles/dashboard.css`)
Rewrite the `.shift-dash` scope:
- Canvas `#F7F7F5` (warm off-white, Kanto-inspired) instead of cool blue-gray.
- Surface `#FFFFFF`, surface-2 `#F1F1EE`, stroke `#ECEBE6` / strong `#DCDBD4`.
- Ink scale: `#111111 / #3A3A38 / #7A7A75`.
- Primary stays `#FF3737`; add `--sd-primary-hero` for the one filled hero card per section.
- Retire the pulse-glow + breathe animations on KPIs; replace with a single accent live-dot only where a metric is actually live.
- Radius scale: 24 (hero), 20 (card), 14 (chip/input), 12 (button). Border everywhere `1px solid stroke`.
- Typography: Vazirmatn 400/500/600/700; headline uses `-0.03em` tracking at 28–32px; body 13px.

### 2. Shell (`ShiftDashboard.tsx`)
Same nav items, same order. Visual only:
- Sidebar: transparent (no card), grouped labels ("داشبورد" / "مدیریت" / "حساب"), active item = filled pill in `--sd-surface-2` with a 3px right accent bar, icons monoline.
- Top bar: flatten — brand-less on desktop, just plan tag + agent toggle on the right, avatar cluster on the left. Remove backdrop-blur border in favor of a hairline.
- Store card at sidebar bottom becomes a compact row (store name + plan chip), no filled background.

### 3. Section header pattern (all six sections)
New reusable header block:
- Small eyebrow label (section name, muted).
- Oversized Farsi headline (28–32px).
- One-line subtitle in muted ink.
- Right-aligned utility cluster (timeframe chips / actions).
Replace ad-hoc titles currently inside `PerformanceHome`, `AgentControl`, `VisualCustomization`, `Settings`, `PlansBilling`, `Support`.

### 4. KpiCard redesign
- Default variant: white, hairline border, label + big tabular number + delta chip on top-right, tiny sparkline strip at the bottom (uses existing trend series when available, else omitted).
- `hero` variant (one per section, Fleetly-style): filled `--sd-primary-hero` background, white ink, same layout. On `PerformanceHome` this is "درآمد مساعدت‌شده".
- Retire icon tile; move icon to a subtle monoline glyph next to the label.
- Remove `sd-breathe`; live state = single 6px accent dot next to the label.

### 5. Charts (`TrendChart`, `IntentCloud`)
- Chart card gets an editorial title + right-side legend chips, dashed grid, rounded line caps, single primary color for series A and neutral ink-2 for series B.
- Custom tooltip: white card, hairline border, tabular Farsi numerics, date on top.
- IntentCloud → convert to weighted chip grid (chip size scales with volume) instead of raw cloud.

### 6. Signals row on Home
- Failed matches: list becomes a two-column row per item (query on the right, count chip on the left) with hover state = row tint.
- Dropoffs: replace flat bars with segmented 10-step meters (Kanto/Fleetly cadence).
- Top products: table gets zebra removed, hairline dividers only, product name in ink, numerics in `sd-num`, CTR pill uses success/warn/danger by threshold.

### 7. Pro locking
Keep gating logic. Visually:
- Locked cards render at 100% opacity but with a subtle diagonal watermark stripe and a centered "Shift Pro" pill + short reason line. No grayscale. Consistent across every locked block.
- `MissingChip` becomes an inline banner styled like Kanto's floating insight card (soft tinted background, arrow icon, one CTA "ارتقا به Pro").

### 8. Agent Control
- Status toggle becomes a 3-state segmented control (فعال / متوقف / آفلاین) at the top of the section, matching CreditTB's chip tabs.
- Guardrails list: each row = title + one-line description on the right, iOS-style switch on the left, hairline dividers, section grouping headers.
- Persona/prompt editor card gets a monospace-ish (but still Vazirmatn) editor with soft inner surface `--sd-surface-2`.

### 9. Visual Customization
- Two-column layout: left = form fields (agent name, greeting, colors, avatar), right = live preview card that mirrors the storefront chat bubble using current tokens.
- Color picker rows: swatch + hex input + reset, all inline, hairline separated.

### 10. Settings (inline sub-tabs already exist)
- Sub-tabs styled as chip pills with a filled active state (CreditTB pattern), not underline.
- Form fields: floating label style, 14px radius, 1px stroke, focus ring `--sd-primary / .15`.
- Section grouping via `SectionTitle` reuse for each sub-tab.

### 11. Plans & Billing (inline sub-tabs)
- Plan tab: two cards side by side (Lite / Pro). Current plan card = hero variant (filled primary), other = white. Feature list uses check/lock glyphs. Single CTA per card.
- Invoices tab: table restyled to match Home top-products table.
- Payment method tab: single card with saved method row + "افزودن روش پرداخت" ghost button.

### 12. Support
- Left column (tickets): list rows with status chip on the left, title + id/updated on the right, hairline dividers, hover tint.
- Right column (new ticket): floating-label inputs, primary button full width, helper text under.
- Status chips get a consistent shape: soft tint background, colored dot, label — matching Fleetly's status tags.

### 13. Micro-interactions
- Replace `sd-breathe` and `sd-pulse-glow` everywhere.
- Add a single `sd-hover-raise`: `transform: translateY(-1px)` + border darkens to `stroke-strong`. Applied on cards that are clickable only.
- Keep `sd-anim-in` fade-up for section mount.
- Buttons: 150ms ease; primary hover = `--sd-primary-ink`; ghost hover = `--sd-surface-2`.

## Files touched (UI only)

```
src/features/shift-dashboard/styles/dashboard.css      (rewrite tokens + utilities)
src/features/shift-dashboard/ShiftDashboard.tsx        (shell chrome)
src/features/shift-dashboard/shared/KpiCard.tsx        (default + hero variant)
src/features/shift-dashboard/shared/DeltaChip.tsx      (restyle)
src/features/shift-dashboard/shared/PlanTag.tsx        (restyle)
src/features/shift-dashboard/shared/AgentStatusToggle.tsx (segmented control)
src/features/shift-dashboard/shared/MissingChip.tsx    (insight-banner style)
src/features/shift-dashboard/shared/ProLock.tsx        (watermark stripe)
src/features/shift-dashboard/shared/TrendChart.tsx     (visual only)
src/features/shift-dashboard/shared/IntentCloud.tsx    (weighted chip grid)
src/features/shift-dashboard/shared/SectionTabs.tsx    (pill tabs)
src/features/shift-dashboard/shared/IndexedProductsBar.tsx (restyle)
src/features/shift-dashboard/shared/Switch.tsx         (iOS style)
src/features/shift-dashboard/sections/PerformanceHome.tsx
src/features/shift-dashboard/sections/AgentControl.tsx
src/features/shift-dashboard/sections/VisualCustomization.tsx
src/features/shift-dashboard/sections/Settings.tsx
src/features/shift-dashboard/sections/PlansBilling.tsx
src/features/shift-dashboard/sections/Support.tsx
+ new: src/features/shift-dashboard/shared/SectionHeader.tsx
```

No changes to routes, data mocks, context, or `plan` gating logic.

## Explicitly NOT changing
- NAV items, section order, or which section owns which feature.
- Any tab labels or sub-tab structure inside sections.
- KPI selection or chart data on Home.
- Pro/Lite gating rules — only how a locked card looks.
- Any backend or edge functions.

## Verification
After build:
1. Playwright screenshot `/shift/dash/lite` and `/shift/dash/pro` at 1280 and 390 widths; visually confirm parity of sections and Pro-lock differences.
2. Check RTL alignment on every section (no `flex-row-reverse` regressions).
3. Confirm Vazirmatn is applied, Farsi digits render in KPIs and tables.
