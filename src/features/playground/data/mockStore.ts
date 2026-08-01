// Playground mock data — mirrors the shape of the storefront product/cart types
// so components promoted out of the playground need minimal rewiring.
// Fully local: no Supabase, no network.

export interface PgProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  imageUrls?: string[];
  rating: number;
  category: string;
  fastDelivery?: boolean;
  inStock: boolean;
  description: string;
  specs: { label: string; value: string }[];
}

export interface PgCartItem extends PgProduct {
  quantity: number;
}

export interface PgAddress {
  id: string;
  title: string;
  recipient: string;
  line: string;
  city: string;
  postalCode: string;
  phone: string;
}

export interface PgShippingOption {
  id: string;
  label: string;
  eta: string;
  price: number;
}

export interface PgPaymentOption {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export const PG_STORE = {
  slug: "playground",
  name_fa: "فروشگاه آزمایشگاه",
  tagline_fa: "محیط تست کامپوننت‌ها — همان تجربه فروشگاه هوشمند",
  suggested_prompts: [
    "یه هدفون خوب زیر ۵ میلیون",
    "پرفروش‌ترین‌ها رو نشون بده",
    "خودت برام انتخاب کن",
  ],
} as const;

/* ---------- Persian formatting ---------- */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export const toFa = (v: string | number) =>
  String(v).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

export const faPrice = (n: number) =>
  `\u2068${toFa(n.toLocaleString("en-US"))} تومان\u2069`;

/* ---------- Products ---------- */

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=600&q=70`;

export const PG_PRODUCTS: PgProduct[] = [
  {
    id: "pg-1",
    name: "هدفون بی‌سیم نویز کنسلینگ مدل آرام‌X",
    price: 4_290_000,
    originalPrice: 5_100_000,
    image: img("1505740420928-5e560c06d30e"),
    rating: 4.6,
    category: "صوتی",
    fastDelivery: true,
    inStock: true,
    description:
      "هدفون over-ear با حذف نویز فعال، ۳۰ ساعت شارژدهی و اتصال همزمان به دو دستگاه.",
    specs: [
      { label: "نوع اتصال", value: "بلوتوث ۵.۳" },
      { label: "شارژدهی", value: "۳۰ ساعت" },
      { label: "وزن", value: "۲۵۰ گرم" },
    ],
  },
  {
    id: "pg-2",
    name: "ساعت هوشمند اسپرت با پایش خواب",
    price: 2_150_000,
    image: img("1523275335684-37898b6baf30"),
    rating: 4.3,
    category: "پوشیدنی",
    inStock: true,
    description:
      "ساعت هوشمند با نمایشگر AMOLED، پایش ضربان و خواب و مقاومت آب ۵ اتمسفر.",
    specs: [
      { label: "نمایشگر", value: "۱.۴ اینچ AMOLED" },
      { label: "مقاومت آب", value: "۵ ATM" },
    ],
  },
  {
    id: "pg-3",
    name: "اسپیکر بلوتوث قابل حمل ضدآب",
    price: 1_390_000,
    originalPrice: 1_750_000,
    image: img("1608043152269-423dbba4e7e1"),
    rating: 4.7,
    category: "صوتی",
    fastDelivery: true,
    inStock: true,
    description: "اسپیکر جمع‌وجمع با صدای ۳۶۰ درجه و ۱۲ ساعت پخش مداوم.",
    specs: [
      { label: "توان", value: "۲۰ وات" },
      { label: "مقاومت", value: "IPX7" },
    ],
  },
  {
    id: "pg-4",
    name: "کیبورد مکانیکال بی‌سیم کم‌صدا",
    price: 3_450_000,
    image: img("1587829741301-dc798b83add3"),
    rating: 4.5,
    category: "جانبی",
    inStock: true,
    description: "کیبورد ۷۵٪ با سوییچ‌های خطی، هات‌سواپ و بدنه آلومینیومی.",
    specs: [
      { label: "چیدمان", value: "۷۵ درصد" },
      { label: "سوییچ", value: "خطی، هات‌سواپ" },
    ],
  },
  {
    id: "pg-5",
    name: "پاوربانک ۲۰۰۰۰ میلی‌آمپر شارژ سریع",
    price: 890_000,
    image: img("1609592806596-b43bada2f4be"),
    rating: 4.2,
    category: "جانبی",
    fastDelivery: true,
    inStock: true,
    description: "پاوربانک با خروجی ۶۵ وات و نمایشگر دیجیتال درصد شارژ.",
    specs: [{ label: "ظرفیت", value: "۲۰۰۰۰ mAh" }],
  },
  {
    id: "pg-6",
    name: "دوربین اکشن ۴K با لرزشگیر",
    price: 6_800_000,
    originalPrice: 7_900_000,
    image: img("1526170375885-4d8ecf77b99f"),
    rating: 4.8,
    category: "تصویر",
    inStock: false,
    description: "ثبت ویدیو ۴K۶۰، لرزشگیر الکترونیکی و بدنه ضدآب بدون کاور.",
    specs: [{ label: "رزولوشن", value: "۴K ۶۰fps" }],
  },
  {
    id: "pg-7",
    name: "ایرباد بی‌سیم فشرده مدل نوا",
    price: 1_950_000,
    originalPrice: 2_300_000,
    image: img("1590658268037-6bf12165a8df"),
    rating: 4.4,
    category: "صوتی",
    fastDelivery: true,
    inStock: true,
    description: "ایرباد سبک با حذف نویز نیمه‌فعال و ۲۴ ساعت شارژ با کیس.",
    specs: [
      { label: "نوع اتصال", value: "بلوتوث ۵.۳" },
      { label: "شارژدهی", value: "۲۴ ساعت با کیس" },
      { label: "وزن", value: "۴۸ گرم" },
    ],
  },
];


export const PG_ADDRESSES: PgAddress[] = [
  {
    id: "addr-1",
    title: "خانه",
    recipient: "سارا محمدی",
    line: "خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۴",
    city: "تهران",
    postalCode: "۱۴۳۹۷۵۶۱۲۳",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
  },
  {
    id: "addr-2",
    title: "محل کار",
    recipient: "سارا محمدی",
    line: "بلوار کشاورز، ساختمان نگین، طبقه ۷",
    city: "تهران",
    postalCode: "۱۴۱۹۸۳۳۴۵۶",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
  },
];

export const PG_SHIPPING: PgShippingOption[] = [
  { id: "ship-express", label: "ارسال سریع", eta: "امروز تا ۴ ساعت", price: 78_000 },
  { id: "ship-normal", label: "ارسال عادی", eta: "۲ تا ۳ روز کاری", price: 39_000 },
  { id: "ship-pickup", label: "تحویل حضوری", eta: "از فروشگاه", price: 0 },
];

export const PG_PAYMENTS: PgPaymentOption[] = [
  { id: "pay-online", label: "پرداخت آنلاین", hint: "درگاه امن بانکی" },
  { id: "pay-installment", label: "پرداخت اقساطی", hint: "تا ۴ قسط بدون بهره" },
  { id: "pay-wallet", label: "کیف پول", hint: "موجودی کافی نیست", disabled: true },
];

/* ---------- Cart math (flat, single vendor) ---------- */

export interface PgOrderSummary {
  items: PgCartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  shipping: number;
  grandTotal: number;
}

export const pgOrderSummary = (
  items: PgCartItem[],
  shippingPrice = 0,
): PgOrderSummary => {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = items.reduce(
    (s, i) =>
      i.originalPrice && i.originalPrice > i.price
        ? s + (i.originalPrice - i.price) * i.quantity
        : s,
    0,
  );
  const shipping = items.length ? shippingPrice : 0;
  return {
    items,
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    discount,
    shipping,
    grandTotal: subtotal + shipping,
  };
};
