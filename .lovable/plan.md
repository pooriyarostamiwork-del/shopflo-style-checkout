
# Mobile Vendor Dashboard v2 — `/m/gptcommerce/dash`

Frontend-only. No backend, no edge functions, no SQL, no auth wiring. All persistence is in-memory + `localStorage`. Scope strictly limited to `src/features/vendor-dashboard/` + `src/pages/MobileVendorDashboard.tsx` + the single route block in `src/App.tsx`.

---

## 1. Visual redesign — direction

Current dashboard is too flat and generic. New direction: **"Calm fintech, editorial RTL"** — still aligned with the project Core memory (Primary `#696FC7`, Sec `#F5F6FA`, Text `#1E1E1E`, 1px strokes, no drop shadows), but with stronger hierarchy, layered surfaces, and a hero financial moment.

Design tokens (added to `index.css` as new CSS variables, scoped to the dashboard via a `.vendor-dash` wrapper so nothing leaks to /gptcommerce):

- `--vd-surface`: pure white card
- `--vd-surface-2`: `#FAFAFB` for nested rows
- `--vd-surface-ink`: `#101015` for the hero balance card (inverted)
- `--vd-stroke`: `#ECECF0` (1px hairlines everywhere)
- `--vd-accent`: `#696FC7` (primary)
- `--vd-accent-soft`: `#EEF0FB` (chips, progress tracks)
- `--vd-positive`: `#1F8A5A` / soft `#E6F4EC`
- `--vd-warning`: `#B4791F` / soft `#FBF1DC`
- `--vd-danger`: `#B4313A` / soft `#FBE6E8`
- Radii: cards `rounded-3xl` (24px), chips/pills `rounded-full`, inputs `rounded-2xl`
- Type scale: hero number `text-3xl font-semibold tracking-tight`, KPI value `text-xl`, labels `text-xs text-muted-foreground`
- Strict RTL: every flex row uses logical `start/end`, no `flex-row-reverse`. Per project Core memory.
- Persian digits + BiDi isolation on every number/date.

---

## 2. Component-by-component UI plan

### 2.1 Shell — `MobileVendorShell.tsx` (rewrite)
- Sticky top header (h-14, white, 1px bottom stroke): right side store avatar + store name + tiny "فروشنده تأیید شده" chip; left side bell icon (visual only) with a 6px dot.
- Sticky bottom tab bar (h-16): 3 tabs (خانه / مالی / تنظیمات) with lucide icons. Active state = filled icon + primary text + 2px top indicator bar. Inactive = muted.
- Page area: `pb-24 pt-2`, background `bg-[hsl(var(--vd-surface-2))]` so cards float.

### 2.2 Home — `MobileVendorHome.tsx` (rewrite)
Stack:
1. **Greeting strip** — "سلام، {storeName}" + date in Persian (e.g. "چهارشنبه، ۱۴ خرداد").
2. **Hero balance card** (inverted, `bg-vd-surface-ink text-white`, `rounded-3xl`, p-5):
   - Label "موجودی قابل برداشت"
   - Big number `1,800,000 تومان` (Persian digits)
   - Sub-row: tiny chip "در انتظار تسویه ۳٬۲۵۰٬۰۰۰ تومان" + next settlement date
   - Primary white-on-ink button `برداشت وجه` → opens **WithdrawSheet** (see §3.1)
3. **KPI grid** (2-col, 12px gap, `rounded-3xl border` cards): Revenue / Orders / Active Products / AOV. Each card: tiny label, value, delta chip (`+۱۲٪` green or `−۴٪` red) — deltas are mock-only.
4. **Mini revenue chart card** — 7-day spark area chart using `recharts` (already installed). 1 line, no axes, just gradient fill. Title "روند درآمد ۷ روز اخیر".
5. **Onboarding / Status block** — same conditional logic, restyled:
   - Incomplete → `OnboardingChecklist` with circular progress ring (svg, 56px) replacing the linear bar; rows have a subtle hover/press, completed rows show a soft `--vd-positive` check pill.
   - Complete → `AccountStatusCard` as a single card with 4 inline rows separated by 1px strokes, each row has a small green dot.
6. Dev toggle stays, moved into a tiny outline pill at the very bottom.

### 2.3 Finance — `MobileVendorFinance.tsx` (rewrite)
Sections separated by `SectionTitle` (uppercase eyebrow + thin underline accent):

A. **Overview**
   - `TimeframeSelector` is now a fully-functional segmented control (۱ روز / ۱ هفته / ۱ ماه), pill style, sliding active indicator (CSS transform). Stored in URL search param `?range=day|week|month` so refresh preserves selection.
   - KPI grid (Revenue, Orders, AOV, Commission) — values come from `mockVendor.revenueByRange[timeframe]`. Each value animates with a 200ms fade+slide-up on change (CSS keyframe, no library).
   - **Trend chart** — recharts area, x-axis hidden, range-aware data (3 mock arrays for day/week/month).

B. **Payouts**
   - Hero secondary card: `موجودی قابل برداشت` + `برداشت وجه` button (same sheet).
   - 3 stat tiles in a row: Pending, Total Withdrawn, Next Settlement.

C. **Withdrawal History**
   - `WithdrawalHistoryList` v2: grouped by month header, each row shows date (right), amount (left), status chip with color tokens. Empty state for zero rows.

D. **Financial Settings**
   - `MerchantTypeToggle` redesigned as a 2-segment pill toggle with icon (User / Building2).
   - Each subsection (Identity / Banking / Tax / Agreement) becomes a collapsible card (shadcn `Accordion`), default open = Identity, others closed. Completion badge on header (e.g. "۳ از ۵ تکمیل").
   - **Validation** (client-only, zod):
     - Individual: full name (≥3), national code (10 digits, Iranian checksum), mobile (`^09\d{9}$`), birth date (jYYYY/jMM/jDD pattern only — visual), address (≥10).
     - Company: company name, national id (11 digits), registration number, rep name, rep national code; contact phone, email, address.
     - Banking: account holder, bank name (select from fixed list of ~12 Iranian banks), account number (digits only), IBAN (`^IR\d{24}$`).
     - Tax: digits-only optional fields, plus required code for company.
     - Errors render inline under each field as `text-xs text-[hsl(var(--vd-danger))]` with red 1px stroke on the input.
   - Sticky bottom CTA bar appears above the tab bar when section is dirty: "ذخیره تغییرات" (primary) + "انصراف" (ghost). On save → validate → if valid push change to **PendingChangesStore** (see §3.4) and toast "درخواست تغییر برای بررسی ارسال شد".

### 2.4 Settings — `MobileVendorSettings.tsx` (rewrite)
Three sub-tabs with deep-link via URL search param `?tab=profile|returns|account`, default `profile`.

A. **پروفایل کسب‌وکار**
   - Logo picker stub: 72px rounded square + outline "بارگذاری" + helper "تأیید توسط ادمین لازم است".
   - Fields: business name, description (textarea, char counter `۰/۲۵۰`), support phone, business type (select), website (URL validation), operating hours.
   - Validation via zod, inline errors, sticky save bar.
   - On save → enqueue PendingChange, the field shows a small amber pill "در انتظار تأیید ادمین" next to the label until status flips (mock).

B. **بازگشت و استرداد**
   - `PolicyRadioGroup` redesigned as pill-row (each option is a 1px stroke pill, selected = filled primary-soft).
   - Same pending-approval flow on save.

C. **حساب کاربری**
   - Three rounded list rows (mobile, password, email) with `ChevronLeft` (RTL) and right-aligned masked value.
   - Tapping a row opens a `Sheet` with the relevant change form (mobile change requires OTP step — visual only, 6-box OTP using existing Farsi OTP pattern from memory). Email change uses zod email validation.
   - "تغییر شماره" and "به‌روزرسانی ایمیل" go through the same pending-approval queue.

### 2.5 Withdraw flow (new) — `WithdrawSheet.tsx`
Bottom sheet (`shadcn/Sheet side="bottom"`, `rounded-t-3xl`, max-h `90vh`):
- Header: "برداشت وجه" + close.
- Balance row: "موجودی قابل برداشت ۱٬۸۰۰٬۰۰۰ تومان".
- Saved bank account display (read-only): bank name + masked IBAN. Helper "برای تغییر حساب به بخش مالی بروید".
- Amount input (numeric, Persian-digit display, comma grouping on blur).
- Quick chips: `۲۵٪` / `۵۰٪` / `۱۰۰٪` / مبلغ دلخواه.
- Min/max validation: min ۱۰۰٬۰۰۰، max = balance.
- Note field (optional, 100 chars).
- Sticky footer button "تأیید برداشت".
- On confirm → 1.2s skeleton/loader → success state inside the same sheet: green check ring (svg), "درخواست برداشت ثبت شد"، reference id `WD-۱۴۰۵۰۳۱۴-۰۰۱۲` (mock), expected date "۲ تا ۳ روز کاری"، two buttons "بازگشت به داشبورد" / "مشاهده تاریخچه برداشت" (routes to Finance with `?scrollTo=withdrawals`).
- On close after success, the new withdrawal is prepended to `mockVendor.withdrawals` in-memory via a small Zustand-free store (just `useState` lifted into a React context — see §3.3).

---

## 3. State, routing, validation infra (frontend only)

### 3.1 Routing & deep linking
- Replace conditional rendering with nested routes in `MobileVendorShell`:
  ```text
  /m/gptcommerce/dash               → redirect to /home
  /m/gptcommerce/dash/home
  /m/gptcommerce/dash/finance
  /m/gptcommerce/dash/settings
  ```
- Settings sub-tabs use `?tab=` search param. Finance timeframe uses `?range=`.
- `App.tsx` change: change the existing `/m/gptcommerce/dash/*` registration to mount the shell with nested `<Route>` children (no behavior change outside this route).

### 3.2 New `VendorDashboardContext`
Single React context exposing:
- `vendor` (current profile, account, returnPolicy)
- `withdrawals`, `addWithdrawal(amount, note)`
- `pendingChanges`, `enqueueChange(section, fields)`, `getPendingFor(field)` → returns `{status:"pending"|"approved"|null}`
- `onboarding`, `toggleOnboardingComplete()` (dev toggle)

Backed by `useState` + `localStorage` key `vendor-dash:v1`. **Strictly client-side**, no Supabase.

### 3.3 Pending-approval simulation
Every save in Profile/Returns/Account/Finance settings does NOT mutate the displayed canonical value. Instead:
- Writes a `PendingChange` entry to context.
- The form field renders the *pending* value (if any) with an amber pill "در انتظار تأیید ادمین" and a tiny ghost "لغو درخواست" link that removes the pending entry.
- A dev-only "تأیید توسط ادمین (شبیه‌سازی)" link appears at the very bottom of each tab to flip a pending change to approved, which then merges it into the canonical value. This is purely for demo/QA.

### 3.4 Validation
Add `zod` schemas in `src/features/vendor-dashboard/data/schemas.ts`:
- `individualIdentitySchema`, `companyIdentitySchema`, `bankingSchema`, `taxIndividualSchema`, `taxCompanySchema`
- `profileSchema`, `returnPolicySchema`, `accountEmailSchema`, `accountMobileSchema`
- `withdrawalSchema` (amount min/max)
Use `react-hook-form` (already in deps) + `@hookform/resolvers/zod` for inline errors. If `@hookform/resolvers` is not installed, fall back to a tiny manual `zod.safeParse` wrapper — no new dependency added.

---

## 4. File plan

```text
src/App.tsx                                              (edit: nested routes for /dash/*)
src/index.css                                            (edit: add --vd-* tokens, scoped under .vendor-dash)
src/pages/MobileVendorDashboard.tsx                      (edit: wrap in VendorDashboardProvider + .vendor-dash class)

src/features/vendor-dashboard/
├── context/
│   └── VendorDashboardContext.tsx                       NEW
├── data/
│   ├── mockVendor.ts                                    EDIT (add deltas, range data for chart, banks list, helpers)
│   └── schemas.ts                                       NEW (zod schemas)
├── shared/
│   ├── KpiCard.tsx                                      EDIT (delta chip, new typography)
│   ├── SectionTitle.tsx                                 EDIT (eyebrow style)
│   ├── OnboardingChecklist.tsx                          EDIT (circular progress ring)
│   ├── AccountStatusCard.tsx                            EDIT (row-based redesign)
│   ├── TimeframeSelector.tsx                            EDIT (sliding indicator, URL-bound)
│   ├── WithdrawalHistoryList.tsx                        EDIT (grouped by month, empty state)
│   ├── FormField.tsx                                    EDIT (error prop, pending pill prop)
│   ├── MerchantTypeToggle.tsx                           EDIT (icon pill)
│   ├── PolicyRadioGroup.tsx                             EDIT (pill row)
│   ├── HeroBalanceCard.tsx                              NEW
│   ├── RevenueSparkChart.tsx                            NEW (recharts)
│   ├── DeltaChip.tsx                                    NEW
│   ├── PendingApprovalPill.tsx                          NEW
│   ├── StickySaveBar.tsx                                NEW
│   ├── BankAccountRow.tsx                               NEW
│   └── SettingsListRow.tsx                              NEW
└── mobile/
    ├── MobileVendorShell.tsx                            EDIT (nested routes, new header/tabs)
    ├── MobileVendorHome.tsx                             EDIT (full restructure)
    ├── MobileVendorFinance.tsx                          EDIT (full restructure, accordion sections, validation)
    ├── MobileVendorSettings.tsx                         EDIT (URL-bound sub-tabs, validation, pending approval)
    ├── WithdrawSheet.tsx                                NEW
    ├── ChangeMobileSheet.tsx                            NEW
    ├── ChangeEmailSheet.tsx                             NEW
    └── ChangePasswordSheet.tsx                          NEW
```

No file outside this list is touched. No backend file, no edge function, no SQL, no `supabase/`.

---

## 5. Acceptance checklist (mapped to the user's bullets)

1. ✅ Withdraw flow as bottom sheet with confirm + mock success — §2.5.
2. ✅ Timeframe selector updates KPIs + chart, URL-bound — §2.3 A + §3.1.
3. ✅ Inline zod validation across all settings + finance forms — §3.4.
4. ✅ Deep-linkable tabs (`/dash/home`, `/dash/finance`, `/dash/settings`) preserved on refresh — §3.1.
5. ✅ Pending-admin-approval flow for any profile/settings change — §3.3.
6. ✅ Consistent RTL, fonts, tokens across all sections — §1 + restyled shared components in §2.
7. ✅ Full visual redesign with per-component plan listed above — §1 + §2.

## 6. Out of scope (will not be done)

- Any backend, Supabase, edge function, SQL, RLS, auth, or real persistence beyond `localStorage`.
- Desktop view (will reuse `shared/` components later).
- Any change outside `/m/gptcommerce/dash` and the listed files.
- Real OTP / SMS / email delivery (mobile-change OTP is visual only).
