// Scripted mock journey for the playground. No AI call — keyword matched replies
// plus one-click jumps to any step of the storefront flow.
import { PgProduct, PG_PRODUCTS } from "./mockStore";
import { PgInteractive } from "./mockDiscovery";
import { PgComparison, buildPreset } from "./mockComparison";

export type PgJourneyStep =
  | "discovery"
  | "details"
  | "cart"
  | "address"
  | "shipping"
  | "payment"
  | "confirmation";

export const PG_JOURNEY_STEPS: { id: PgJourneyStep; label: string }[] = [
  { id: "discovery", label: "کشف محصول" },
  { id: "details", label: "جزئیات محصول" },
  { id: "cart", label: "سبد خرید" },
  { id: "address", label: "آدرس" },
  { id: "shipping", label: "ارسال" },
  { id: "payment", label: "پرداخت" },
  { id: "confirmation", label: "تأیید سفارش" },
];

export type PgBlock = "address" | "shipping" | "payment" | "summary" | "success";

export type PgBookingBlockKind =
  | "services"
  | "providers"
  | "calendar"
  | "slots"
  | "form"
  | "summary"
  | "confirmation"
  | "notice";

export interface PgBookingPayload {
  kind: PgBookingBlockKind;
  serviceId?: string;
  providerId?: string;
  dayKey?: string;
  slotId?: string;
  code?: string;
  notice?: "no-availability" | "slot-taken" | "provider-full" | "waitlist";
}

export interface PgQuickReply {
  id: string;
  label: string;
  send?: string;
}

export interface PgMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: PgProduct[];
  productIndexStart?: number;
  inlineProduct?: PgProduct;
  block?: PgBlock;
  /** Conversational discovery components (quiz / wizard / budget). */
  interactive?: PgInteractive;
  /** Cross-sell bundle carousel (why + per-item discount + add full list). */
  crossSell?: boolean;
  /** Conversational product comparison (verdict + differences + use cases). */
  comparison?: PgComparison;
  /** In-chat service booking step. */
  booking?: PgBookingPayload;
  quickReplies?: PgQuickReply[];
  cta?: { label: string; disabled?: boolean; disabledReason?: string };
}


let seq = 0;
export const pgId = (p = "m") => `${p}-${++seq}-${Date.now().toString(36)}`;

const msg = (m: Omit<PgMessage, "id">): PgMessage => ({ id: pgId(), ...m });

/** Assistant turns that represent each step of the journey. */
export const stepMessages = (step: PgJourneyStep): PgMessage[] => {
  switch (step) {
    case "discovery":
      return [
        msg({
          role: "assistant",
          content:
            "سلام! چی دنبالش هستی؟ می‌تونم بر اساس بودجه و کاربردت چند گزینه خوب بیارم.",
          quickReplies: [
            { id: "q1", label: "پرفروش‌ها", send: "پرفروش‌ترین‌ها رو نشون بده" },
            { id: "q2", label: "تخفیف‌دارها", send: "تخفیف‌های امروز" },
            { id: "q3", label: "کمکم کن انتخاب کنم", send: "کمکم کن انتخاب کنم" },
            { id: "q4", label: "بودجه‌م رو بگم", send: "بودجه‌م رو مشخص کنم" },
          ],
        }),
      ];
    case "details":
      return [
        msg({
          role: "user",
          content: "جزئیات هدفون آرام‌X رو بگو",
        }),
        msg({
          role: "assistant",
          content:
            "این گزینه بین مدل‌های این محدوده قیمت بهترین حذف نویز رو داره. مشخصات کاملش رو ببین:",
          inlineProduct: PG_PRODUCTS[0],
          quickReplies: [
            { id: "d1", label: "اضافه کن به سبد", send: "اضافه کن به سبد" },
            { id: "d2", label: "گزینه‌های مشابه", send: "مشابهش رو نشون بده" },
          ],
        }),
      ];
    case "cart":
      return [
        msg({ role: "user", content: "سبدم رو نشون بده" }),
        msg({
          role: "assistant",
          content: "این سبد فعلی توئه. هر وقت آماده بودی ادامه بدیم.",
          block: "summary",
          quickReplies: [
            { id: "c1", label: "مکمل‌های پیشنهادی", send: "مکمل‌ها رو پیشنهاد بده" },
            { id: "c2", label: "ثبت آدرس", send: "بریم مرحله آدرس" },
          ],
        }),
      ];
    case "address":
      return [
        msg({ role: "user", content: "بریم مرحله آدرس" }),
        msg({
          role: "assistant",
          content: "کدوم آدرس رو برای ارسال ثبت کنم؟",
          block: "address",
        }),
      ];
    case "shipping":
      return [
        msg({ role: "user", content: "آدرس خانه" }),
        msg({
          role: "assistant",
          content: "روش ارسال رو انتخاب کن تا زمان تحویل رو نهایی کنم.",
          block: "shipping",
        }),
      ];
    case "payment":
      return [
        msg({ role: "user", content: "ارسال سریع" }),
        msg({
          role: "assistant",
          content: "فقط مونده روش پرداخت. بعدش سفارش رو نهایی می‌کنم.",
          block: "payment",
          cta: { label: "نهایی‌کردن خرید" },
        }),
      ];
    case "confirmation":
      return [
        msg({ role: "user", content: "پرداخت آنلاین" }),
        msg({
          role: "assistant",
          content: "سفارشت ثبت شد. جزئیاتش رو برات آوردم:",
          block: "success",
        }),
      ];
  }
};

/** Very small keyword responder so the chat feels alive without a backend. */
export const mockRespond = (text: string): PgMessage => {
  const t = text.trim();

  if (/مقایسه|بهتره|بهتر است|کدوم رو بگیرم|کدام را بگیرم|در برابر|vs/i.test(t)) {
    const mixed = /ناهمگون|دسته‌های مختلف|دسته های مختلف|کیبورد|دوربین/.test(t);
    const external = /رقیب|فروشگاه دیگر|خارجی|دیجی/.test(t);
    const preset = mixed ? "mixed" : external ? "external" : "two";
    return msg({
      role: "assistant",
      content: mixed
        ? "این دو گزینه هم‌رده نیستند، ولی بر اساس کاربرد کنار هم گذاشتمشان:"
        : "این مقایسه را برایت چیدم؛ نتیجه اول، جزئیات بعد از آن:",
      comparison: buildPreset(preset),
    });
  }
  if (/مکمل|با هم|باندل|ست |ست\u200cکامل|تکمیل|چی دیگه|پیشنهاد بده/.test(t)) {
    return msg({
      role: "assistant",
      content:
        "بر اساس انتخابت این ست رو چیدم؛ با هم گرفتنشون تخفیف بیشتری داره:",
      crossSell: true,
    });
  }
  if (/بودجه|سقف قیمت|چقدر پول/.test(t)) {
    return msg({
      role: "assistant",
      content: "بذار محدوده قیمتت رو دقیق کنیم:",
      interactive: "budget",
    });
  }
  if (/کمکم کن|راهنما|قدم به قدم|فیلتر|انتخاب کن/.test(t)) {
    return msg({
      role: "assistant",
      content: "چند سؤال کوتاه می‌پرسم تا دقیق‌ترین گزینه رو پیدا کنم:",
      interactive: "wizard",
    });
  }
  if (/حیوان|پت|سگ|گربه|پرنده|خرگوش/.test(t)) {
    return msg({
      role: "assistant",
      content: "برای اینکه دقیق پیشنهاد بدم، یه سؤال دارم:",
      interactive: "quiz",
    });
  }
  if (/تخفیف|ارزان|حراج/.test(t)) {
    return msg({
      role: "assistant",
      content: "این‌ها بیشترین تخفیف امروز رو دارن:",
      products: PG_PRODUCTS.filter((p) => p.originalPrice),
      productIndexStart: 1,
    });
  }
  if (/سبد|خلاصه|جمع/.test(t)) {
    return msg({
      role: "assistant",
      content: "خلاصه سبد خریدت:",
      block: "summary",
    });
  }
  if (/آدرس/.test(t)) {
    return msg({ role: "assistant", content: "آدرس ارسال رو انتخاب کن:", block: "address" });
  }
  if (/ارسال|تحویل/.test(t)) {
    return msg({ role: "assistant", content: "روش ارسال:", block: "shipping" });
  }
  if (/پرداخت|قسط/.test(t)) {
    return msg({
      role: "assistant",
      content: "روش پرداخت رو انتخاب کن:",
      block: "payment",
      cta: { label: "نهایی‌کردن خرید" },
    });
  }
  if (/هدفون|صوتی|اسپیکر/.test(t)) {
    return msg({
      role: "assistant",
      content: "بین گزینه‌های صوتی این سه مدل بهترین بازخورد رو دارن:",
      products: PG_PRODUCTS.filter((p) => p.category === "صوتی"),
      productIndexStart: 1,
    });
  }

  return msg({
    role: "assistant",
    content:
      "چند گزینه خوب برات پیدا کردم. اگر بودجه یا کاربرد خاصی داری بگو تا دقیق‌ترش کنم.",
    products: PG_PRODUCTS.slice(0, 3),
    productIndexStart: 1,
    quickReplies: [
      { id: "r1", label: "ارزان‌تر", send: "ارزان‌تر داری؟" },
      { id: "r2", label: "سبدم", send: "سبدم رو نشون بده" },
    ],
  });
};

export const userMessage = (content: string): PgMessage =>
  msg({ role: "user", content });
