// Mock data for vendor dashboard. Frontend-only — wire to backend later.

export type WithdrawalStatus = "pending" | "processing" | "completed" | "failed";

export interface OnboardingItem {
  key: string;
  label: string;
  done: boolean;
}

export interface RevenueSnapshot {
  revenue: number;
  orders: number;
  aov: number;
  commission: number;
  deltaPct: number; // +/- vs previous period
}

export interface WithdrawalRow {
  id: string;
  date: string;
  amount: number;
  status: WithdrawalStatus;
}

export const IRANIAN_BANKS = [
  "بانک ملی ایران",
  "بانک ملت",
  "بانک صادرات ایران",
  "بانک تجارت",
  "بانک سپه",
  "بانک پارسیان",
  "بانک پاسارگاد",
  "بانک سامان",
  "بانک اقتصاد نوین",
  "بانک شهر",
  "بانک کشاورزی",
  "بانک رفاه کارگران",
];

export const BUSINESS_TYPES = [
  "خرده‌فروشی",
  "عمده‌فروشی",
  "خدمات",
  "تولیدی",
  "صنایع دستی",
  "غذا و نوشیدنی",
];

export const mockVendor = {
  storeName: "فروشگاه نمونه",
  todayLabel: "چهارشنبه، ۱۴ خرداد",
  onboarding: {
    complete: false,
    percent: 75,
    items: [
      { key: "profile", label: "تکمیل پروفایل کسب‌وکار", done: true },
      { key: "verify", label: "احراز اطلاعات کسب‌وکار", done: true },
      { key: "bank", label: "افزودن حساب بانکی", done: true },
      { key: "tax", label: "بارگذاری اطلاعات مالیاتی", done: false },
      { key: "agreement", label: "امضای قرارداد فروشنده", done: false },
    ] as OnboardingItem[],
  },
  home: {
    revenue: 12_500_000,
    orders: 42,
    activeProducts: 342,
    aov: 297_000,
    pendingSettlement: 3_250_000,
    withdrawableBalance: 1_800_000,
    deltas: { revenue: 12, orders: 8, activeProducts: 2, aov: -4 },
  },

  revenueByRange: {
    day:   { revenue: 420_000,    orders: 2,  aov: 210_000, commission: 21_000,  deltaPct: 6 } as RevenueSnapshot,
    week:  { revenue: 2_900_000,  orders: 11, aov: 263_000, commission: 145_000, deltaPct: 9 } as RevenueSnapshot,
    month: { revenue: 12_500_000, orders: 42, aov: 297_000, commission: 625_000, deltaPct: 12 } as RevenueSnapshot,
  },
  trendByRange: {
    day:   [120, 90, 150, 80, 210, 180, 240, 200, 260, 220, 310, 280],
    week:  [320, 380, 410, 360, 480, 450, 520],
    month: [800, 1100, 950, 1300, 1200, 1500, 1400, 1700, 1600, 1850, 1900, 2050],
  },
  payouts: {
    withdrawable: 1_800_000,
    pending: 3_250_000,
    totalWithdrawn: 24_500_000,
  },

  withdrawals: [
    { id: "WD-1405-0301", date: "۱۴۰۵/۰۳/۰۱", amount: 2_000_000, status: "completed" as WithdrawalStatus },
    { id: "WD-1405-0220", date: "۱۴۰۵/۰۲/۲۰", amount: 1_500_000, status: "completed" as WithdrawalStatus },
    { id: "WD-1405-0210", date: "۱۴۰۵/۰۲/۱۰", amount: 3_000_000, status: "completed" as WithdrawalStatus },
    { id: "WD-1405-0201", date: "۱۴۰۵/۰۲/۰۱", amount: 800_000,   status: "processing" as WithdrawalStatus },
    { id: "WD-1405-0125", date: "۱۴۰۵/۰۱/۲۵", amount: 500_000,   status: "pending" as WithdrawalStatus },
  ] as WithdrawalRow[],
  profile: {
    businessName: "فروشگاه نمونه",
    description: "ارائه‌دهنده محصولات با کیفیت برای مشتریان.",
    supportPhone: "02112345678",
    businessType: "خرده‌فروشی",
    website: "https://example.com",
    operatingHours: "شنبه تا چهارشنبه ۹ تا ۱۸",
  },
  returnPolicy: {
    returnsAccepted: "yes" as "yes" | "no",
    returnWindow: "14" as "7" | "14" | "30",
    shippingResponsibility: "depends" as "customer" | "merchant" | "depends",
  },
  banking: {
    holder: "",
    bank: "",
    accountNumber: "",
    iban: "",
  },
  account: {
    mobile: "+989120000000",
    email: "merchant@example.com",
  },
};

export function toPersianDigits(input: string | number): string {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (d) => map[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function formatToman(amount: number): string {
  const grouped = amount.toLocaleString("en-US");
  return `${toPersianDigits(grouped)} تومان`;
}

export function formatThousands(amount: number): string {
  return toPersianDigits(amount.toLocaleString("en-US"));
}

export function maskMobile(mobile: string): string {
  // +989120000000 -> +۹۸ ۹۱۲ ××× ۰۰۰۰
  const en = toEnglishDigits(mobile).replace(/\D/g, "");
  if (en.length < 10) return toPersianDigits(mobile);
  const last4 = en.slice(-4);
  const mid = en.slice(-7, -4);
  return toPersianDigits(`+98 ${en.slice(-10, -7)} ××× ${last4}`).replace(`${mid}`, "×××");
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(user.length - 2, 3))}@${domain}`;
}
