// In-chat booking selection blocks: service picker, provider cards,
// availability calendar rail, time-slot picker. Presentation only.
import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  MapPin,
  Star,
  Video,
  User,
} from "lucide-react";
import {
  PART_LABELS,
  PgDay,
  PgProvider,
  PgService,
  PgSlot,
  buildDays,
  buildSlots,
  faDuration,
  faPrice,
  faTime,
  toFa,
} from "../data/mockBooking";

/* ---------- shared shell ---------- */

export const PgBookingCard = ({
  icon,
  title,
  hint,
  onSkip,
  skipLabel = "بی‌خیال",
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  onSkip?: () => void;
  skipLabel?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border bg-background overflow-hidden">
    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
      {icon && <span className="text-primary">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight">{title}</p>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{hint}</p>
        )}
      </div>
      {onSkip && (
        <button
          onClick={onSkip}
          className="ms-auto text-[11px] text-muted-foreground hover:text-foreground shrink-0"
        >
          {skipLabel}
        </button>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const ModeBadge = ({ mode }: { mode: PgService["mode"] }) => {
  const label =
    mode === "online" ? "آنلاین" : mode === "in-person" ? "حضوری" : "حضوری یا آنلاین";
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-border text-muted-foreground shrink-0">
      {label}
    </span>
  );
};

/* ---------- 1. service picker ---------- */

export const PgServicePicker = ({
  services,
  categories,
  onPick,
  onSkip,
}: {
  services: PgService[];
  categories: string[];
  onPick: (service: PgService) => void;
  onSkip?: () => void;
}) => {
  const available = categories.filter((c) => services.some((s) => s.category === c));
  const [cat, setCat] = useState<string>(available[0] ?? "");
  const list = services.filter((s) => s.category === cat);

  return (
    <PgBookingCard
      icon={<CalendarDays className="w-4 h-4" />}
      title="چه خدمتی می‌خوای رزرو کنی؟"
      hint="دسته را انتخاب کن و بعد خدمت مورد نظر"
      onSkip={onSkip}
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {available.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="w-full text-right p-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{s.name}</span>
              <ModeBadge mode={s.mode} />
              <ChevronLeft className="w-4 h-4 text-muted-foreground ms-auto shrink-0" />
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {s.summary}
            </span>
            <span className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {faDuration(s.duration)}
              </span>
              <span className="text-foreground">{faPrice(s.price)}</span>
            </span>
          </button>
        ))}
      </div>
    </PgBookingCard>
  );
};

/* ---------- 2. provider cards ---------- */

const ProviderModeChips = ({ modes }: { modes: PgProvider["modes"] }) => (
  <>
    {modes.includes("in-person") && (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
        <MapPin className="w-3 h-3" />
        حضوری
      </span>
    )}
    {modes.includes("online") && (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
        <Video className="w-3 h-3" />
        آنلاین
      </span>
    )}
  </>
);

export const PgProviderCards = ({
  providers,
  service,
  selectedId,
  onPick,
  onDetails,
  title = "کدوم متخصص رو ترجیح می‌دی؟",
  hint,
}: {
  providers: PgProvider[];
  service?: PgService;
  selectedId?: string | null;
  onPick: (p: PgProvider) => void;
  onDetails?: (p: PgProvider) => void;
  title?: string;
  hint?: string;
}) => (
  <PgBookingCard
    icon={<User className="w-4 h-4" />}
    title={title}
    hint={hint ?? (service ? `برای «${service.name}»` : undefined)}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {providers.map((p) => {
        const full = p.nextOpenIn === 99;
        return (
          <div
            key={p.id}
            className={`p-3.5 rounded-2xl border transition-colors ${
              selectedId === p.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <img
                src={p.avatar}
                alt={p.name}
                loading="lazy"
                className="w-[50px] h-[50px] rounded-full object-cover border border-border shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {p.title} · {p.specialty}
                </p>
                {!!p.tags?.length && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-primary" />
                <span className="text-foreground">{toFa(p.rating)}</span>
                <span>({toFa(p.reviews)})</span>
              </span>
              <span className="opacity-40">·</span>
              <span>{toFa(p.years)} سال تجربه</span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{p.location}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <ProviderModeChips modes={p.modes} />
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  full
                    ? "border-border text-muted-foreground"
                    : "border-primary/40 text-primary"
                }`}
              >
                {full
                  ? "ظرفیت تکمیل"
                  : p.nextOpenIn === 0
                    ? "نوبت خالی امروز"
                    : `اولین نوبت ${toFa(p.nextOpenIn)} روز دیگر`}
              </span>
            </div>

            {service && (
              <div className="flex items-baseline gap-2 mt-3 pt-3 border-t border-border">
                <span className="text-[13px] font-medium">{faPrice(service.price)}</span>
                <span className="text-[11px] text-muted-foreground">
                  · {faDuration(service.duration)} جلسه
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onPick(p)}
                disabled={full}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-medium transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:hover:opacity-40"
              >
                انتخاب وقت
              </button>
              <button
                onClick={() => onDetails?.(p)}
                className="h-10 px-3 rounded-xl border border-border text-xs text-muted-foreground inline-flex items-center gap-1 transition-colors hover:border-primary/40 hover:text-foreground"
              >
                توضیحات
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </PgBookingCard>
);

/* ---------- 3. unified scheduler (date + time in one card) ---------- */

export const PgScheduler = ({
  providerId,
  duration,
  initialDayKey,
  initialSlotId,
  onDayChange,
  onSlotChange,
  onConfirm,
  onAskOther,
  title = "زمان نوبت را انتخاب کن",
}: {
  providerId: string;
  duration: number;
  initialDayKey?: string | null;
  initialSlotId?: string | null;
  onDayChange?: (day: PgDay) => void;
  onSlotChange?: (slot: PgSlot) => void;
  onConfirm: (day: PgDay, slot: PgSlot) => void;
  onAskOther?: () => void;
  title?: string;
}) => {
  const [count, setCount] = useState(7);
  const days = buildDays(providerId, count);
  const firstOpen = days.find((d) => !d.closed);
  const [dayKey, setDayKey] = useState<string | null>(
    initialDayKey ?? firstOpen?.key ?? null,
  );
  const [slotId, setSlotId] = useState<string | null>(initialSlotId ?? null);

  const day = days.find((d) => d.key === dayKey) ?? firstOpen;
  const slots = day ? buildSlots(day.key) : [];
  const free = slots.filter((s) => !s.taken);
  const slot = slots.find((s) => s.id === slotId) ?? null;
  const parts: PgSlot["part"][] = ["morning", "afternoon", "evening"];

  const suggestion = days.find(
    (d) => !d.closed && d.key !== day?.key && buildSlots(d.key).some((s) => !s.taken),
  );

  const selectDay = (d: PgDay) => {
    setDayKey(d.key);
    setSlotId(null);
    onDayChange?.(d);
  };

  return (
    <PgBookingCard
      icon={<CalendarDays className="w-4 h-4" />}
      title={title}
      hint={`${days[0]?.monthLabel ?? ""} · هر نوبت ${faDuration(duration)} · به وقت تهران`}
    >
      {/* date rail */}
      <div className="flex gap-2 overflow-x-auto pg-scroll-hidden pb-1">
        {days.map((d) => (
          <button
            key={d.key}
            onClick={() => !d.closed && selectDay(d)}
            disabled={d.closed}
            className={`shrink-0 w-[64px] py-2.5 rounded-xl border text-center transition-colors ${
              day?.key === d.key
                ? "border-primary bg-primary text-primary-foreground"
                : d.closed
                  ? "border-border/60 text-muted-foreground/50 cursor-not-allowed"
                  : "border-border hover:border-primary/50"
            }`}
          >
            <span className="block text-[10px] opacity-80">{d.weekday}</span>
            <span className="block text-base font-medium leading-tight mt-0.5">
              {d.dayLabel}
            </span>
            <span className="block text-[10px] mt-1 opacity-80">
              {d.closed ? "تعطیل" : `${toFa(d.openCount)} نوبت`}
            </span>
          </button>
        ))}
      </div>

      {count === 7 && (
        <button onClick={() => setCount(14)} className="mt-2.5 text-[11px] text-primary">
          روزهای بیشتر
        </button>
      )}

      {/* slots for selected day */}
      <div key={day?.key} className="mt-3 pt-3 border-t border-border pg-anim-in">
        {!day || !free.length ? (
          <div className="text-center py-4">
            <p className="text-[12px] text-muted-foreground">
              این روز ظرفیت خالی ندارد.
            </p>
            {suggestion && (
              <button
                onClick={() => selectDay(suggestion)}
                className="mt-2 text-[11px] px-3 py-1.5 rounded-full border border-primary/40 text-primary"
              >
                نزدیک‌ترین روز آزاد: {suggestion.weekday} {suggestion.dayLabel}{" "}
                {suggestion.monthLabel}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {parts.map((part) => {
              const list = slots.filter((s) => s.part === part);
              if (!list.length) return null;
              return (
                <div key={part} className="flex items-start gap-3">
                  <p className="text-[11px] text-muted-foreground w-14 pt-2.5 shrink-0">
                    {PART_LABELS[part]}
                  </p>
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {list.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (s.taken) return;
                          setSlotId(s.id);
                          onSlotChange?.(s);
                        }}
                        disabled={s.taken}
                        className={`h-9 rounded-xl border text-xs transition-colors ${
                          slotId === s.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : s.taken
                              ? "border-border/60 text-muted-foreground/50 line-through cursor-not-allowed"
                              : "border-border hover:border-primary/50"
                        }`}
                      >
                        {faTime(s.time)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* footer summary + single CTA */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] truncate">
            {day && slot
              ? `${day.weekday} ${day.dayLabel} ${day.monthLabel} · ${faTime(slot.time)}`
              : "روز و ساعت را انتخاب کن"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {faDuration(duration)}
            {onAskOther && (
              <>
                {" · "}
                <button onClick={onAskOther} className="text-primary">
                  زمان دیگری پیشنهاد بده
                </button>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => day && slot && onConfirm(day, slot)}
          disabled={!day || !slot}
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-medium transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:hover:opacity-40 shrink-0"
        >
          تأیید زمان
        </button>
      </div>
    </PgBookingCard>
  );
};

