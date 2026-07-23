export type Plan = "lite" | "pro";

const persianDigits = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
export const fa = (n: number | string) => String(n).replace(/[0-9]/g, d => persianDigits[+d]);
export const faNum = (n: number) => fa(n.toLocaleString("en-US"));
export const faToman = (n: number) => `${faNum(n)} تومان`;
export const faPct = (n: number) => `${fa(n.toFixed(1))}٪`;

export const kpis = {
  assistedRevenue: { value: 48_650_000, delta: 24.3 },
  customersHelped: { value: 1284, firstTimers: 812, returning: 472, delta: 12.1, liveNow: 7 },
  productClicks: { value: 3421, delta: -3.4 },
  conversion: { value: 6.8, delta: 1.2 },
};

const days7 = ["ش","ی","د","س","چ","پ","ج"];
const days30 = Array.from({length: 30}, (_,i) => `${i+1}`);
const months12 = ["فرو","ارد","خرد","تیر","مرد","شهر","مهر","آبا","آذر","دی","بهم","اسف"];

const gen = (n: number, base: number, spread: number, seed = 1) => {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (Math.sin(i * seed) + Math.cos(i * 0.7 + seed)) * spread * 0.3;
    v = Math.max(base * 0.4, v);
    out.push(Math.round(v));
  }
  return out;
};

export const trends = {
  "7d": {
    labels: days7,
    assistedRevenue: gen(7, 6800, 1200, 1.2).map(v => v * 1000),
    customersHelped: gen(7, 180, 40, 2.1),
    conversion: gen(7, 6, 1.2, 3.4),
  },
  "30d": {
    labels: days30,
    assistedRevenue: gen(30, 5200, 1400, 1.8).map(v => v * 1000),
    customersHelped: gen(30, 160, 55, 2.7),
    conversion: gen(30, 5.8, 1.6, 3.9),
  },
  "1y": {
    labels: months12,
    assistedRevenue: gen(12, 42000, 8000, 1.1).map(v => v * 1000),
    customersHelped: gen(12, 1100, 260, 2.2),
    conversion: gen(12, 5.4, 1.1, 3.1),
  },
};

export const intents = [
  { label: "تشویقی مناسب سگ برای کنترل اضطراب", weight: 92 },
  { label: "غذای خشک گربه بالغ", weight: 78 },
  { label: "قلاده ضد کِشش", weight: 61 },
  { label: "شامپو ضدحساسیت", weight: 54 },
  { label: "اسباب‌بازی جویدنی", weight: 48 },
  { label: "مکمل مفصل", weight: 44 },
  { label: "پوشک سگ", weight: 33 },
  { label: "ظرف ضد سرعت", weight: 28 },
  { label: "لباس زمستانی", weight: 22 },
  { label: "قطره ضد کِرم", weight: 19 },
];

export const failedMatches = [
  { q: "غذای خشک سگ مناسب دوره بیماری سرماخوردگی", count: 14 },
  { q: "شامپو ضدشپش گربه بدون بو", count: 9 },
  { q: "لباس نئوپرن آبی مخصوص شنا", count: 6 },
  { q: "غذای وت بدون گلوتن", count: 4 },
];

export const dropoffs = [
  { reason: "قیمت", pct: 38, pro: false },
  { reason: "موجودی", pct: 24, pro: false },
  { reason: "هزینه ارسال", pct: 18, pro: true },
  { reason: "کارمزد", pct: 12, pro: true },
  { reason: "زمان تحویل", pct: 8, pro: false },
];

export const topProducts = [
  { name: "غذای خشک رویال کنین ادالت", recs: 342, clicks: 128, ctr: 37.4 },
  { name: "قلاده تربیتی ضد کشش", recs: 289, clicks: 98, ctr: 33.9 },
  { name: "تشویقی آرام‌بخش زیلکن", recs: 254, clicks: 82, ctr: 32.3 },
  { name: "اسباب‌بازی کنگ کلاسیک", recs: 198, clicks: 60, ctr: 30.3 },
  { name: "شامپو ویرباک اپیسوت", recs: 176, clicks: 48, ctr: 27.3 },
];

export const personas = [
  { id: "friendly", name: "دوستانه و صمیمی", desc: "لحن گرم، محاوره‌ای، خودمانی" },
  { id: "expert", name: "متخصص و مشاور", desc: "دقیق، مبتنی بر داده، رسمی‌تر" },
  { id: "concierge", name: "کنسیرژ لوکس", desc: "مؤدب، آرام، برند-محور" },
  { id: "playful", name: "بازیگوش", desc: "پرانرژی، شوخ، جوان‌پسند" },
];

export const guardrails = [
  { id: "no-medical", label: "توصیه پزشکی ندهد", desc: "از تجویز درمان یا دارو خودداری کند", enabled: true, pro: false },
  { id: "no-price-promise", label: "قول قیمت آینده ندهد", desc: "درباره تغییرات قیمت وعده ندهد", enabled: true, pro: false },
  { id: "no-competitor", label: "درباره رقبا صحبت نکند", desc: "نام و مقایسه با رقبا ممنوع", enabled: false, pro: false },
  { id: "no-stock-promise", label: "قول موجودی ندهد", desc: "بدون تأیید سیستم، وعده موجودی ندهد", enabled: true, pro: true },
  { id: "custom-tone", label: "پاسخ‌های سفارشی برای حساس‌ها", desc: "مسیر پاسخ خاص برای شکایات", enabled: false, pro: true },
];

export const campaignPresets = ["عید نوروز", "یلدا", "بلک فرایدی", "شب یلدا", "جشنواره تابستان"];

export const themes = [
  { id: "coral", name: "مرجانی", colors: ["#FF3737","#FFF5F5","#1B1B1B","#F7F7F8"] },
  { id: "midnight", name: "نیمه‌شب", colors: ["#4F46E5","#EEF0FF","#0F0F1A","#F5F6FA"] },
  { id: "emerald", name: "زمرد", colors: ["#0D9F6E","#E6F7F0","#0B1F17","#F4F7F5"] },
  { id: "amber", name: "کهربا", colors: ["#F59E0B","#FFF7E6","#1E1A0F","#FAF8F3"] },
];

export const loadingAnimations = [
  { id: "dots", name: "سه نقطه" },
  { id: "wave", name: "موج" },
  { id: "paws", name: "پنجه‌ها" },
  { id: "bar", name: "نوار" },
];

export const teamMembers = [
  { id: "1", name: "سارا محمدی", email: "sara@petplayground.ir", role: "owner" },
  { id: "2", name: "علی رضایی", email: "ali@petplayground.ir", role: "admin" },
  { id: "3", name: "نگار امینی", email: "negar@petplayground.ir", role: "editor" },
];

export const integrations = {
  platform: "WooCommerce",
  syncStatus: "healthy" as "healthy" | "warning" | "error",
  lastSync: "امروز، ساعت ۱۴:۲۲",
  apiKey: "wc_sk_••••••••••••••4a7f",
  indexed: { total: 1240, aiEligible: 1088, justIndexed: 128, errors: 24 },
};

export const aiPlans = [
  { id: "starter", name: "استارتر", model: "Flash-Lite", baseConversations: 1000, basePrice: 490_000, features: ["مدل سریع","پاسخ‌های پایه","بدون سفارشی‌سازی مدل"] },
  { id: "growth", name: "رشد", model: "Flash", baseConversations: 5000, basePrice: 1_890_000, popular: true, features: ["مدل متعادل","کیفیت بالاتر","حافظه گفتگو"] },
  { id: "scale", name: "مقیاس", model: "Pro", baseConversations: 15000, basePrice: 4_890_000, features: ["مدل پیشرفته","استدلال عمیق","اولویت پردازش"] },
  { id: "enterprise", name: "سازمانی", model: "Pro-Max", baseConversations: 50000, basePrice: 13_500_000, features: ["مدل پرچمدار","SLA اختصاصی","مدیر حساب"] },
];

export const conversationTiers = [
  { conversations: 1000, discount: 0 },
  { conversations: 5000, discount: 8 },
  { conversations: 15000, discount: 15 },
  { conversations: 50000, discount: 22 },
];

export const currentAIPlan = { id: "growth", remaining: 3_142, total: 5_000, purchaseDate: "۱۴۰۴/۰۸/۰۲", queued: "scale" };

export const aiPlanHistory = [
  { id: "h1", plan: "استارتر", purchased: "۱۴۰۴/۰۵/۱۲ - ۱۰:۲۰", ranOut: "۱۴۰۴/۰۶/۱۸ - ۲۲:۰۴", price: 490_000 },
  { id: "h2", plan: "رشد", purchased: "۱۴۰۴/۰۶/۱۸ - ۲۲:۰۵", ranOut: "۱۴۰۴/۰۸/۰۱ - ۱۹:۳۰", price: 1_890_000 },
];

export const shiftPlans = {
  current: { name: "Shift Pro", price: 4_900_000, cycle: "ماهانه", nextRenewal: "۱۴۰۴/۰۹/۰۲" },
  history: [
    { id: "b1", plan: "Shift Lite", purchased: "۱۴۰۴/۰۳/۰۱", expired: "۱۴۰۴/۰۶/۰۱", price: 1_490_000 },
    { id: "b2", plan: "Shift Pro", purchased: "۱۴۰۴/۰۶/۰۲", expired: "۱۴۰۴/۰۹/۰۲", price: 4_900_000 },
  ],
};

export const supportTickets = [
  { id: "T-1042", title: "همگام‌سازی محصولات ناقص", status: "open", updated: "۲ ساعت پیش", priority: "high" },
  { id: "T-1038", title: "پیشنهاد ویژگی: پیامک اطلاع‌رسانی", status: "in-progress", updated: "دیروز", priority: "low" },
  { id: "T-1029", title: "خطا در بارگذاری تصاویر", status: "resolved", updated: "۴ روز پیش", priority: "medium" },
];

export const quickMessages = [
  "غذای مناسب سگ من چیه؟",
  "بهترین تشویقی برای کنترل اضطراب",
  "قلاده مناسب سگ بازیگوش",
  "لوازم آبتنی برای گربه",
];

export const initialContent = {
  agentName: "دستیار خرید پت‌پلی‌گراند",
  personaId: "friendly",
  active: true,
  autoApplyCoupons: true,
  autoInformOffers: true,
  featuredPromotions: "غذای خشک رویال کنین با ۱۵٪ تخفیف",
  homeTagline: "همه‌چیزی که حیوان خانگی‌تان نیاز دارد، فقط با یک گفتگو",
  homeTaglineActive: true,
  chatTagline: "بپرسید. پیدا کنید. سفارش دهید.",
  chatTaglineActive: true,
  headerMessage: "سلام! چطور می‌تونم کمکتون کنم؟",
  headerMessageActive: true,
  welcomeMessage: "سلام رفیق! امروز دنبال چی می‌گردی؟ می‌تونم بر اساس نژاد، سن یا نیاز خاص کمکت کنم.",
  homePlaceholder: "چی برای رفیق پشمالوت لازم داری؟",
  chatPlaceholder: "بپرس یا سفارش بده…",
  footerContents: "پت‌پلی‌گراند — قدرت گرفته از Shift",
  themeId: "coral",
  loadingId: "paws",
  loadingText: "در حال جستجوی بهترین‌ها…",
};
