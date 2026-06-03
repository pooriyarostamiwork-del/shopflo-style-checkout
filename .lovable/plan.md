# Mobile Vendor Dashboard — `/m/gptcommerce/dash`

Frontend-only, mobile-first, RTL Farsi. Mock data only — no backend, no edge functions, no SQL. Structured so the same presentational components can later be reused for the desktop dashboard.

## Scope

- New route `/m/gptcommerce/dash` (and nested tabs) in `src/App.tsx`.
- New folder: `src/features/vendor-dashboard/` with `mobile/`, `shared/`, and `data/` subfolders so the desktop version can later import from `shared/` and `data/` unchanged.
- Three top-level sections per spec: **Home**, **Finance**, **Vendor Management & Settings**.
- Bottom tab bar for navigation between the three sections (mobile pattern).
- All copy in Farsi, Persian digits, BiDi-isolated numbers, 1px strokes, no shadows, palette tokens from `index.css` (per project Core memory).

## Routing

```text
/m/gptcommerce/dash               → Home
/m/gptcommerce/dash/finance       → Finance
/m/gptcommerce/dash/settings      → Vendor Management & Settings (tabs inside)
```

Single `MobileVendorDashboard` page hosts a sticky top header (store name + avatar) and sticky bottom tab bar; section content swaps via nested `<Routes>`.

## File structure

```text
src/pages/MobileVendorDashboard.tsx                       (route entry, providers)
src/features/vendor-dashboard/
├── mobile/
│   ├── MobileVendorShell.tsx                             (header + bottom tabs + outlet)
│   ├── MobileVendorHome.tsx
│   ├── MobileVendorFinance.tsx
│   └── MobileVendorSettings.tsx                          (sub-tabs: Profile / Returns / Account)
├── shared/
│   ├── KpiCard.tsx                                       (label, value, sublabel, optional CTA)
│   ├── SectionTitle.tsx
│   ├── OnboardingChecklist.tsx
│   ├── AccountStatusCard.tsx
│   ├── TimeframeSelector.tsx                             (1D / 1W / 1M segmented)
│   ├── WithdrawalHistoryList.tsx                         (mobile list, desktop later swaps to table)
│   ├── FormField.tsx                                     (label + input wrapper, RTL)
│   ├── MerchantTypeToggle.tsx                            (حقیقی / حقوقی radio)
│   └── PolicyRadioGroup.tsx
└── data/
    └── mockVendor.ts                                     (all mock KPIs, onboarding, withdrawals, profile)
```

Naming convention: `Mobile*` = layout/composition specific to mobile. `shared/` = pure presentational pieces reused on desktop later.

## Section details

### 1. Home (`MobileVendorHome`)

Vertical stack, single column, `px-4 py-5 space-y-4`:

1. Greeting row: "سلام، {storeName}" + small avatar.
2. KPI cards (stacked, full-width):
  - Revenue — `12,500,000 تومان` + sublabel "بازه: ۱ ماه"
  - Orders Generated — `42 سفارش`
  - Active Products — `342 محصول`
  - Pending Settlement — `3,250,000 تومان` + "تسویه بعدی: ۱۴۰۵/۰۳/۱۵"
  - Withdrawable Balance — `1,800,000 تومان` + sublabel "قابل برداشت" + primary CTA `برداشت وجه`
3. Conditional block driven by `mockVendor.onboarding.complete`:
  - `false` → `OnboardingChecklist` (title "شروع کار"، `Progress` 75%، 5 checklist rows, "۲ مرحله باقی‌مانده"، CTA "تکمیل ثبت‌نام").
  - `true` → `AccountStatusCard` (4 green check rows: فروشگاه فعال / تأیید احراز هویت / حساب بانکی تأیید شده / پرداخت‌ها فعال).

A small dev toggle at the bottom (visible only in this prototype) flips `onboarding.complete` so reviewers can see both states. Removed before backend wiring.

### 2. Finance (`MobileVendorFinance`)

Single scroll, sections separated by `SectionTitle`:

- **Revenue Overview**
  - `TimeframeSelector` (segmented control: ۱ روز / ۱ هفته / ۱ ماه) — local `useState`, swaps numbers from `mockVendor.revenueByRange`.
  - KPI cards: Revenue, Orders, AOV (`297,000 تومان`), Commission Paid (`625,000 تومان`).
- **Payouts**
  - Summary KPI cards: Withdrawable Balance (+ CTA `برداشت وجه`), Pending Settlement, Total Withdrawn (`24,500,000 تومان`), Next Settlement (`۱۴۰۵/۰۳/۱۵`).
- **Withdrawal History**
  - Mobile: stacked card list. Each item: date (right), amount (left), status chip (Pending/Processing/Completed/Failed → muted/blue/green/red token chips). Desktop version will swap this list for a table by adding a `variant="table"` branch later.
- **Financial Settings**
  - `MerchantTypeToggle` (radio: حقیقی / حقوقی) controlling which fields render below.
  - Identity Information — حقیقی fields (نام کامل، کد ملی، شماره موبایل، تاریخ تولد، آدرس) OR حقوقی fields (نام شرکت، شناسه ملی، شماره ثبت، نماینده، کد ملی نماینده + Contact: تلفن، ایمیل، آدرس شرکت).
  - Banking Information (both): نام صاحب حساب، نام بانک، شماره حساب، شماره شبا.
  - Tax Information — branches by merchant type.
  - Merchant Agreement — text line + `دانلود قرارداد` outline button.
  - Sticky `ذخیره تغییرات` button at bottom of section.

All inputs are visual-only (`Input`, `Textarea`, `RadioGroup`, `Select` from shadcn). No submit handlers beyond `toast("ذخیره شد (نمایشی)")`.

### 3. Vendor Management & Settings (`MobileVendorSettings`)

Top tab bar (shadcn `Tabs`, 3 tabs): **پروفایل کسب‌وکار** / **بازگشت و استرداد** / **حساب کاربری**.

- **پروفایل کسب‌وکار**
  - Business Information: نام کسب‌وکار، لوگوی فروشگاه (image picker stub — visual only), توضیحات.
  - Contact Information: شماره پشتیبانی.
  - `ذخیره تغییرات` button.
- **بازگشت و استرداد**
  - Returns Accepted (radio بله/خیر).
  - Return Window (radio ۷ / ۱۴ / ۳۰ روز).
  - Return Shipping Responsibility (radio مشتری / فروشنده / بسته به دلیل بازگشت).
  - `ذخیره سیاست` button.
- **حساب کاربری**
  - Mobile Number row: `+۹۸ ۹۱۲ XXX XXXX` + outline `تغییر شماره` + helper text listing the three uses.
  - Password row: `••••••••••••` + outline `تغییر رمز عبور`.
  - Email row (optional): `merchant@example.com` + outline `به‌روزرسانی ایمیل` + helper "فقط برای فاکتور، پشتیبانی و اطلاع‌رسانی".
  - `ذخیره تغییرات` button.

## Shell, header, bottom tabs

- Header: sticky top, store name right, avatar left (RTL), 1px bottom border. No back button on root tabs.
- Bottom tab bar: sticky bottom, 3 items (خانه، مالی، تنظیمات) with lucide icons (`Home`, `Wallet`, `Settings`). Active tab uses `text-primary`; inactive uses `text-muted-foreground`. 1px top border.
- Page content area: `pb-24` to clear bottom bar, `pt-2` under header.

## Mock data (`data/mockVendor.ts`)

```text
storeName: "فروشگاه نمونه"
onboarding: { complete: false, percent: 75, items: [...5 rows with done:boolean] }
home: { revenue, orders, activeProducts, pendingSettlement, nextSettlement, withdrawableBalance }
revenueByRange: { day: {...}, week: {...}, month: {...} }    // each {revenue, orders, aov, commission}
payouts: { withdrawable, pending, totalWithdrawn, nextSettlement }
withdrawals: [{date, amount, status}, ...]
profile, returnPolicy, account                                // initial form values
```

All numbers formatted at render-time with the existing Persian-digit helper (or a local helper if none exists in scope) and BiDi-isolated per the project Core memory.

## Design tokens

- Cards: `bg-card`, `border border-border`, `rounded-2xl`, `p-4`. No shadows.
- Primary CTA: existing `Button variant="default"` (already uses `--primary` `#696FC7`).
- Status chips: small `rounded-full px-2 py-0.5 text-xs border`, color tokens only.
- Typography: existing project body font, no new fonts.

## Desktop reuse (not built now, but accounted for)

- All `shared/*` components are pure and viewport-agnostic.
- Layout-specific composition lives only in `mobile/Mobile*` files. Desktop later adds `desktop/Desktop*` files importing the same `shared/` + `data/` modules.
- `WithdrawalHistoryList` exposes an internal switch so the desktop variant can render a table without forking the data layer.

## Out of scope (this step)

- No backend, no Supabase calls, no edge functions, no SQL, no auth gating.
- No real form submission, validation, or persistence.
- No desktop view yet.
- No changes outside `/m/gptcommerce/dash` route and the new `vendor-dashboard` feature folder (plus the single route registration in `App.tsx`).