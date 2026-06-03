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
}

export const mockVendor = {
  storeName: "فروشگاه نمونه",
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
    pendingSettlement: 3_250_000,
    nextSettlement: "۱۴۰۵/۰۳/۱۵",
    withdrawableBalance: 1_800_000,
  },
  revenueByRange: {
    day: { revenue: 420_000, orders: 2, aov: 210_000, commission: 21_000 } as RevenueSnapshot,
    week: { revenue: 2_900_000, orders: 11, aov: 263_000, commission: 145_000 } as RevenueSnapshot,
    month: { revenue: 12_500_000, orders: 42, aov: 297_000, commission: 625_000 } as RevenueSnapshot,
  },
  payouts: {
    withdrawable: 1_800_000,
    pending: 3_250_000,
    totalWithdrawn: 24_500_000,
    nextSettlement: "۱۴۰۵/۰۳/۱۵",
  },
  withdrawals: [
    { date: "۱۴۰۵/۰۳/۰۱", amount: 2_000_000, status: "completed" as WithdrawalStatus },
    { date: "۱۴۰۵/۰۲/۲۰", amount: 1_500_000, status: "completed" as WithdrawalStatus },
    { date: "۱۴۰۵/۰۲/۱۰", amount: 3_000_000, status: "completed" as WithdrawalStatus },
    { date: "۱۴۰۵/۰۲/۰۱", amount: 800_000, status: "processing" as WithdrawalStatus },
    { date: "۱۴۰۵/۰۱/۲۵", amount: 500_000, status: "pending" as WithdrawalStatus },
  ],
  profile: {
    businessName: "فروشگاه نمونه",
    description: "ارائه‌دهنده محصولات با کیفیت برای مشتریان.",
    supportPhone: "۰۲۱۱۲۳۴۵۶۷۸",
    businessType: "خرده‌فروشی",
    website: "https://example.com",
    operatingHours: "شنبه تا چهارشنبه ۹ تا ۱۸",
  },
  returnPolicy: {
    returnsAccepted: "yes" as "yes" | "no",
    returnWindow: "14" as "7" | "14" | "30",
    shippingResponsibility: "depends" as "customer" | "merchant" | "depends",
  },
  account: {
    mobile: "+۹۸ ۹۱۲ XXX XXXX",
    email: "merchant@example.com",
  },
};

// Convert ASCII digits in a string to Persian digits (with BiDi isolation friendly output).
export function toPersianDigits(input: string | number): string {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (d) => map[Number(d)]);
}

// Format a Toman amount with thousands separators and Persian digits.
export function formatToman(amount: number): string {
  const grouped = amount.toLocaleString("en-US");
  return `${toPersianDigits(grouped)} تومان`;
}
