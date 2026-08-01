# In-chat service booking components (playground)

Add a full conversational booking journey to the playground so services (doctor visits, grooming sessions, consultations) can be booked entirely inside the chat — no page navigation, no backend. Front-end only, RTL Farsi, Persian digits, same flat/minimal styling as the existing playground blocks.

## Journey the components must cover

```text
intent ("وقت دکتر می‌خوام")
  → service picker  → provider cards → availability calendar
  → slot picker     → booking form   → booking summary + CTA
  → confirmation card (+ reschedule / cancel / add to calendar)
```

## Components

1. **Service picker** — category chips + service rows (name, duration, price, in-person/online badge). Skip action.
2. **Provider cards** — doctor/practitioner card: avatar, title & specialty, rating, experience, next-available chip, price, "انتخاب وقت" / details. Grid of 2–3 in chat, same card language as product cards.
3. **Availability calendar** — horizontal 7/14-day date rail with availability density dots, month header, disabled/full days, "روزهای بیشتر".
4. **Time-slot picker** — slots grouped by صبح / بعدازظهر / شب, chip grid, disabled taken slots, timezone/duration line, "زمان دیگری پیشنهاد بده".
5. **Booking form** — patient/attendee name, phone, reason-for-visit note, visit type (حضوری / آنلاین), optional insurance field. Inline zod-style validation messages (client-side only).
6. **Booking summary block** — provider + service + date/time + duration + location or video-call note + price breakdown (fee, deposit, tax) with the single "تأیید و رزرو" CTA.
7. **Confirmation card** — booking code, status badge, calendar/ICS-style action, reschedule and cancel actions, prep instructions list.
8. **Reschedule flow** — reuses calendar + slot picker with an "in place of the previous time" header, showing old → new time.
9. **Cancel confirmation** — inline confirm block with refund/policy note.
10. **Edge/error states** — no availability (waitlist / notify-me), slot taken while choosing (re-pick prompt), provider fully booked (alternative providers), online-only vs in-person mismatch, missing required field.

## Mock data

`src/features/playground/data/mockBooking.ts`
- `PgService` (id, name, duration, price, mode, prep notes)
- `PgProvider` (id, name, specialty, rating, years, avatar seed, services, location)
- `PgAvailability` generator: deterministic per provider/date → slots with taken/free state
- `PgBooking` (code, provider, service, slot, attendee, status)
- Helpers: Jalali-style Persian date labels, Persian digit/price formatting reused from `mockStore`

## Wiring into the playground

- `PgMessage` gains a `booking?: PgBookingPayload` field (kind: `services | providers | calendar | slots | form | summary | confirmation | reschedule | cancel | empty`), matching how `interactive`, `crossSell`, and `comparison` already work.
- `PgChatThread.tsx` renders the new blocks in the same `md:mr-11` column.
- `usePlaygroundChat.ts` gains local booking state (selected service/provider/date/slot/attendee, bookings list) plus actions: `startBooking`, `pickService`, `pickProvider`, `pickDate`, `pickSlot`, `submitBookingForm`, `confirmBooking`, `startReschedule`, `cancelBooking`. Each step appends an assistant turn, so the flow reads as a conversation.
- `mockJourney.ts`: keyword triggers (وقت، نوبت، رزرو، دکتر، ویزیت، مشاوره) and a `booking` journey step group added to the step list.
- `PgDevDrawer.tsx`: a "رزرو نوبت" lab section with one-click jumps to every block and every edge state.

## Files

New
- `src/features/playground/data/mockBooking.ts`
- `src/features/playground/components/PgBookingBlocks.tsx` (service picker, provider cards, calendar, slot picker)
- `src/features/playground/components/PgBookingFlow.tsx` (form, summary, confirmation, reschedule, cancel, empty states)

Edited
- `src/features/playground/data/mockJourney.ts`
- `src/features/playground/hooks/usePlaygroundChat.ts`
- `src/features/playground/components/PgChatThread.tsx`
- `src/features/playground/components/PgDevDrawer.tsx`

## Notes

- No Supabase, no network, no changes outside `src/features/playground/`.
- All numbers, prices, dates and times in Persian digits with BiDi isolation; booking codes stay Latin digits.
- Cards use 1px strokes, no shadows; single active CTA per booking step, intermediate steps use quick replies — consistent with the storefront rules.
- Verified with a Playwright pass through the full booking flow plus each edge state on desktop and mobile shells.
