# Booking components refinement (playground)

Three playground booking blocks get reworked: the appointment summary, the attendee details step, and the time picker. Front-end only, mock data, RTL Farsi.

## 1. خلاصه نوبت (summary card)

- Remove the مراجع avatar circle; show the attendee as a labeled text row.
- Merge doctor and attendee into a single card block at the top of the component (one bordered block, doctor row + attendee row separated by a hairline), placed above the time block.
- Delete the line «لغو تا ۲۴ ساعت قبل از نوبت رایگان است.»
- Rebuild the header to match the shared block header used by the other booking components (icon + title + hint, bottom border, same paddings/type sizes), so borders and titles are consistent across the booking journey.

## 2. مشخصات نوبت (attendee step)

Replace the always-blank form with a saved-profile selector that mirrors the gpt-commerce address selection journey:

- Header with title plus an «افزودن مراجع جدید» action on the opposite side.
- List of predefined attendee profiles (mock: self + family members) as selectable rows with name, phone, and a check indicator; one marked as default and preselected.
- «افزودن مراجع جدید» reveals an inline form (name, mobile, optional insurance, optional reason/note) with the existing validation and inline errors, plus «انصراف» when profiles already exist. On submit the new profile is added to the list and auto-selected.
- Session-mode choice (حضوری/آنلاین) stays when the service supports both, and the prep checklist stays.
- Primary CTA stays «بررسی نهایی نوبت», enabled only when a profile is selected; it emits the same values shape the summary already consumes.

## 3. Time picker (زمان نوبت را انتخاب کن)

Rebuilt to follow the attached reference:

- A day strip of 5 day cards showing weekday, large day number, and a colored availability dot with «۷ نوبت / ۱ نوبت / -» underneath; closed/empty days rendered muted and non-clickable; selected day gets a highlighted card.
- Pagination arrows to slide between day windows (previous window disabled at today), replacing the free-scrolling rail and the «روزهای بیشتر» link. No month selector, no timezone/location selector.
- Time slots in a flat grid (no morning/afternoon/evening sections). Each slot carries a small timeframe tag (صبح/بعدازظهر/عصر) inside the chip; taken slots disabled.
- Selected day/slot summary and the single «تأیید زمان» CTA are kept.

## Technical notes

- Files: `src/features/playground/components/PgBookingFlow.tsx` (summary + attendee step), `src/features/playground/components/PgBookingBlocks.tsx` (`PgScheduler`, shared `PgBookingCard` header), `src/features/playground/data/mockBooking.ts` (mock attendee profiles + day-window helper).
- `PgBookingFormValues` keeps its current fields so `PgBookingSummary`, `PgBookingRenderer`, and `usePlaygroundChat` wiring stay unchanged.
- Persian digits via existing `toFa`/`faTime` helpers; day-window paging is local component state over `buildDays`.
