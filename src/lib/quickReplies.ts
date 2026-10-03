/**
 * Quick Replies = conversation movers shown in a row above the composer.
 * They are spoken in the user's voice, never ask the user anything, and are
 * inserted into the composer (not sent) when tapped.
 *
 * Fixed replies come from the product's `quick_replies` column (manual entry).
 * Dynamic replies are derived from the current funnel stage of the conversation.
 */

export interface FixedQuickReply {
  text: string;
  highlight?: boolean;
  executional?: boolean;
}

export interface ResolvedQuickReply {
  id: string;
  text: string;
  highlight: boolean;
  executional: boolean;
}

export const parseFixedQuickReplies = (raw: unknown): FixedQuickReply[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const out: FixedQuickReply[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) out.push({ text: item.trim() });
    else if (item && typeof item === "object" && typeof (item as any).text === "string" && (item as any).text.trim()) {
      out.push({
        text: (item as any).text.trim(),
        highlight: !!(item as any).highlight,
        executional: !!(item as any).executional,
      });
    }
  }
  return out.length ? out : undefined;
};

interface MessageLike {
  role: "user" | "assistant";
  content: string;
  products?: unknown[];
  inlineProduct?: { name: string; quickReplies?: FixedQuickReply[] };
  orderSummary?: unknown;
  addressShipping?: unknown;
  paymentOptions?: unknown;
  addressSelector?: unknown;
  addressConfirmation?: unknown;
  clarification?: unknown;
  journey?: unknown;
}

interface QuickReplyContext {
  messages: MessageLike[];
  cartCount: number;
  checkoutStep?: string;
  isProcessing?: boolean;
}

const CHECKOUT_STEPS = new Set(["cart-confirmation", "address-confirmation", "payment-selection", "processing-payment"]);
const MAX_REPLIES = 6;

const exec = (text: string, highlight = false): FixedQuickReply => ({ text, executional: true, highlight });
const talk = (text: string): FixedQuickReply => ({ text });

const PDP_FALLBACK: FixedQuickReply[] = [
  talk("مشخصاتش رو کامل‌تر توضیح بده"),
  talk("با مدل‌های مشابه مقایسه‌اش کن"),
  talk("ارسالش چقدر طول می‌کشه؟"),
];

export const resolveQuickReplies = ({ messages, cartCount, checkoutStep, isProcessing }: QuickReplyContext): ResolvedQuickReply[] => {
  if (isProcessing) return [];
  if (checkoutStep && CHECKOUT_STEPS.has(checkoutStep)) return [];

  const last = [...messages].reverse().find((m) => m.role === "assistant");
  if (!last) return [];
  // Checkout UI or a question component owns the turn — stay out of the way.
  if (last.addressShipping || last.paymentOptions || last.addressSelector || last.addressConfirmation || last.clarification || last.journey) {
    return [];
  }

  let list: FixedQuickReply[] = [];

  if (checkoutStep === "order-complete" || last.orderSummary) {
    list = [exec("سفارشم رو پیگیری کن", true), talk("سفارشم کی می‌رسه؟"), exec("یه خرید جدید شروع کنیم")];
  } else if (last.inlineProduct) {
    const fixed = last.inlineProduct.quickReplies ?? [];
    const fixedExec = fixed.filter((r) => r.executional);
    const execs = fixedExec.length ? fixedExec.slice(0, 2) : [exec("این رو به سبدم اضافه کن", true)];
    if (!fixedExec.length && cartCount > 0) execs.push(exec("سفارشم رو نهایی کن"));
    const talks = fixed.filter((r) => !r.executional);
    list = [...execs, ...(talks.length ? talks : PDP_FALLBACK)];
  } else if (Array.isArray(last.products) && last.products.length >= 2) {
    list = [
      exec("شماره ۱ رو به سبدم اضافه کن"),
      talk("تفاوت شماره ۱ و ۲ چیه؟"),
      talk("ارزون‌ترین گزینه کدومه؟"),
      talk("گزینه‌های بیشتری نشونم بده"),
    ];
  } else if (Array.isArray(last.products) && last.products.length === 1) {
    list = [exec("این رو به سبدم اضافه کن", true), ...PDP_FALLBACK.slice(1)];
  } else if (cartCount > 0 || checkoutStep === "product-added" || checkoutStep === "awaiting-finalize") {
    list = [exec("سفارشم رو نهایی کن", true), exec("سبد خریدم رو نشون بده"), talk("یه محصول مکمل پیشنهاد بده")];
  }

  // Conversation-memory filter: never repeat something the user already said.
  const said = new Set(messages.filter((m) => m.role === "user").map((m) => m.content.trim()));
  const seen = new Set<string>();
  const result: ResolvedQuickReply[] = [];
  for (const r of list) {
    if (said.has(r.text) || seen.has(r.text)) continue;
    seen.add(r.text);
    result.push({ id: `qr-${result.length}-${r.text}`, text: r.text, highlight: !!r.highlight, executional: !!r.executional });
    if (result.length >= MAX_REPLIES) break;
  }
  return result;
};
