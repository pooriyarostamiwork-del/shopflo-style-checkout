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
import { PgProviderProfileDrawer } from "./PgProviderProfileDrawer";

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

export const PgProviderCards = ({
  providers,
  service,
  selectedId,
  onPick,
  title = "کدوم متخصص رو ترجیح می‌دی؟",
  hint,
}: {
  providers: PgProvider[];
  service?: PgService;
  selectedId?: string | null;
  onPick: (p: PgProvider) => void;
  title?: string;
  hint?: string;
}) => {
  const [profile, setProfile] = useState<PgProvider | null>(null);

  return (
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
            className={`p-3 rounded-xl border transition-colors ${
              selectedId === p.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <img
                src={p.avatar}
                alt={p.name}
                loading="lazy"
                className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.title} · {p.specialty}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <Star className="w-3 h-3 text-primary" />
                  <span className="text-foreground">{toFa(p.rating)}</span>
                  <span>({toFa(p.reviews)})</span>
                  <span>·</span>
                  <span>{toFa(p.years)} سال تجربه</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
              {p.modes.includes("online") ? (
                <Video className="w-3 h-3" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              <span className="truncate">{p.location}</span>
            </div>

            <div className="flex items-center gap-2 mt-2.5">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
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
              {service && (
                <span className="text-[11px] text-muted-foreground ms-auto">
                  {faPrice(service.price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onPick(p)}
                disabled={full}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs disabled:opacity-40"
              >
                انتخاب وقت
              </button>
              <button
                onClick={() => setProfile(p)}
                className="h-9 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                توضیحات
              </button>
            </div>
          </div>
        );
      })}
    </div>

    <PgProviderProfileDrawer
      provider={profile}
      service={service}
      onClose={() => setProfile(null)}
      onPick={onPick}
    />
  </PgBookingCard>
  );
};

/* ---------- 3. availability calendar rail ---------- */

export const PgAvailabilityCalendar = ({
  providerId,
  selectedKey,
  onPick,
  title = "کدوم روز برات مناسبه؟",
  hint,
}: {
  providerId: string;
  selectedKey?: string | null;
  onPick: (day: PgDay) => void;
  title?: string;
  hint?: string;
}) => {
  const [count, setCount] = useState(7);
  const days = buildDays(providerId, count);
  const month = days[0]?.monthLabel;

  return (
    <PgBookingCard
      icon={<CalendarDays className="w-4 h-4" />}
      title={title}
      hint={hint ?? `${month} — روزهای خاکستری تعطیل یا پرشده‌اند`}
    >
      <div className="flex gap-2 overflow-x-auto pg-scroll-hidden pb-1">
        {days.map((d) => (
          <button
            key={d.key}
            onClick={() => !d.closed && onPick(d)}
            disabled={d.closed}
            className={`shrink-0 w-[62px] py-2.5 rounded-xl border text-center transition-colors ${
              selectedKey === d.key
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
        <button onClick={() => setCount(14)} className="mt-3 text-[11px] text-primary">
          روزهای بیشتر
        </button>
      )}
    </PgBookingCard>
  );
};

/* ---------- 4. time-slot picker ---------- */

export const PgSlotPicker = ({
  dayKey,
  dayLabel,
  duration,
  selectedId,
  onPick,
  onAskOther,
  title = "ساعت مراجعه رو انتخاب کن",
}: {
  dayKey: string;
  dayLabel: string;
  duration: number;
  selectedId?: string | null;
  onPick: (slot: PgSlot) => void;
  onAskOther?: () => void;
  title?: string;
}) => {
  const slots = buildSlots(dayKey);
  const parts: PgSlot["part"][] = ["morning", "afternoon", "evening"];

  return (
    <PgBookingCard
      icon={<Clock className="w-4 h-4" />}
      title={title}
      hint={`${dayLabel} · هر نوبت ${faDuration(duration)} · به وقت تهران`}
    >
      <div className="space-y-3">
        {parts.map((part) => {
          const list = slots.filter((s) => s.part === part);
          if (!list.length) return null;
          return (
            <div key={part}>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                {PART_LABELS[part]}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => !s.taken && onPick(s)}
                    disabled={s.taken}
                    className={`h-9 rounded-lg border text-xs transition-colors ${
                      selectedId === s.id
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

      {onAskOther && (
        <button onClick={onAskOther} className="mt-3 text-[11px] text-primary">
          زمان دیگری پیشنهاد بده
        </button>
      )}
    </PgBookingCard>
  );
};
