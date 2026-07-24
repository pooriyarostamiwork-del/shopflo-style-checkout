import { IntelInsight, IntelMessage, IntelThread } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------- Canned insights ---------------- */

const retentionInsight: IntelInsight = {
  title: "بازگشت مشتریان — ۳۰ روز اخیر",
  kpis: [
    { label: "نرخ بازگشت", value: "٪۳۱٫۴", delta: "−۲٫۱٪" },
    { label: "مشتری فعال", value: "۱٬۲۰۴", delta: "+۴٫۸٪" },
    { label: "میانگین ارزش", value: "۸۹۰ک", delta: "+۳٫۲٪" },
  ],
  bullets: [
    "مشتریان دسته «لوازم بازی» با ۴۷٪ بازگشت، بیشترین وفاداری رو دارن.",
    "خرید دوم بین روزهای ۹ تا ۱۴ اتفاق میفته — پنجره ایده‌آل برای یادآوری.",
    "دراپ‌آف اصلی روی مشتریان تک‌خریدی زیر ۳۰۰ک تومنه.",
  ],
};

const segmentInsight: IntelInsight = {
  title: "با ارزش‌ترین دسته‌ها",
  kpis: [
    { label: "VIP", value: "٪۱۲", delta: "سهم مشتری" },
    { label: "سهم درآمد VIP", value: "٪۴۸" },
    { label: "AOV VIP", value: "۱٫۹م" },
  ],
  bullets: [
    "دسته «VIP وفادار» با ۱۲٪ جمعیت، ۴۸٪ درآمد رو می‌سازه.",
    "دسته «نوجو» بیشترین پتانسیل رشد کوتاه‌مدت رو داره.",
    "پیشنهاد: کمپین بازگرداندن مخصوص «خفته‌ها» با کوپن هدفمند.",
  ],
};

const funnelInsight: IntelInsight = {
  title: "قیف تبدیل — ۷ روز اخیر",
  kpis: [
    { label: "ورودی چت", value: "۳٬۸۴۲" },
    { label: "کشف محصول", value: "٪۷۱" },
    { label: "افزودن به سبد", value: "٪۳۸" },
    { label: "پرداخت", value: "٪۱۱٫۶", delta: "−۰٫۹٪" },
  ],
  bullets: [
    "بیشترین ریزش بین «افزودن به سبد» و «انتخاب آدرس» اتفاق میفته.",
    "کاربرانی که سوالشون فیلترشونده، ۲٫۳ برابر بیشتر تبدیل میشن.",
    "پیشنهاد: نمایش پیشنهاد ارسال رایگان روی سبد بالای ۵۰۰ک.",
  ],
};

const agentInsight: IntelInsight = {
  title: "کیفیت پاسخ ایجنت",
  kpis: [
    { label: "پاسخ موفق", value: "٪۸۴٫۲", delta: "+۱٫۷٪" },
    { label: "سوال بی‌جواب", value: "۶۴" },
    { label: "میانگین چرخه", value: "۴٫۱ نوبت" },
  ],
  bullets: [
    "بیشترین سوالات بی‌جواب: «موجودی سایز»، «زمان ارسال به شهرستان»، «امکان تعویض».",
    "نرخ رضایت روی سوالات فنی محصول ٪۹۱ — نقطه قوت ایجنت.",
    "پیشنهاد: افزودن سه سناریو FAQ در سطح Chapter برای این ۳ موضوع.",
  ],
};

const marketInsight: IntelInsight = {
  title: "سیگنال‌های بازار",
  kpis: [
    { label: "ترند در حال رشد", value: "۷" },
    { label: "سوالات بدون محصول", value: "۲۹" },
    { label: "کلمات کلیدی نو", value: "۱۴" },
  ],
  bullets: [
    "افزایش ۳۴٪ در جستجوی «هدیه ولنتاین» در ۱۰ روز اخیر.",
    "۲۹ کاربر دنبال محصولی بودن که در کاتالوگ نیست — فرصت افزودن SKU.",
    "کلمه «ارگانیک» تو مکالمه‌های تازه ۲ برابر شده.",
  ],
};

/* ---------------- Keyword matcher ---------------- */

type CannedReply = {
  intro: string;
  insight?: IntelInsight;
  outro?: string;
};

const canned: { match: RegExp; reply: CannedReply }[] = [
  {
    match: /(بازگشت|ریتنشن|وفادار|دوباره|تکرار)/,
    reply: {
      intro:
        "براساس رفتار مشتریان در ۳۰ روز اخیر، الگوی بازگشت اینطوره:",
      insight: retentionInsight,
      outro:
        "اگه بخوای، می‌تونم برات یه کمپین یادآوری برای پنجره روز ۹ تا ۱۴ پیشنهاد بدم.",
    },
  },
  {
    match: /(دسته|سگمنت|با ارزش|vip|ارزشمند|گروه)/i,
    reply: {
      intro:
        "با تحلیل RFM روی سفارش‌ها، دسته‌های کلیدی مشتریانت اینا هستن:",
      insight: segmentInsight,
      outro: "می‌تونم برای هر سگمنت پیشنهاد پیام و کوپن اختصاصی هم بسازم.",
    },
  },
  {
    match: /(قیف|ریزش|تبدیل|دراپ|conversion|funnel)/i,
    reply: {
      intro: "این تصویر لحظه‌ای قیف تبدیله:",
      insight: funnelInsight,
      outro:
        "پیشنهاد بعدی من: تست A/B روی پیام «نزدیک ارسال رایگان» توی مرحله سبد.",
    },
  },
  {
    match: /(ایجنت|پاسخ|چت‌بات|بی‌جواب|سوال|faq|كيفيت|کیفیت)/i,
    reply: {
      intro: "کیفیت پاسخگویی ایجنت در هفته گذشته:",
      insight: agentInsight,
      outro:
        "می‌خوای برات یه چک‌لیست از موضوعاتی که باید به مستر پرامپت اضافه بشن آماده کنم؟",
    },
  },
  {
    match: /(بازار|ترند|رقیب|فرصت|سیگنال|market)/i,
    reply: {
      intro:
        "این سیگنال‌ها از مکالمات و جستجوهای اخیر توی فروشگاهت استخراج شدن:",
      insight: marketInsight,
      outro: "کدوم ترند رو می‌خوای بازتر ببینی؟",
    },
  },
];

const fallback: CannedReply = {
  intro:
    "بذار براساس داده‌های موجود یه تصویر کلی از فروشگاهت بدم:",
  insight: {
    title: "نمای کلی ۳۰ روز اخیر",
    kpis: [
      { label: "مشتری فعال", value: "۱٬۲۰۴", delta: "+۴٫۸٪" },
      { label: "AOV", value: "۶۲۰ک", delta: "+۲٫۱٪" },
      { label: "نرخ تبدیل", value: "٪۱۱٫۶" },
    ],
    bullets: [
      "می‌تونی از من درباره سگمنت‌ها، قیف، ترندها یا کیفیت ایجنت بپرسی.",
      "مثلاً: «کدوم دسته مشتری با ارزش‌تره؟» یا «کجای قیف بیشترین ریزش رو داریم؟»",
    ],
  },
};

export const generateMockReply = (prompt: string): IntelMessage => {
  const hit = canned.find((c) => c.match.test(prompt))?.reply ?? fallback;
  const content = [hit.intro, hit.outro].filter(Boolean).join("\n\n");
  return {
    id: uid(),
    role: "assistant",
    content,
    createdAt: Date.now(),
    insight: hit.insight,
  };
};

/* ---------------- Seed thread ---------------- */

export const buildSeedThread = (): IntelThread => {
  const now = Date.now();
  const userMsg: IntelMessage = {
    id: uid(),
    role: "user",
    content: "نرخ بازگشت مشتری این ماه چطور بوده؟",
    createdAt: now - 60_000,
  };
  const reply = generateMockReply(userMsg.content);
  return {
    id: uid(),
    title: "نمونه: بازگشت مشتریان ۳۰ روز اخیر",
    updatedAt: now,
    messages: [userMsg, { ...reply, createdAt: now - 30_000 }],
  };
};

export const suggestionChips: string[] = [
  "کدوم دسته از مشتریام بیشترین ارزش رو دارن؟",
  "چرا نرخ بازگشت مشتری این ماه پایین اومده؟",
  "بیشترین سوالات بدون‌پاسخ ایجنت چی بوده؟",
  "کجای قیف بیشترین ریزش رو داریم؟",
];

export const newId = uid;
