## Vendor dashboard polish — RTL, modal, header, charts

Frontend-only, scoped to `src/features/vendor-dashboard/**`, `src/pages/MobileVendorDashboard.tsx`, and `src/index.css` (`.vendor-dash` scope only). No backend changes.

---

### 1. Delete the sticky header entirely

`MobileVendorShell.tsx`:
- Remove the entire `<header>` block (store icon "ن", store name, "داشبورد فروشنده" subtitle).
- Remove unused `useVendorDashboard` destructure of `vendor` if no longer needed elsewhere in shell.
- Keep the dev "شبیه‌سازی تأیید ادمین" panel and bottom nav.

`MobileVendorHome.tsx`:
- Promote the greeting block ("چهارشنبه، ۱۴ خرداد" + "سلام، فروشگاه نمونه 👋") to be the first thing in the page so users still get context now that the header is gone. Keep same styling.

`MobileVendorFinance.tsx` and `MobileVendorSettings.tsx`:
- Add a small page header row at top with just the store/page title so layout doesn't feel decapitated. Pattern:
  ```
  <div className="pt-4 pb-1">
    <div className="text-[11px] text-muted-foreground">داشبورد فروشنده</div>
    <div className="text-base font-semibold">{مالی | تنظیمات}</div>
  </div>
  ```

---

### 2. RTL fixes — section by section

The root cause across the dashboard: relying on `dir="rtl"` is correct, but several components were authored as if LTR (label/value swapped, `flex-row-reverse`, `text-left`, periods at the wrong end, latin punctuation around Farsi). Audit & fixes:

#### 2.1 Finance → sub-tabs (`MobileVendorFinance.tsx`)
- The visual order in image 2 shows `[عملکرد][تسویه][تنظیمات]` reading **left → right**, but in RTL the natural reading is **right → left**. Reorder `TabsTrigger` JSX to `تنظیمات → تسویه → عملکرد` so the visually-rightmost (first read) tab is "عملکرد". Same fix on Settings tabs (`پروفایل | بازگشت | حساب` should be reordered so `پروفایل` is the rightmost).
- Indicator pill: shadcn `Tabs` works in RTL via CSS grid; just reorder JSX. Do not use `flex-row-reverse`.

#### 2.2 Finance → Performance KPI grid (image 2 issue)
- "درآمد" card shows the delta chip `↑ ۱۲٪` on the **left** of the label "درآمد" which sits on top-right. That's actually correct RTL — but the order inside `KpiCard.tsx` puts label first and `DeltaChip` second inside a `flex justify-between`, which in RTL places delta on the left. That's fine. **No change for delta placement.**
- BUT: the value "تومان ۱۲٬۵۰۰٬۰۰۰" in image 2 reads visually as `تومان` then number, which is the wrong logical Farsi order — `formatToman` returns `<digits> تومان` (logical), but because of bidi mixed direction inside an RTL container the unit jumps. **Wrap the numeric portion in an isolated `<bdi>` span and keep "تومان" outside it**, so output stays "۱۲٬۵۰۰٬۰۰۰ تومان" reading right-to-left visually:
  ```tsx
  <span><bdi>{toPersianDigits(grouped)}</bdi>{' '}تومان</span>
  ```
  Apply in `formatToman` callers that render Farsi context (KpiCard value, HeroBalanceCard, withdrawal rows). Update `formatToman` to optionally return a React node via a new `<TomanAmount value={n} />` shared component to avoid string concatenation pitfalls.

#### 2.3 Finance → Performance section header (image 2)
- "مرور درآمد" with eyebrow "عملکرد" — eyebrow is rendered above title; eyebrow `text-[10px] uppercase tracking-widest` for English looks weird for Farsi. Change `SectionTitle` to drop `uppercase` and reduce `tracking-widest` to `tracking-wide` only when the eyebrow contains Farsi (always for vendor dash). Remove `uppercase` for vendor dash.
- The accent bar in `SectionTitle` sits left of the title in current LTR-authored markup. In RTL with `flex items-center gap-2` it naturally goes right of the title text (correct). Verify visually after font change. No code change beyond eyebrow above.

#### 2.4 Finance → Performance TimeframeSelector row
- Header row uses `flex items-center justify-between` with `SectionTitle` then `TimeframeSelector`. In RTL the selector ends up on the **left**, title on the **right** — correct. But the title block has `mb-0` on `SectionTitle` while eyebrow still pushes height; align with `items-end` so they share baseline.

#### 2.5 Finance → Payouts: HeroBalanceCard
- "موجودی قابل برداشت" row has `<Wallet />` icon then label using `flex items-center gap-2` — in RTL icon ends up on the right which is fine for a leading icon. Keep.
- Pending pill: ensure number uses `<bdi>` wrapper (currently `unicodeBidi: isolate` style which works; standardize to `<bdi>`).
- The "برداشت وجه ←" button uses `<ArrowLeft />` next to the label. In RTL a "forward" arrow should point **left** (since reading is right-to-left, forward = left), so `ArrowLeft` is correct semantically. Keep.

#### 2.6 Finance → Payouts: 2-col KPI ("در انتظار", "مجموع برداشت")
- Same `<bdi>` fix from 2.2 applies to amounts.

#### 2.7 Finance → Settings (Accordion forms)
- `AccordionTrigger` already has `text-right`. Verify chevron (lucide) flips correctly — shadcn's accordion chevron is positioned via `data-[state=open]:rotate-180` and sits at the **end** of the row. In RTL "end" is left. Acceptable. No code change.
- `Select` (نام بانک, نوع کسب‌وکار): currently shows the dropdown caret on the right (image 3 shows it appears at left of "خرده‌فروشی"). In shadcn `SelectTrigger` uses `flex items-center justify-between`, so in RTL the caret naturally moves to the left — that's the right place visually. But the inline `<ChevronDown />` inside the trigger doesn't mirror; leave as-is.
- Currency/date inputs: ensure `dir="rtl"` is inherited (no `dir="ltr"` overrides in vendor dash inputs except OTP grid).
- Form labels currently above field — correct.

#### 2.8 Settings → Profile (image 3 fixes)
- Card header row: `<div>اطلاعات کسب‌وکار</div> {PendingPill}` using `flex justify-between`. In RTL the title moves right, pill moves left — correct.
- Logo upload row: `<div className="flex items-center gap-3">` with logo box first, then upload button + helper. In RTL the logo ends up on the **right** (good), but image 3 shows the logo on the left and the button "بارگذاری" on the right — meaning the row is **double-reversed** because `flex-row-reverse` is being applied somewhere or because shadcn `Button` default is LTR. Fix: explicitly remove any `flex-row-reverse`; use plain `flex items-center gap-3` and rely on `dir="rtl"` inheritance.
- The helper text "تأیید توسط ادمین لازم است." in image 3 shows the period on the **left** before the sentence — classic LTR fallback. The text node needs `dir="rtl"` ancestor (it has one) AND the `<p>` must not be inside an LTR-forced parent. Confirm and add explicit `dir="rtl"` to the `<p className="text-[11px] text-muted-foreground mt-1" dir="rtl">…</p>` to lock it. Apply same explicit `dir="rtl"` to every `<p className="text-[11px] ...">` in dashboard sheets/forms where mixed punctuation appears.
- Description textarea counter "۴۲/۲۵۰" — wrap in `<bdi dir="ltr">{count}/{max}</bdi>` so the slash doesn't flip.
- "تلفن پشتیبانی" value `02112345678` shows in image 3 with leading `o` (logical `0`) at right — confirm number renders inside `dir="ltr"` `<bdi>`. Add `inputClassName="text-left"` + `dir="ltr"` to phone/IBAN/website/email inputs so digits flow LTR while the label remains RTL.
  - Apply to: supportPhone, website, mobile (account), iban, accountNumber, email.

#### 2.9 Settings → Returns
- Already uses `PolicyRadioGroup`. Audit it (`code--view`) and ensure radio options stack with label on the right of the bullet in RTL. Likely needs no change but verify; add `text-right` to option labels.

#### 2.10 Settings → Account (list rows)
- `SettingsListRow` audit: ensure `flex items-center justify-between` not `flex-row-reverse`. Label on right, value+chevron on left. Confirm chevron used is `ChevronLeft` (forward in RTL) — if currently `ChevronRight` swap to `ChevronLeft`.
- Masked mobile and masked email: render value inside `<bdi dir="ltr">` so they don't fragment.

#### 2.11 Bottom nav
- Image 1 shows tabs visually `[تنظیمات][مالی][خانه]` left→right. The natural-reading-first tab in RTL is the rightmost — currently "خانه". Order in array is `[home, finance, settings]` rendered as `grid-cols-3` which in RTL grid auto-reverses → "خانه" ends rightmost. Correct, keep.

#### 2.12 Global RTL CSS guardrails
- Add to `.vendor-dash` scope in `index.css`:
  ```css
  .vendor-dash { unicode-bidi: isolate; }
  .vendor-dash .ltr-num { direction: ltr; unicode-bidi: isolate; display: inline-block; }
  ```
- Replace ad-hoc `style={{ unicodeBidi: 'isolate' }}` usages with `<bdi>` element or `.ltr-num` class for consistency.

---

### 3. Modal/sheet background fix (image 4)

Image 4 shows the WithdrawSheet rendering on top of the page with no dimming overlay and the sheet itself appears semi-transparent (content from underneath bleeds through).

Root cause: shadcn `SheetOverlay` uses `bg-black/80` but is being layered behind the sheet content visually because the dashboard page has its own `bg-[hsl(var(--vd-surface-2))]` and the sheet `bg-[hsl(var(--vd-surface))]` — both light, so no contrast. Also the overlay z-index may be conflicting with sticky/fixed nav.

Fixes (apply to all four sheets: `WithdrawSheet`, `ChangeMobileSheet`, `ChangeEmailSheet`, `ChangePasswordSheet`):
- Wrap each `<SheetContent>` so the overlay actually shows: do **not** override overlay styles via className on content. Confirm shadcn `SheetOverlay` z-50 is above bottom nav (nav is z-30 — good).
- Add explicit solid background and shadow to content:
  ```
  bg-background  (or bg-white)  + border-t + shadow-2xl + isolate
  ```
  Switch from `bg-[hsl(var(--vd-surface))]` (which can be theme-light and identical to page) to `bg-white` for guaranteed contrast in this scoped section.
- Add an explicit additional overlay div inside the page only if needed; preferred fix is to ensure shadcn's `SheetOverlay` isn't being suppressed by parent `transform` (it uses `position: fixed` on the root, so any ancestor with `transform`/`filter`/`will-change` would break fixed positioning). Inspect `MobileVendorShell` root — it currently has no transform. The dashboard root has `min-h-screen flex flex-col` — safe. The bottom nav uses `fixed` which is fine.
- Hard guarantee: in `.vendor-dash` scoped CSS, add:
  ```css
  .vendor-dash [data-radix-portal] [data-state="open"][data-side="bottom"] { background: hsl(var(--vd-surface)); }
  ```
  Actually portals render at body root, **not** inside `.vendor-dash`, so the scope won't match. Instead: pass `className="bg-[hsl(var(--vd-surface))] !opacity-100"` and remove any parent-scoped CSS attempts. Add inline `style={{ background: 'hsl(var(--vd-surface))' }}` as a belt-and-braces fix.
- Add a manually-rendered overlay div via shadcn's exported `SheetOverlay` if the default isn't visible — replace plain `<SheetContent>` usage with the explicit portal pattern:
  ```
  <SheetPortal>
    <SheetOverlay className="bg-black/50" />
    <SheetPrimitive.Content …>…</SheetPrimitive.Content>
  </SheetPortal>
  ```
  to remove any chance of overlay being skipped. Use shadcn primitives.

Sheet content polish:
- Add `max-h-[92vh] overflow-y-auto` consistently.
- Drag handle bar at top: `mx-auto w-10 h-1.5 rounded-full bg-[hsl(var(--vd-stroke))] mt-2 mb-1`.
- Close X: ensure positioned `top-3 left-3` in RTL (it currently auto-renders `right-4 top-4` from shadcn — that ends up on the right which in RTL is the leading side; user is used to close on opposite of where the sheet handles open. Override to `left-4` for RTL).

---

### 4. Charts — show data points + dates (image 1 + 2)

`RevenueSparkChart.tsx` upgrade:
- Add a `labels?: string[]` prop with date strings (Farsi, e.g. ["۱ خرداد", "۸ خرداد", …]).
- Switch from a pure sparkline to a `LineChart` (still recharts) with:
  - `XAxis dataKey="label"` showing tick labels (`fontSize: 10`, `tick: { fill: 'hsl(var(--muted-foreground))' }`), no axis line.
  - `YAxis hide={true}` (keep clean look) — values still visible on dots/tooltip.
  - `<Line>` with `dot={{ r: 3, fill: 'hsl(var(--vd-accent))', stroke: 'white', strokeWidth: 1.5 }}` and `activeDot={{ r: 5 }}`.
  - Keep the gradient `<Area>` underneath for visual depth, layered as second series.
  - `<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--vd-stroke))" />` light horizontal grid.
- Data shape:
  ```ts
  series = data.map((v, i) => ({ label: labels?.[i] ?? toPersianDigits(i+1), v }));
  ```
- The chart container stays `direction: ltr` (recharts requires it) but tick labels are rendered as plain Persian strings, which still display correctly because each label is its own text node.
- Add labels in `mockVendor.ts`:
  ```ts
  trendLabelsByRange: {
    day: ["۰۰", "۰۲", "۰۴", "۰۶", "۰۸", "۱۰", "۱۲", "۱۴", "۱۶", "۱۸", "۲۰", "۲۲"], // hours
    week: ["شنبه","یک","دو","سه","چهار","پنج","جمعه"],
    month: ["۱","۳","۶","۹","۱۲","۱۵","۱۸","۲۱","۲۴","۲۷","۲۹","۳۱"],
  }
  ```
- Update `MobileVendorHome.tsx` and `MobileVendorFinance.tsx` to pass `labels={mockVendor.trendLabelsByRange[timeframe]}` (Home uses `week`).
- Container height bumped from 100 → 140 to give room for x-axis ticks.

---

### Files touched

- `src/features/vendor-dashboard/mobile/MobileVendorShell.tsx` (remove header)
- `src/features/vendor-dashboard/mobile/MobileVendorHome.tsx` (greeting, chart labels)
- `src/features/vendor-dashboard/mobile/MobileVendorFinance.tsx` (page title, tab JSX order, chart labels)
- `src/features/vendor-dashboard/mobile/MobileVendorSettings.tsx` (page title, tab JSX order, dir on helpers, LTR inputs)
- `src/features/vendor-dashboard/mobile/WithdrawSheet.tsx` (overlay/portal, bg, close pos)
- `src/features/vendor-dashboard/shared/SectionTitle.tsx` (drop uppercase)
- `src/features/vendor-dashboard/shared/KpiCard.tsx` (TomanAmount / bdi)
- `src/features/vendor-dashboard/shared/HeroBalanceCard.tsx` (bdi)
- `src/features/vendor-dashboard/shared/RevenueSparkChart.tsx` (XAxis + dots + grid + labels prop)
- `src/features/vendor-dashboard/shared/FormField.tsx` (accept `dir` prop, pass through)
- `src/features/vendor-dashboard/shared/SettingsListRow.tsx` (chevron flip, bdi on values)
- `src/features/vendor-dashboard/shared/PolicyRadioGroup.tsx` (RTL audit)
- `src/features/vendor-dashboard/data/mockVendor.ts` (`trendLabelsByRange`, optional `TomanAmount` helper)
- `src/index.css` (`.vendor-dash` scope: drop uppercase eyebrow, `.ltr-num` helper, drop any global overrides; no global font changes)

### Out of scope
Backend, desktop view, anything outside `/m/gptcommerce/dash`, business logic, schema, other routes.
