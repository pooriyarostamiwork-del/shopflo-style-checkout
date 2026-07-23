
# Shift Merchant Dashboard — Front-end plan

Two routes, one shared shell, plan-aware feature gating. All data is mocked in TS files (no backend). Farsi RTL, Vazirmatn, Persian digits, primary `#FF3737` on a light palette.

## Routes & shell

- `/shift/dash/lite` → `<ShiftDashboard plan="lite" />`
- `/shift/dash/pro`  → `<ShiftDashboard plan="pro" />`
- Registered in `src/App.tsx`. Wrapped in `LanguageProvider` (fa) + `dir="rtl"` container, scoped `.shift-dash` class so tokens don't leak into `/shift` storefront.
- Desktop: right-anchored sidebar (RTL) + top strip (plan tag + agent status). Mobile (<768px): collapsible drawer + bottom safe padding. Same components, responsive.

## Design system (scoped `.shift-dash`)

- Font: Vazirmatn (already loaded in project).
- Tokens in `src/features/shift-dashboard/styles/dashboard.css`:
  - `--sd-primary: 0 100% 61%` (#FF3737), `--sd-primary-soft`, `--sd-bg: 0 0% 99%`, `--sd-surface: 0 0% 100%`, `--sd-ink: 220 15% 12%`, `--sd-muted: 220 10% 45%`, `--sd-stroke: 220 15% 92%`, `--sd-success`, `--sd-warning`.
  - Radii 16–24px, 1px strokes, soft shadow only on hero/KPI cards, `.sd-num { font-variant-numeric: tabular-nums }`, Persian digit helper reused from `toPersianNumber`.
- No hard-coded hex in components — Tailwind arbitrary values reference `hsl(var(--sd-*))`.

## File structure

```text
src/features/shift-dashboard/
  ShiftDashboard.tsx                 (shell: sidebar + routed section)
  context/DashboardContext.tsx       (plan, activeSection, agent status, mock mutations)
  data/mockDashboard.ts              (KPIs, trends, signals, intents, guardrails, products, plans, billing, team)
  styles/dashboard.css
  shared/
    PlanTag.tsx                      (pulsing pill: Lite / Pro)
    AgentStatusToggle.tsx            (live dot + one-click Active/Paused/Offline)
    KpiCard.tsx                      (value, delta chip, optional live-pulse)
    TrendChart.tsx                   (recharts, 7d/30d/1y toggle)
    IntentCloud.tsx                  (tag cloud, size = frequency)
    IndexedProductsBar.tsx           (segmented ring: Indexed / AI-eligible / Errors)
    GuardrailCard.tsx                (toggle card, lockable)
    ProLock.tsx                      (grayscale + lock badge + upgrade CTA)
    MissingChip.tsx                  ("What you're missing" upgrade nudge)
    SectionTabs.tsx                  (in-section tab bar)
    Sidebar.tsx / TopBar.tsx / MobileNav.tsx
  sections/
    PerformanceHome.tsx
    AgentControl.tsx                 (tabs: Persona / Guardrails / Automation / Campaigns)
    VisualCustomization.tsx          (tabs: Branding / Messages / Theme / Loading)
    Settings.tsx                     (tabs: Team / Integrations / Install)
    PlansBilling.tsx                 (tabs: AI Conversations / Billing / History)
    Support.tsx
  pages/ShiftDashLite.tsx
  pages/ShiftDashPro.tsx
```

## Sections (with in-section tabs where noted)

1. **Performance & Home** — banner, 4 KPI cards (Assisted Revenue, Customers Helped w/ live pulse, Product Card Clicks, Conv→Purchase Rate), two-column charts (Revenue vs Customers Helped, Customers Helped vs Conversion) with 7d/30d/1y selector, Signals block (Intent cloud, Failed matches list, Drop-off reasons — Shipping/Fees rows Pro-locked, Top recommended products table with rec#/clicks/CTR). Lite shows a `MissingChip` ("Checkout Funnel — upgrade to Pro").
2. **Agent Control** — Tabs: **Persona & Tone** (name, preset personas, tone slider) · **Guardrails** (toggle cards; Pro-only ones locked on Lite) · **Automation** (Auto-apply coupons — Pro, Auto-inform offers, Active/Inactive) · **Campaigns** (Featured products/promotions, Seasonal preset chips: Nowruz/Yalda/Black Friday + custom).
3. **Visual Customization** — Tabs: **Branding** (Logo upload preview, Theme palette picker, Footer) · **Messages** (Home tagline + Chat tagline w/ per-field active toggle, Header message, Welcome message, Quick messages editor, Home placeholder, Chat placeholder) · **Loading** (placeholder text + animation picker with previews).
4. **Settings** — Tabs: **Team** (members + role dropdowns; RBAC Pro-only) · **Integrations & Catalog** (WooCommerce/API key fields, sync status card, last sync, `IndexedProductsBar`, errors list) · **Install** (copyable embed snippet).
5. **Plans, Billing & AI Usage** — Tabs: **AI Conversations** (4 model plan cards, per-plan conversation slider with tiered discount preview, Current plan + remaining conversations, Queued plan, Purchase history) · **Billing** (current Shift plan + Upgrade CTA, invoice history w/ price) · **History** (unified log).
6. **Support & Ticketing** — Ticket list + new-ticket form (mocked).

## Plan gating

- `DashboardContext.plan` drives visibility. Lite excludes: Auto-apply coupons, Shipping/Fees drop-off rows, Checkout Funnel widget, Team RBAC beyond owner, some guardrails.
- Locked Pro items render inside `<ProLock>` (grayscale, lock icon, "ارتقا به Shift Pro" CTA) instead of being hidden — reinforces upsell.
- Global `<PlanTag>` on top bar pulses; `<AgentStatusToggle>` sits beside it.

## Mock data & interactivity

- Everything in `data/mockDashboard.ts`; edits go through `DashboardContext` reducer to local state only (no persistence, no API). Forms use `react-hook-form` + inline validation but "save" only toasts + updates in-memory state.
- Charts via existing `recharts` dependency.
- Live-pulse and PlanTag pulse via CSS keyframes in `dashboard.css`.

## Technical notes

- Reuse `toPersianNumber` from `src/i18n/LanguageContext.tsx` and existing `Toaster`.
- No changes to `/shift` storefront, no backend, no edge functions, no DB migrations.
- Only new deps if needed: none — recharts, react-hook-form, zod, lucide-react already present.
- Accessibility: keyboard-focusable toggles, `aria-pressed`, RTL-safe icon mirroring where needed.

## Out of scope (later)

- Real backend wiring, auth/roles enforcement, real billing, WooCommerce sync, embed script generation, ticket backend.
