# Booking cards polish + unified scheduler (playground)

Two changes, both inside `src/features/playground/` only.

## 1. Provider cards redesign

- Rename `دکتر سارا کریمی` → `دکتر سارینا کریمی`.
- Show session duration next to the price on each card (e.g. `۳۵۰٫۰۰۰ تومان · ۲۰ دقیقه`), taken from the selected service.
- Mode badges per doctor from `provider.modes`: `حضوری` and/or `آنلاین` (both shown when both supported), with icon + 1px stroke chip.
- Promotional/commercial badges: add an optional `tags` field to `PgProvider` (`محبوب`, `با سابقه`, `پاسخ سریع`, `اقتصادی`, `نوبت امروز`) and render 1–2 per card as small accent chips in the identity row.
- Avatar ~12% larger (44px → 50px), keeping the round 1px stroke.
- Card refresh: cleaner vertical rhythm, one info row (rating · experience · location), badge row, then a footer action row:
  - `انتخاب وقت` — primary filled, full-width-ish, rounded-xl, subtle hover lift (no shadow, per project rules)
  - `توضیحات` — quiet ghost/outline button with chevron, secondary weight
  - selected card keeps the primary-tinted state; fully-booked card disables the primary CTA.

## 2. Merge date + time pickers into one scheduler component

Replace `PgAvailabilityCalendar` + `PgSlotPicker` usage with a single `PgScheduler` block so picking a date and a time happens in one conversational card.

Layout (RTL, single card):
```text
┌──────────────────────────────────────────┐
│ زمان نوبت را انتخاب کن     تیر ۱۴۰۴      │
│ [شنبه ۱۲][یک‌شنبه ۱۳][…]  ← date rail    │
│ ─────────────────────────────────────────│
│ صبح      ۰۹:۰۰  ۰۹:۳۰  ۱۰:۱۵  ۱۱:۰۰     │
│ بعدازظهر ۱۳:۳۰  ۱۴:۱۵  …                 │
│ شب       ۱۸:۰۰  ۱۸:۴۵  …                 │
│ ─────────────────────────────────────────│
│ دوشنبه ۱۴ تیر · ۱۰:۱۵ · ۲۰ دقیقه  [تأیید]│
└──────────────────────────────────────────┘
```
- Date rail: horizontal scroll, weekday + Persian day number + availability count, disabled state for closed/full days, `روزهای بیشتر` extends 7 → 14 days.
- Slot grid appears under the rail for the selected day, grouped صبح / بعدازظهر / شب, taken slots struck through and disabled.
- Changing the date swaps the slots in place (no new chat turn) with a soft fade — one interaction, one component.
- Sticky footer summary inside the card shows the chosen date + time + duration and one primary CTA `تأیید زمان` that commits both values and advances the flow. Secondary quiet link `زمان دیگری پیشنهاد بده`.
- Empty day (all slots taken) shows an inline hint plus nearest-open-day suggestion chip.

## Technical notes

- New `PgScheduler` in `PgBookingBlocks.tsx` (keeps `PgBookingCard` shell); old `PgAvailabilityCalendar` / `PgSlotPicker` removed once nothing renders them.
- `mockJourney.ts`: add a `scheduler` booking kind; keep `calendar`/`slots` kinds mapped to the scheduler so existing triggers and dev-drawer buttons still work.
- `usePlaygroundChat.ts`: add `confirmSchedule(day, slot)` that sets both `bookingDayKey` and `bookingSlotId` and appends the next assistant turn (form). `pickBookingDay`/`pickBookingSlot` become internal-only state setters, no extra chat turns.
- `PgBookingRenderer.tsx`: dispatch `scheduler` (and legacy `calendar`/`slots`) to `PgScheduler`.
- `PgDevDrawer.tsx`: replace the two separate lab buttons with one `زمان‌بندی` trigger, plus a fully-booked-day edge case.
- `mockBooking.ts`: `tags` on providers, name fix, helper for nearest open day.
- All digits/prices/times in Persian with existing `toFa` / `faPrice` / `faTime` helpers; 1px strokes, no shadows.

Verified after implementation with a Playwright pass through the booking flow (desktop + mobile shells).
