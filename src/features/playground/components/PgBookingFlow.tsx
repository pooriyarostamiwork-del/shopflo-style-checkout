// Booking completion blocks: attendee form, review summary, confirmation card,
// reschedule/cancel states, and edge states. Presentation only.
import { useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CalendarX,
  Check,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Plus,
  ShieldCheck,
  Video,
  XCircle,
} from "lucide-react";

import { PgBookingCard } from "./PgBookingBlocks";
import {
  MODE_LABELS,
  PG_ATTENDEES,
  PgAttendeeProfile,
  PgBooking,
  PgProvider,
  PgService,
  bookingPricing,
  faDayLabel,
  faDuration,
  faPhone,
  faPrice,
  faTime,
  findDay,
  findSlot,
  toFa,
} from "../data/mockBooking";

export interface PgBookingFormValues {
  attendee: string;
  phone: string;
  mode: "in-person" | "online";
  note: string;
  insurance: string;
}


/* ---------- 5. attendee selection (saved profiles + add new) ---------- */

export const PgBookingForm = ({
  service,
  onSubmit,
}: {
  service?: PgService;
  onSubmit: (values: PgBookingFormValues) => void;
}) => {
  const modes: ("in-person" | "online")[] =
    service?.mode === "both" ? ["in-person", "online"] : [service?.mode ?? "in-person"];

  const [profiles, setProfiles] = useState<PgAttendeeProfile[]>(PG_ATTENDEES);
  const [selectedId, setSelectedId] = useState<string | null>(
    profiles.find((p) => p.isDefault)?.id ?? profiles[0]?.id ?? null,
  );
  const [mode, setMode] = useState<"in-person" | "online">(modes[0]);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(profiles.length === 0);
  const [draft, setDraft] = useState({ name: "", phone: "", insurance: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; note?: string }>(
    {},
  );

  const selected = profiles.find((p) => p.id === selectedId) ?? null;
  const field = "w-full h-10 rounded-lg border bg-background px-3 text-[13px] outline-none";

  const addProfile = () => {
    const next: typeof errors = {};
    if (draft.name.trim().length < 3) next.name = "نام و نام خانوادگی را کامل بنویس";
    if (!/^09\d{9}$/.test(draft.phone.replace(/[^\d]/g, "")))
      next.phone = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود";
    setErrors(next);
    if (Object.keys(next).length) return;

    const created: PgAttendeeProfile = {
      id: `att-${Date.now()}`,
      label: draft.name.trim().split(" ")[0],
      name: draft.name.trim(),
      phone: draft.phone.replace(/[^\d]/g, ""),
      relation: "مراجع",
      insurance: draft.insurance.trim() || undefined,
    };
    setProfiles((s) => [created, ...s]);
    setSelectedId(created.id);
    setDraft({ name: "", phone: "", insurance: "" });
    setShowForm(false);
  };

  const submit = () => {
    if (!selected) return;
    if (note.trim().length > 300) {
      setErrors({ note: "توضیح خیلی طولانی است" });
      return;
    }
    setErrors({});
    onSubmit({
      attendee: selected.name,
      phone: selected.phone,
      mode,
      note,
      insurance: selected.insurance ?? "",
    });
  };

  return (
    <PgBookingCard
      icon={<ClipboardList className="w-4 h-4" />}
      title="مشخصات نوبت"
      hint="مراجع را انتخاب کن یا مراجع جدید اضافه کن"
    >
      <div className="space-y-3">
        {/* add-new trigger */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full h-10 rounded-lg border border-dashed border-border text-[12px] text-primary inline-flex items-center justify-center gap-1.5 transition-colors hover:border-primary/50"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن مراجع جدید
          </button>
        )}

        {/* new profile form */}
        {showForm && (
          <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-3 space-y-3 pg-anim-in">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium">مراجع جدید</p>
              {profiles.length > 0 && (
                <button
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  انصراف
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                نام مراجع
              </label>
              <input
                value={draft.name}
                onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                maxLength={60}
                placeholder="مثلاً سارا محمدی"
                className={`${field} ${errors.name ? "border-destructive" : "border-border"}`}
              />
              {errors.name && (
                <p className="text-[11px] text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                شماره موبایل
              </label>
              <input
                value={draft.phone}
                onChange={(e) => setDraft((s) => ({ ...s, phone: e.target.value }))}
                inputMode="numeric"
                maxLength={14}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
                className={`${field} text-right ${errors.phone ? "border-destructive" : "border-border"}`}
              />
              {errors.phone && (
                <p className="text-[11px] text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                بیمه (اختیاری)
              </label>
              <input
                value={draft.insurance}
                onChange={(e) => setDraft((s) => ({ ...s, insurance: e.target.value }))}
                maxLength={40}
                placeholder="مثلاً تأمین اجتماعی"
                className={`${field} border-border`}
              />
            </div>

            <button
              onClick={addProfile}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-[13px]"
            >
              ذخیره مراجع
            </button>
          </div>
        )}

        {/* saved profiles */}
        <div className="space-y-2">
          {profiles.map((p) => {
            const active = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-right rounded-xl border p-3 transition-colors ${
                  active
                    ? "border-primary bg-primary/[0.04]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full border shrink-0 inline-flex items-center justify-center ${
                      active ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {active && (
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    )}
                  </span>
                  <p className="text-[12.5px] font-medium truncate">{p.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-border text-muted-foreground shrink-0">
                    {p.relation}
                  </span>
                  {p.isDefault && (
                    <span className="text-[10px] text-primary shrink-0">پیش‌فرض</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 ps-6">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {faPhone(p.phone)}
                  </span>
                  {p.insurance && (
                    <span className="text-[11px] text-muted-foreground">
                      · {p.insurance}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {modes.length > 1 && (
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">
              نوع جلسه
            </label>
            <div className="flex gap-2">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 h-10 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-colors ${
                    mode === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {m === "online" ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">
            علت مراجعه (اختیاری)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={320}
            placeholder="کوتاه بنویس تا متخصص آماده باشد"
            className={`w-full rounded-lg border bg-background p-3 text-[13px] outline-none resize-none ${
              errors.note ? "border-destructive" : "border-border"
            }`}
          />
          {errors.note && (
            <p className="text-[11px] text-destructive mt-1">{errors.note}</p>
          )}
        </div>

        {service?.prep?.length ? (
          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] font-medium mb-1.5">آماده‌سازی پیش از جلسه</p>
            <ul className="space-y-1">
              {service.prep.map((pr) => (
                <li
                  key={pr}
                  className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                >
                  <BadgeCheck className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                  {pr}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          onClick={submit}
          disabled={!selected}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-[13px] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          بررسی نهایی نوبت
        </button>
      </div>
    </PgBookingCard>
  );
};


/* ---------- 6. review summary ---------- */

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 text-[12px]">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium tabular-nums">{value}</span>
  </div>
);



export const PgBookingSummary = ({
  service,
  provider,
  dayKey,
  slotId,
  values,
  onConfirm,
  onEdit,
}: {
  service?: PgService;
  provider?: PgProvider;
  dayKey: string;
  slotId: string;
  values: PgBookingFormValues;
  onConfirm: () => void;
  onEdit: () => void;
}) => {
  const day = provider ? findDay(provider.id, dayKey) : undefined;
  const slot = findSlot(dayKey, slotId);
  const p = bookingPricing(service);
  const online = values.mode === "online";

  return (
    <PgBookingCard
      icon={<ShieldCheck className="w-4 h-4" />}
      title="تأیید نهایی نوبت"
      hint={service?.name ?? "یک قدم تا ثبت نوبت"}
    >
      {/* unified detail card: time + people */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* time */}
        <div className="px-3.5 py-3 bg-muted/50">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground mb-1">زمان نوبت</p>
              <p className="text-[13px] font-medium truncate">{faDayLabel(day)}</p>
            </div>
            <div className="text-left shrink-0">
              <p className="text-xl font-semibold leading-none tabular-nums">
                {faTime(slot?.time)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {faDuration(service?.duration ?? 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-border bg-background text-[11px]">
              {online ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {MODE_LABELS[values.mode]}
            </span>
            {online && (
              <span className="text-[11px] text-muted-foreground">
                لینک جلسه پیش از نوبت پیامک می‌شود
              </span>
            )}
          </div>
        </div>

        {/* provider */}
        {provider && (
          <div className="px-3.5 py-3 border-t border-border flex items-center gap-2.5">
            <img
              src={provider.avatar}
              alt={provider.name}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium truncate">{provider.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {provider.title}
              </p>
            </div>
          </div>
        )}

        {/* attendee — no avatar */}
        <div className="px-3.5 py-3 border-t border-border flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground shrink-0">مراجع</span>
          <div className="min-w-0 text-left">
            <p className="text-[12.5px] font-medium truncate">{values.attendee}</p>
            {values.phone && (
              <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                {faPhone(values.phone)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* price */}
      <div className="mt-3.5 pt-3.5 border-t border-border">
        <Row label="هزینه خدمت" value={faPrice(p.fee)} />
        <div className="mt-1.5">
          <Row label="مالیات و کارمزد" value={faPrice(p.tax)} />
        </div>
        <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-border">
          <span className="text-[12px] text-muted-foreground">مبلغ قابل پرداخت</span>
          <span className="text-lg font-semibold tabular-nums">{faPrice(p.total)}</span>
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 mt-3.5">
        <button
          onClick={onConfirm}
          className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium transition-opacity hover:opacity-90"
        >
          ثبت و پرداخت
        </button>
        <button
          onClick={onEdit}
          className="h-11 px-4 rounded-xl border border-border text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          ویرایش
        </button>
      </div>
    </PgBookingCard>
  );
};


/* ---------- 7. confirmation ---------- */

export const PgBookingConfirmation = ({
  booking,
  service,
  provider,
  onReschedule,
  onCancel,
  onAddCalendar,
}: {
  booking: PgBooking;
  service?: PgService;
  provider?: PgProvider;
  onReschedule: () => void;
  onCancel: () => void;
  onAddCalendar?: () => void;
}) => {
  const day = provider ? findDay(provider.id, booking.dayKey) : undefined;
  const slot = findSlot(booking.dayKey, booking.slotId);
  const cancelled = booking.status === "cancelled";

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        {cancelled ? (
          <XCircle className="w-4 h-4 text-destructive" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-primary" />
        )}
        <div>
          <p className="text-[13px] font-medium leading-tight">
            {cancelled
              ? "نوبت لغو شد"
              : booking.status === "rescheduled"
                ? "نوبت جابه‌جا شد"
                : "نوبت ثبت شد"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            کد پیگیری {booking.code}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div
          className={`rounded-xl border border-border p-3 ${cancelled ? "opacity-60" : ""}`}
        >
          <p className="text-[13px] font-medium">{service?.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {provider?.name} · {provider?.title}
          </p>
          <div className="flex items-center gap-3 mt-2.5 text-[12px]">
            <span className="flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
              {faDayLabel(day)}
            </span>
            <span className="font-medium">{faTime(slot?.time)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            {booking.mode === "online" ? (
              <Video className="w-3 h-3" />
            ) : (
              <MapPin className="w-3 h-3" />
            )}
            {booking.mode === "online"
              ? "لینک جلسه ۳۰ دقیقه قبل پیامک می‌شود"
              : provider?.location}
          </div>
        </div>

        {booking.previous && !cancelled && (
          <p className="text-[11px] text-muted-foreground mt-2">
            زمان قبلی: {faDayLabel(provider ? findDay(provider.id, booking.previous.dayKey) : undefined)}{" "}
            · {faTime(findSlot(booking.previous.dayKey, booking.previous.slotId)?.time)}
          </p>
        )}

        {!cancelled && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onReschedule}
              className="flex-1 h-9 rounded-lg border border-border text-xs"
            >
              تغییر زمان
            </button>
            <button
              onClick={onCancel}
              className="flex-1 h-9 rounded-lg border border-border text-xs text-destructive"
            >
              لغو نوبت
            </button>
            {onAddCalendar && (
              <button
                onClick={onAddCalendar}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs"
              >
                افزودن به تقویم
              </button>
            )}
          </div>
        )}

        {!cancelled && (
          <p className="text-[11px] text-muted-foreground mt-2.5">
            یادآوری {toFa(24)} ساعت و {toFa(1)} ساعت قبل از نوبت برایت ارسال می‌شود.
          </p>
        )}
      </div>
    </div>
  );
};

/* ---------- 8. edge states ---------- */

export const PgBookingNotice = ({
  kind,
  onPrimary,
  onSecondary,
}: {
  kind: "no-availability" | "slot-taken" | "provider-full" | "waitlist";
  onPrimary?: () => void;
  onSecondary?: () => void;
}) => {
  const copy = {
    "no-availability": {
      icon: <CalendarX className="w-4 h-4 text-destructive" />,
      title: "برای این روز نوبت آزادی نمانده",
      body: "می‌توانم نزدیک‌ترین روز آزاد را نشان بدهم یا متخصص دیگری پیشنهاد کنم.",
      primary: "نزدیک‌ترین روز آزاد",
      secondary: "متخصص دیگر",
    },
    "slot-taken": {
      icon: <AlertCircle className="w-4 h-4 text-destructive" />,
      title: "این ساعت همین حالا رزرو شد",
      body: "ساعت‌های نزدیک به انتخاب تو را دوباره آوردم.",
      primary: "ساعت‌های نزدیک",
      secondary: "روز دیگر",
    },
    "provider-full": {
      icon: <CalendarX className="w-4 h-4 text-destructive" />,
      title: "ظرفیت این متخصص تکمیل است",
      body: "می‌توانی در لیست انتظار بمانی یا متخصص هم‌رده را ببینی.",
      primary: "لیست انتظار",
      secondary: "متخصص هم‌رده",
    },
    waitlist: {
      icon: <BadgeCheck className="w-4 h-4 text-primary" />,
      title: "در لیست انتظار ثبت شدی",
      body: "به‌محض آزاد شدن نوبت، همین‌جا خبرت می‌کنم.",
      primary: "دیدن روزهای آزاد",
      secondary: "",
    },
  }[kind];

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-2">
        {copy.icon}
        <div className="min-w-0">
          <p className="text-[13px] font-medium">{copy.title}</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {copy.body}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        {onPrimary && (
          <button
            onClick={onPrimary}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs"
          >
            {copy.primary}
          </button>
        )}
        {onSecondary && copy.secondary && (
          <button
            onClick={onSecondary}
            className="h-9 px-3 rounded-lg border border-border text-xs text-muted-foreground"
          >
            {copy.secondary}
          </button>
        )}
      </div>
    </div>
  );
};
