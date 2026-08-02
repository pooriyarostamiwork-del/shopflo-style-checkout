// Maps a chat booking payload to the matching booking block, wired to the
// playground chat state. Keeps PgChatThread thin.
import { PgChat } from "../hooks/usePlaygroundChat";
import { PgMessage } from "../data/mockJourney";
import {
  PG_PROVIDERS,
  PG_SERVICES,
  PG_SERVICE_CATEGORIES,
  faDayLabel,
  findDay,
  findProvider,
  findService,
  providersForService,
} from "../data/mockBooking";
import { PgProviderCards, PgScheduler, PgServicePicker } from "./PgBookingBlocks";

import {
  PgBookingConfirmation,
  PgBookingForm,
  PgBookingNotice,
  PgBookingSummary,
} from "./PgBookingFlow";
import { PgProviderProfile } from "./PgProviderProfile";

export const PgBookingRenderer = ({
  chat,
  payload,
}: {
  chat: PgChat;
  payload: NonNullable<PgMessage["booking"]>;
}) => {
  const service = findService(payload.serviceId) ?? chat.bookingService ?? undefined;
  const provider = findProvider(payload.providerId) ?? chat.bookingProvider ?? undefined;

  switch (payload.kind) {
    case "services":
      return (
        <PgServicePicker
          services={PG_SERVICES}
          categories={PG_SERVICE_CATEGORIES}
          onPick={chat.pickBookingService}
          onSkip={() => chat.send("فعلاً نمی‌خوام نوبت بگیرم")}
        />
      );

    case "providers":
      return (
        <PgProviderCards
          providers={service ? providersForService(service.id) : PG_PROVIDERS}
          service={service}
          selectedId={chat.bookingProvider?.id}
          onPick={chat.pickBookingProvider}
          onDetails={chat.showProviderProfile}
        />
      );

    case "profile": {
      const p = provider ?? findProvider(payload.providerId);
      if (!p) return null;
      return (
        <PgProviderProfile
          provider={p}
          service={service}
          onPick={chat.pickBookingProvider}
        />
      );
    }

    case "calendar":
      return (
        <PgAvailabilityCalendar
          providerId={provider?.id ?? PG_PROVIDERS[0].id}
          selectedKey={chat.bookingDayKey}
          onPick={chat.pickBookingDay}
          title={
            chat.rescheduleCode ? "روز جدید نوبت را انتخاب کن" : "کدوم روز برات مناسبه؟"
          }
        />
      );

    case "slots": {
      const dayKey = payload.dayKey ?? chat.bookingDayKey;
      if (!dayKey) return null;
      const day = provider ? findDay(provider.id, dayKey) : undefined;
      return (
        <PgSlotPicker
          dayKey={dayKey}
          dayLabel={faDayLabel(day)}
          duration={service?.duration ?? 30}
          selectedId={chat.bookingSlotId}
          onPick={chat.pickBookingSlot}
          onAskOther={() => chat.send("زمان دیگری پیشنهاد بده")}
        />
      );
    }

    case "form":
      return <PgBookingForm service={service} onSubmit={chat.submitBookingForm} />;

    case "summary":
      if (!chat.bookingForm || !chat.bookingDayKey || !chat.bookingSlotId) return null;
      return (
        <PgBookingSummary
          service={service}
          provider={provider}
          dayKey={chat.bookingDayKey}
          slotId={chat.bookingSlotId}
          values={chat.bookingForm}
          onConfirm={chat.confirmBooking}
          onEdit={chat.editBookingForm}
        />
      );

    case "confirmation": {
      const booking = chat.bookings.find((b) => b.code === payload.code);
      if (!booking) return null;
      return (
        <PgBookingConfirmation
          booking={booking}
          service={findService(booking.serviceId)}
          provider={findProvider(booking.providerId)}
          onReschedule={() => chat.rescheduleBooking(booking.code)}
          onCancel={() => chat.cancelBooking(booking.code)}
          onAddCalendar={chat.addBookingToCalendar}
        />
      );
    }

    case "notice":
      return (
        <PgBookingNotice
          kind={payload.notice ?? "no-availability"}
          onPrimary={() =>
            payload.notice === "provider-full"
              ? chat.showBookingBlock(
                  { kind: "notice", notice: "waitlist" },
                  "در لیست انتظار ثبتت کردم:",
                )
              : chat.showBookingBlock(
                  { kind: "calendar", providerId: provider?.id },
                  "نزدیک‌ترین روزهای آزاد:",
                )
          }
          onSecondary={() =>
            chat.showBookingBlock({ kind: "providers" }, "متخصص‌های جایگزین:")
          }
        />
      );

    default:
      return null;
  }
};
