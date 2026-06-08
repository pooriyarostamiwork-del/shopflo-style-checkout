# RTL Refactor, Shared Sheet Wrapper & Chart Tooltips — Mobile Vendor Dashboard

Scope: **frontend only**, restricted to `src/features/vendor-dashboard/**`, `src/pages/MobileVendorDashboard.tsx`, and the scoped `.vendor-dash` block in `src/index.css`. No backend, no other routes, no business logic changes. Home screen is the RTL reference.

---

## 1. Global RTL Foundations

### 1a. Root attributes
- `src/pages/MobileVendorDashboard.tsx`: wrap the shell with `<div dir="rtl" lang="fa">` at the page level (today only the shell has `dir="rtl"`; we move it up and add `lang="fa"`).
- `MobileVendorShell.tsx`: keep `vendor-dash` class, remove redundant `dir="rtl"` from the inner wrapper now that root sets it.

### 1b. Logical-property CSS utilities (scoped under `.vendor-dash` in `index.css`)
Add small helpers so we never reach for `left/right`/`ml-/mr-`/`pl-/pr-` again:
- `.vd-pad-x { padding-inline: 1rem; }`
- `.vd-ms-auto { margin-inline-start: auto; }`
- `.vd-me-auto { margin-inline-end: auto; }`
- `.vd-border-s { border-inline-start: 1px solid hsl(var(--vd-stroke)); }`
- `.vd-border-e { border-inline-end: 1px solid hsl(var(--vd-stroke)); }`
- `.vd-num { unicode-bidi: isolate; font-variant-numeric: tabular-nums; }`

Also add a global rule inside `.vendor-dash`:
```css
.vendor-dash, .vendor-dash * { text-align: start; }
.vendor-dash input, .vendor-dash textarea { text-align: start; }
```
This removes the need for ad-hoc `text-right` on every element.

### 1c. Replace LTR-biased Tailwind classes
Sweep the vendor-dashboard tree and replace:
- `left-*` → `start-*` (Tailwind v3 logical equivalents) or `inset-inline-start`
- `right-*` → `end-*`
- `ml-*` → `ms-*`, `mr-*` → `me-*`
- `pl-*` → `ps-*`, `pr-*` → `pe-*`
- `border-l` → `border-s`, `border-r` → `border-e`
- Remove redundant `text-right` once `.vendor-dash` defaults `text-align: start`.
- Remove ad-hoc `flex-row-reverse` (rely on `dir="rtl"`).

Files swept (no logic changes): `MobileVendorShell.tsx`, `MobileVendorHome.tsx`, `MobileVendorFinance.tsx`, `MobileVendorSettings.tsx`, `WithdrawSheet.tsx`, all `shared/*.tsx`.

---

## 2. Finance Screen (مالی)

### 2a. Sub-tab segmented control (`Tabs`)
- Reorder JSX so DOM order matches Persian reading order **and** `grid-cols-3` lays them out right→left under `dir="rtl"`:
  DOM order: `عملکرد` → `تسویه` → `تنظیمات`.
- Active pill animation: rely on `data-[state=active]` background; no `left/right` positioning — already RTL-safe.

### 2b. `TimeframeSelector`
Currently uses an absolutely positioned indicator with `right: calc(...)`. Under `dir="rtl"` this is OK but reading order is wrong because options array is `[day, week, month]` which renders right→left as روز | هفته | ماه. We want **روز | هفته | ماه** to read in Persian order (روز first/right). That's already correct under RTL. The user complaint "هفته | روز" appearing reversed is because the absolutely positioned indicator uses `right` while the buttons flow naturally — fix by:
- Replacing `right: calc(...)` with `inset-inline-start: calc(...)` and computing `idx` from the right edge, OR simpler: drop the absolute indicator and use `data-[state]`-style background on the active `<button>` directly. We'll take the simpler approach: render buttons with `bg-[hsl(var(--vd-accent))] text-white` when active, transition `background-color`. Removes all `left/right` math.

### 2c. `SectionTitle` accent bar
Currently the `<span class="w-1 h-4 …">` sits before the text via flex; under RTL it correctly appears on the right. Verify and keep — no change needed beyond removing any `ml-*`.

### 2d. KPI cards
- `KpiCard`: header row uses `justify-between` — label on the right, delta chip on the left under RTL. Good.
- Add `.vd-num` to the value `<bdi>` for tabular numerals.
- Ensure `delta` chip icon (`ArrowUp/Down`) is not mirrored.

### 2e. Revenue chart RTL
`RevenueSparkChart.tsx`:
- Already passes `reversed` on `XAxis` and `direction: ltr` on the wrapper (recharts requires LTR internally). Keep wrapper LTR but ensure tooltip content is RTL (already set).
- Improve tooltip: show **Persian date label + formatted toman value** on two lines, right-aligned, with a colored dot matching the series. Add `cursor` dashed vertical line for better hover affordance.
- Add `activeDot` ring with accent halo (already partly there).
- Ensure dates on X-axis render in Persian digits (already via `trendLabelsByRange`).

### 2f. Payouts sub-tab
- `HeroBalanceCard`: confirm CTA icon flows correctly; replace any `ArrowLeft` with `ArrowRight` (visually points "forward" in RTL) or use an icon-free CTA.
- Pending/withdrawn KPI grid: same KPI card fixes apply.
- `WithdrawalHistoryList` rows: amounts wrapped in `.vd-num`, status pills on the inline-start side.

### 2g. Finance Settings sub-tab
- `MerchantTypeToggle`: audit and align with `TimeframeSelector` simplification (no absolute indicator math).
- Accordion triggers: remove `text-right`, rely on `.vendor-dash` default; chevron stays on inline-end (Radix puts it after content — under RTL it ends up on the left automatically). Verify.
- All `FormField`s for IBAN/account number/mobile: keep `dir="ltr"` + `text-left` (these are intentionally LTR data).

---

## 3. Settings Screen (تنظیمات)

### 3a. Sub-tab nav
Same fix as Finance: DOM order `پروفایل → بازگشت → حساب`, drop absolute indicators.

### 3b. Profile — business info card
- Logo row: remove `flex items-center gap-3` with implicit ordering; restructure as:
  - Inline-start (right under RTL): logo preview + label "لوگوی کسب‌وکار".
  - Inline-end (left): "بارگذاری" button + helper text.
- Helper texts: drop manual `dir="rtl"`, inherit from root.

### 3c. Form fields
- `FormField`: 
  - Default `dir` to unset (inherit RTL). Only pass `dir="ltr"` for IBAN/phone/website/email.
  - Label row already `justify-between`: label on the right, optional `rightSlot` on the left. Good.
  - Textarea: ensure `min-h-[80px]` and `resize-none`; cursor inherits RTL.
  - Character counter (`helper`): move to align inline-end (under the field, left side) so it doesn't compete with error message which is inline-start.

### 3d. Select components
- `Select` (shadcn/Radix): chevron is rendered by `SelectTrigger`. Under `dir="rtl"` Radix places it on the inline-end (left) automatically. Verify by adding `dir="rtl"` to `SelectContent` (Radix Portal sometimes loses dir context).
- Add `dir="rtl"` on each `<Select>` root in Finance + Settings to be safe.
- `SelectItem`: text-align inherits, fine.

### 3e. Returns policy
- `PolicyRadioGroup`: ensure label row is right-aligned, radio chips flow right→left naturally with `flex gap-2` under RTL. Remove any explicit `text-right`/`flex-row-reverse`.

### 3f. Account list
- `SettingsListRow`: label on the right, value + chevron on the left. Use `ChevronLeft` icon (in RTL it visually points "forward into the row") — verify with reference Home behavior. Mask values wrapped in `<bdi className="vd-num">`.

### 3g. Account change sheets (Mobile, Email, Password)
Will be migrated to the shared sheet wrapper (section 4).

---

## 4. Shared Bottom-Sheet Wrapper

Create `src/features/vendor-dashboard/shared/VendorBottomSheet.tsx`:

```tsx
interface VendorBottomSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: string; // default "92vh"
}
```
Internally:
- Uses `Sheet` + `SheetPortal` + `SheetOverlay` (bg-black/50, z-50).
- `SheetPrimitive.Content` with: rounded-t-3xl, border-t stroke, solid `bg-white`, `vendor-dash` class, `dir="rtl"`, shadow `0 -8px 32px rgba(0,0,0,0.18)`, safe-area bottom padding, slide-in/out animations.
- Drag handle bar.
- Header row: title (right) + close `X` button (left) using `vd-interactive`.
- Scrollable body wrapper with `overflow-y-auto`, `maxHeight` (default 70vh inner so handle/header stay fixed).

Refactor consumers to drop ~25 lines of duplicate chrome each:
- `WithdrawSheet.tsx`: keep stage state + body content; wrap in `<VendorBottomSheet title="برداشت وجه">`.
- `ChangeMobileSheet`, `ChangeEmailSheet`, `ChangePasswordSheet` in `MobileVendorSettings.tsx`: same migration.

Net effect: identical visual chrome everywhere; single place to tweak padding, overlay opacity, animations.

---

## 5. Chart Tooltips (Revenue + Trend)

`RevenueSparkChart.tsx` enhancements:
- Custom `<Tooltip content={...} />` renderer (small inline component) that returns:
  ```
  ┌──────────────────┐
  │ • روز ۳شنبه       │   ← label, Persian, right-aligned
  │ ۱۲٬۵۰۰٬۰۰۰ تومان │   ← value with .vd-num, accent color
  └──────────────────┘
  ```
- Background `hsl(var(--vd-surface-ink))` text white, border subtle, rounded-xl, shadow-md.
- Add `cursor={{ stroke: "hsl(var(--vd-accent))", strokeWidth: 1, strokeDasharray: "4 4", strokeOpacity: 0.5 }}`.
- `activeDot` r=6 with white stroke ring.
- For tap-on-mobile: recharts already triggers tooltip on touch; ensure `isAnimationActive={false}` on tooltip for snappy feel.
- Apply uniformly to both the Home weekly trend chart and Finance performance chart (same component).

---

## 6. Bottom Navigation
- `MobileVendorShell` bottom nav: order in DOM `خانه → مالی → تنظیمات`; under `grid-cols-3` RTL this places خانه on the right. Confirm visually; keep DOM order intentional (do not mirror).
- Active indicator (`inset-x-6` top bar) is symmetric, no change needed.

---

## 7. Files Touched

**Modified**
- `src/pages/MobileVendorDashboard.tsx` — add `dir="rtl" lang="fa"` root.
- `src/index.css` — add `.vd-num`, logical-property utilities, default `text-align: start` inside `.vendor-dash`.
- `src/features/vendor-dashboard/mobile/MobileVendorShell.tsx` — sweep classes, confirm tab order.
- `src/features/vendor-dashboard/mobile/MobileVendorHome.tsx` — class sweep, `.vd-num` on numbers.
- `src/features/vendor-dashboard/mobile/MobileVendorFinance.tsx` — tab DOM order, sub-section cleanup, Select `dir="rtl"`.
- `src/features/vendor-dashboard/mobile/MobileVendorSettings.tsx` — tab DOM order, logo row restructure, sheets migrated to wrapper.
- `src/features/vendor-dashboard/mobile/WithdrawSheet.tsx` — migrate to `VendorBottomSheet`.
- `src/features/vendor-dashboard/shared/TimeframeSelector.tsx` — drop absolute indicator math.
- `src/features/vendor-dashboard/shared/MerchantTypeToggle.tsx` — same simplification.
- `src/features/vendor-dashboard/shared/SectionTitle.tsx` — drop residual `ml/mr`.
- `src/features/vendor-dashboard/shared/KpiCard.tsx` — `.vd-num`.
- `src/features/vendor-dashboard/shared/HeroBalanceCard.tsx` — RTL sweep, icon direction.
- `src/features/vendor-dashboard/shared/SettingsListRow.tsx` — chevron direction, `.vd-num`.
- `src/features/vendor-dashboard/shared/FormField.tsx` — default dir inherit, helper alignment.
- `src/features/vendor-dashboard/shared/PolicyRadioGroup.tsx` — RTL sweep.
- `src/features/vendor-dashboard/shared/WithdrawalHistoryList.tsx` — RTL sweep, `.vd-num`.
- `src/features/vendor-dashboard/shared/RevenueSparkChart.tsx` — custom tooltip, cursor line, activeDot ring.

**Created**
- `src/features/vendor-dashboard/shared/VendorBottomSheet.tsx` — shared sheet wrapper.

---

## Out of Scope
- Any backend code, edge functions, DB, schemas.
- Desktop vendor dashboard or other routes (`/farsi`, `/gptcommerce` chat, etc.).
- Mock data structure / business logic changes.
- Translation strings beyond layout fixes.
