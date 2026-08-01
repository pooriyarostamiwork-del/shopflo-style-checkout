// Playground mock data for in-chat service booking (doctor visits, consultations,
// grooming sessions). Fully local & deterministic — no network, no backend.
import { toFa, faPrice } from "./mockStore";

export type PgServiceMode = "in-person" | "online" | "both";

export interface PgService {
  id: string;
  name: string;
  category: string;
  /** minutes */
  duration: number;
  price: number;
  mode: PgServiceMode;
  summary: string;
  prep: string[];
}

export interface PgProvider {
  id: string;
  name: string;
  title: string;
  specialty: string;
  rating: number;
  reviews: number;
  years: number;
  avatar: string;
  serviceIds: string[];
  location: string;
  modes: PgServiceMode[];
  /** relative day offset of the first open day; 99 = fully booked */
  nextOpenIn: number;
}

export interface PgSlot {
  id: string;
  /** HH:MM 24h */
  time: string;
  taken: boolean;
  part: "morning" | "afternoon" | "evening";
}

export interface PgDay {
  /** ISO-ish key, deterministic */
  key: string;
  /** relative day offset from today */
  offset: number;
  weekday: string;
  dayLabel: string;
  monthLabel: string;
  openCount: number;
  closed: boolean;
}

export type PgBookingStatus = "confirmed" | "rescheduled" | "cancelled";

export interface PgBooking {
  code: string;
  serviceId: string;
  providerId: string;
  dayKey: string;
  slotId: string;
  attendee: string;
  phone: string;
  mode: "in-person" | "online";
  note?: string;
  insurance?: string;
  status: PgBookingStatus;
  previous?: { dayKey: string; slotId: string };
}

/* ---------- catalog ---------- */

export const PG_SERVICE_CATEGORIES = ["پزشکی", "مشاوره", "دام‌پزشکی", "زیبایی"];

export const PG_SERVICES: PgService[] = [
  {
    id: "svc-visit",
    name: "ویزیت عمومی پزشک",
    category: "پزشکی",
    duration: 20,
    price: 480_000,
    mode: "both",
    summary: "معاینه اولیه، بررسی علائم و تجویز دارو یا آزمایش.",
    prep: ["مدارک آزمایش قبلی را همراه داشته باش", "۱۰ دقیقه پیش‌تر برس"],
  },
  {
    id: "svc-specialist",
    name: "ویزیت تخصصی داخلی",
    category: "پزشکی",
    duration: 30,
    price: 890_000,
    mode: "in-person",
    summary: "بررسی تخصصی، تفسیر آزمایش و برنامه درمان.",
    prep: ["لیست داروهای مصرفی را بنویس", "ناشتا بودن لازم نیست"],
  },
  {
    id: "svc-teleconsult",
    name: "مشاوره آنلاین تغذیه",
    category: "مشاوره",
    duration: 45,
    price: 620_000,
    mode: "online",
    summary: "جلسه تصویری با تنظیم برنامه غذایی شخصی‌سازی‌شده.",
    prep: ["وزن و قد به‌روز را آماده داشته باش", "اینترنت پایدار لازم است"],
  },
  {
    id: "svc-psy",
    name: "جلسه روان‌درمانی",
    category: "مشاوره",
    duration: 50,
    price: 750_000,
    mode: "both",
    summary: "جلسه انفرادی با رویکرد شناختی‌رفتاری.",
    prep: ["فضایی آرام و خصوصی انتخاب کن"],
  },
  {
    id: "svc-vet",
    name: "معاینه دام‌پزشکی حیوان خانگی",
    category: "دام‌پزشکی",
    duration: 25,
    price: 540_000,
    mode: "in-person",
    summary: "معاینه کامل، بررسی واکسن و مشاوره تغذیه.",
    prep: ["کارت واکسن حیوان را همراه بیاور", "از باکس حمل استفاده کن"],
  },
  {
    id: "svc-groom",
    name: "آرایش و شست‌وشوی حیوان",
    category: "زیبایی",
    duration: 60,
    price: 390_000,
    mode: "in-person",
    summary: "حمام، کوتاهی مو و مراقبت ناخن و گوش.",
    prep: ["۲ ساعت قبل غذا نده"],
  },
];

const avatar = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=200&q=70`;

export const PG_PROVIDERS: PgProvider[] = [
  {
    id: "prv-1",
    name: "دکتر سارا کریمی",
    title: "پزشک عمومی",
    specialty: "پزشکی خانواده",
    rating: 4.9,
    reviews: 412,
    years: 11,
    avatar: avatar("1559839734-2b71ea197ec2"),
    serviceIds: ["svc-visit", "svc-specialist"],
    location: "کلینیک مرکزی، ولیعصر",
    modes: ["in-person", "online"],
    nextOpenIn: 0,
  },
  {
    id: "prv-2",
    name: "دکتر امید رستمی",
    title: "متخصص داخلی",
    specialty: "بیماری‌های گوارش",
    rating: 4.7,
    reviews: 268,
    years: 15,
    avatar: avatar("1622253692010-333f2da6031d"),
    serviceIds: ["svc-specialist", "svc-visit"],
    location: "کلینیک شمال، میرداماد",
    modes: ["in-person"],
    nextOpenIn: 2,
  },
  {
    id: "prv-3",
    name: "مهسا احمدی",
    title: "کارشناس تغذیه",
    specialty: "رژیم درمانی",
    rating: 4.8,
    reviews: 197,
    years: 8,
    avatar: avatar("1594824476967-48c8b964273f"),
    serviceIds: ["svc-teleconsult"],
    location: "جلسه تصویری",
    modes: ["online"],
    nextOpenIn: 0,
  },
  {
    id: "prv-4",
    name: "دکتر نیما فرهادی",
    title: "روان‌شناس",
    specialty: "درمان شناختی‌رفتاری",
    rating: 4.6,
    reviews: 134,
    years: 9,
    avatar: avatar("1537368910025-700350fe46c7"),
    serviceIds: ["svc-psy"],
    location: "مطب سعادت‌آباد",
    modes: ["in-person", "online"],
    nextOpenIn: 1,
  },
  {
    id: "prv-5",
    name: "دکتر لیلا نوری",
    title: "دام‌پزشک",
    specialty: "حیوانات خانگی کوچک",
    rating: 4.9,
    reviews: 322,
    years: 12,
    avatar: avatar("1582750433449-648ed127bb54"),
    serviceIds: ["svc-vet", "svc-groom"],
    location: "درمانگاه پت‌پلی‌گراند",
    modes: ["in-person"],
    nextOpenIn: 99,
  },
];

export const findService = (id?: string | null) =>
  PG_SERVICES.find((s) => s.id === id);
export const findProvider = (id?: string | null) =>
  PG_PROVIDERS.find((p) => p.id === id);

export const providersForService = (serviceId: string) =>
  PG_PROVIDERS.filter((p) => p.serviceIds.includes(serviceId));

/* ---------- Persian date labels (display only, deterministic) ---------- */

const FA_WEEKDAYS = [
  "شنبه",
  "یک‌شنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

/** Static Jalali-style anchor so labels are stable across renders. */
const ANCHOR = { day: 12, month: 4, weekdayIndex: 2 }; // ۱۲ تیر، دوشنبه
const FA_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const MONTH_DAYS = 31;

const hash = (s: string) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

export const buildDays = (providerId: string, count = 14): PgDay[] => {
  const provider = findProvider(providerId);
  const fullyBooked = provider?.nextOpenIn === 99;
  return Array.from({ length: count }, (_, offset) => {
    let day = ANCHOR.day + offset;
    let monthIdx = ANCHOR.month - 1;
    while (day > MONTH_DAYS) {
      day -= MONTH_DAYS;
      monthIdx = (monthIdx + 1) % 12;
    }
    const weekday = FA_WEEKDAYS[(ANCHOR.weekdayIndex + offset) % 7];
    const key = `${providerId}:${offset}`;
    const h = hash(key);
    const closed =
      weekday === "جمعه" ||
      fullyBooked ||
      (provider ? offset < provider.nextOpenIn && provider.nextOpenIn !== 99 : false);
    return {
      key,
      offset,
      weekday,
      dayLabel: toFa(day),
      monthLabel: FA_MONTHS[monthIdx],
      openCount: closed ? 0 : 2 + (h % 7),
      closed,
    };
  });
};

const TIMES: { time: string; part: PgSlot["part"] }[] = [
  { time: "09:00", part: "morning" },
  { time: "09:30", part: "morning" },
  { time: "10:15", part: "morning" },
  { time: "11:00", part: "morning" },
  { time: "11:45", part: "morning" },
  { time: "13:30", part: "afternoon" },
  { time: "14:15", part: "afternoon" },
  { time: "15:00", part: "afternoon" },
  { time: "16:30", part: "afternoon" },
  { time: "18:00", part: "evening" },
  { time: "18:45", part: "evening" },
  { time: "19:30", part: "evening" },
];

export const PART_LABELS: Record<PgSlot["part"], string> = {
  morning: "صبح",
  afternoon: "بعدازظهر",
  evening: "شب",
};

export const buildSlots = (dayKey: string): PgSlot[] => {
  const h = hash(dayKey);
  return TIMES.map((t, i) => ({
    id: `${dayKey}:${t.time}`,
    time: t.time,
    part: t.part,
    taken: (h + i * 13) % 3 === 0,
  }));
};

export const findDay = (providerId: string, dayKey: string) =>
  buildDays(providerId).find((d) => d.key === dayKey);

export const findSlot = (dayKey: string, slotId: string) =>
  buildSlots(dayKey).find((s) => s.id === slotId);

/* ---------- labels & money ---------- */

export const faDayLabel = (d?: PgDay) =>
  d ? `${d.weekday} ${d.dayLabel} ${d.monthLabel}` : "—";

export const faTime = (time?: string) =>
  time ? `\u2068${toFa(time.replace(":", ":"))}\u2069` : "—";

export const faDuration = (minutes: number) => `\u2068${toFa(minutes)} دقیقه\u2069`;

export const MODE_LABELS: Record<"in-person" | "online", string> = {
  "in-person": "حضوری",
  online: "آنلاین",
};

export interface PgBookingPricing {
  fee: number;
  deposit: number;
  tax: number;
  total: number;
}

export const bookingPricing = (service?: PgService): PgBookingPricing => {
  const fee = service?.price ?? 0;
  const tax = Math.round(fee * 0.09);
  const deposit = Math.round((fee + tax) * 0.3);
  return { fee, deposit, tax, total: fee + tax };
};

export const bookingCode = (seed: number) =>
  `BK-${(1000 + (seed % 9000)).toString()}`;

export { faPrice, toFa };
