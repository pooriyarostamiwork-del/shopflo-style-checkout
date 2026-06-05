## Vendor Dashboard polish pass (mobile only — `/m/gptcommerce/dash`)

Frontend-only. No backend, edge function, SQL, or auth changes. Scope strictly to `src/features/vendor-dashboard/**`, `src/pages/MobileVendorDashboard.tsx`, `src/index.css` (only vendor-dash scope), and `index.html` (only to add the Farsi font link).

### 1. Remove "تسویه بعدی" everywhere

- `MobileVendorFinance.tsx`: delete the "تسویه بعدی" KPI card; change the three-up grid to two columns (در انتظار, مجموع برداشت).
- `HeroBalanceCard.tsx`: remove the `nextSettlement` line/prop usage; drop the prop from the component API and from both callers (Home + Finance + WithdrawSheet copy line "واریز طی ۲ تا ۳ روز کاری…" stays, but nothing references nextSettlement).
- `mockVendor.ts`: remove `home.nextSettlement` and `payouts.nextSettlement` fields.
- Search the vendor-dashboard folder for any remaining "تسویه بعدی" / `nextSettlement` and remove.

### 2. Delete the notification bell + its logic

- `MobileVendorShell.tsx`: remove the `<button>` with the `Bell` icon, the unread-dot, and the `Bell` import.
- Remove the dev "شبیه‌سازی تأیید ادمین" panel that was tied to it? Keep approval flow itself (forms still enqueue) but the visible header bell + dot go away. Dev approval block stays as it is not a notification icon.

### 3. Beautiful Farsi font

- Add Vazirmatn (weights 400/500/600/700) via Google Fonts `<link>` in `index.html`.
- In `src/index.css`, inside the `.vendor-dash` scope only, set `font-family: 'Vazirmatn', 'Tahoma', sans-serif;` plus `font-feature-settings: 'ss01','ss02'` and tuned `letter-spacing` for Farsi. Do not touch the global body font.

### 4. Remove "فروشنده تأیید شده" / "فروشگاه تأیید شده"

- `MobileVendorShell.tsx`: delete the BadgeCheck row under the store name; remove `BadgeCheck` import.
- Grep `src/features/vendor-dashboard/**` for "تأیید شده" / "تایید شده" / "verified" badge text and remove any leftovers (e.g. `AccountStatusCard.tsx` if present).

### 5. Split مالی into three sub-tabs (mirroring Settings)

Restructure `MobileVendorFinance.tsx` to a `Tabs` layout identical in styling to Settings:

```text
[ تنظیمات ][ تسویه ][ عملکرد ]
```

- **عملکرد**: `SectionTitle` + `TimeframeSelector` + 4 KPI cards + `RevenueSparkChart`.
- **تسویه**: `HeroBalanceCard` (no nextSettlement), 2-col KPIs (در انتظار، مجموع برداشت), `WithdrawalHistoryList`, withdraw CTA opens `WithdrawSheet`.
- **تنظیمات**: `MerchantTypeToggle` + Accordion (هویتی، بانکی، مالیاتی، قرارداد) + `StickySaveBar`.
- URL deep-link: `?sub=performance|payouts|settings`, matching settings' `?tab=` pattern.

### 6. Polished, minimal hover (no stroke-change hover)

- In `.vendor-dash` scope add a utility `.vd-interactive` that on hover does `background-color: hsl(var(--vd-surface-2))` with a subtle 120ms ease, no border color shift, no shadow.
- Replace hover-border classes on `SettingsListRow`, `KpiCard` (if any), Accordion triggers, tab triggers, sheet close button, percent chips, and nav tabs with `vd-interactive`.
- For primary buttons keep current; only neutral surfaces change.

### 7. Settings tab consistency + RTL fixes

- Wrap each tab content in a uniform card system: same `rounded-2xl`, same padding (`p-4`), same `space-y-3`, same section header pattern (`SectionTitle eyebrow=...`).
- Ensure every interactive row uses `SettingsListRow` look across all three sub-tabs.
- RTL audit:
  - Remove stray `dir="ltr"` (OTP grid keeps `dir="ltr"` because digits, but everything else inherits RTL).
  - Replace any `text-left` with `text-right` or remove.
  - Fix Select trigger arrow alignment by relying on inherited RTL (no `flex-row-reverse`).
  - Helper / error text aligned `text-right`.
  - Wrap numeric values in `unicodeBidi: 'isolate'` where mixed with Farsi (already done in some places; apply consistently in mask/email/mobile rows).
- Persianize all helper microcopy (no English remnants like "IR" placeholder → "شبا با IR شروع می‌شود").

### 8. Modal / Sheet readability fix

All `Sheet` and `Dialog` instances in the dashboard:

- Force solid background: `bg-[hsl(var(--vd-surface))]` (not the translucent surface-2) and `backdrop-blur-0`.
- Add a visible overlay: rely on shadcn's default overlay but ensure it's not overridden; set `data-[state=open]:bg-black/40`.
- Add proper top handle bar, `border-t border-[hsl(var(--vd-stroke))]`, `shadow-[0_-8px_32px_rgba(0,0,0,0.12)]` for separation.
- Ensure content has `pb-[max(env(safe-area-inset-bottom),16px)]` and scrollable body.
- Apply to: `WithdrawSheet`, `ChangeMobileSheet`, `ChangeEmailSheet`, `ChangePasswordSheet`.
- `ChangePasswordSheet`: switch inputs from `type="text"` to `type="password"`; add proper labels and consistent spacing.

### Files touched

- `index.html` (font link only)
- `src/index.css` (vendor-dash scoped additions only)
- `src/features/vendor-dashboard/mobile/MobileVendorShell.tsx`
- `src/features/vendor-dashboard/mobile/MobileVendorFinance.tsx`
- `src/features/vendor-dashboard/mobile/MobileVendorSettings.tsx`
- `src/features/vendor-dashboard/mobile/WithdrawSheet.tsx`
- `src/features/vendor-dashboard/mobile/MobileVendorHome.tsx` (HeroBalanceCard prop removal only)
- `src/features/vendor-dashboard/shared/HeroBalanceCard.tsx`
- `src/features/vendor-dashboard/shared/SettingsListRow.tsx` (hover)
- `src/features/vendor-dashboard/shared/AccountStatusCard.tsx` (remove verified-badge text if present)
- `src/features/vendor-dashboard/data/mockVendor.ts` (drop nextSettlement)

### Out of scope

Backend, desktop view, anything outside `/m/gptcommerce/dash`, AI agent, Supabase schema, other routes' styling.