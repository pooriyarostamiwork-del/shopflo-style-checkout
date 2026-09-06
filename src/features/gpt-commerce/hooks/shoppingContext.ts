/**
 * Compact, category-agnostic shopping goal that survives turns.
 * Filled deterministically from the user's own words, and optionally
 * refined by a `GOAL:{...}` signal the answer call may emit.
 */
export interface ShoppingContext {
  useCase?: string;          // e.g. "گیمینگ", "هدیه", "سفر"
  recipient?: string;        // e.g. "خودم", "همسرم", "بچه"
  category?: string;         // current category focus, free text
  budgetByCategory?: Record<string, { min?: number; max?: number }>;
  preferences?: string[];    // liked attributes
  exclusions?: string[];     // things to avoid
}

export const createEmptyShoppingContext = (): ShoppingContext => ({
  preferences: [],
  exclusions: [],
  budgetByCategory: {},
});

export const ensureShoppingContext = (ctx?: ShoppingContext | null): ShoppingContext => ({
  ...createEmptyShoppingContext(),
  ...(ctx || {}),
  preferences: ctx?.preferences ?? [],
  exclusions: ctx?.exclusions ?? [],
  budgetByCategory: ctx?.budgetByCategory ?? {},
});

const PERSIAN_DIGITS = /[۰-۹]/g;
const faToEn = (s: string) =>
  s.replace(PERSIAN_DIGITS, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

/** Parse a Persian toman amount like "۵ میلیون" / "5 میلیون" / "500 هزار". */
const parseAmount = (raw: string): number | undefined => {
  const s = faToEn(raw).replace(/,/g, "");
  const m = s.match(/(\d+(?:\.\d+)?)\s*(میلیون|ملیون|هزار|تومان|تومن)?/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return undefined;
  if (m[2] === "میلیون" || m[2] === "ملیون") return Math.round(n * 1_000_000);
  if (m[2] === "هزار") return Math.round(n * 1_000);
  return Math.round(n);
};

const RECIPIENTS: Array<[RegExp, string]> = [
  [/برای\s+خودم/, "خودم"],
  [/برای\s+(همسرم|خانمم|شوهرم)/, "همسرم"],
  [/برای\s+(بچه|فرزندم|پسرم|دخترم)/, "بچه"],
  [/برای\s+(مادرم|پدرم|مامانم|بابام)/, "والدین"],
  [/(هدیه|کادو)/, "هدیه"],
];

const USE_CASES = [
  "گیمینگ", "بازی", "کار", "دانشجویی", "طراحی", "برنامه نویسی", "برنامه‌نویسی",
  "ورزش", "سفر", "خانه", "آشپزخانه", "مطالعه", "ادیت", "مهندسی", "اداری",
];

/** Derive updates from a single user message, without any model call. */
export function updateFromMessage(base: ShoppingContext, message: string): ShoppingContext {
  const next = ensureShoppingContext(base);
  const text = message.replace(/\u200c/g, " ");

  for (const [re, label] of RECIPIENTS) {
    if (re.test(text)) { next.recipient = label; break; }
  }

  const useCase = USE_CASES.find((u) => text.includes(u));
  if (useCase) next.useCase = useCase;

  // budget: "زیر X", "تا X", "حداکثر X", "بالای X", "بیشتر از X"
  const maxMatch = text.match(/(?:زیر|تا|حداکثر|کمتر از|ماکسیمم)\s+([\d۰-۹.,]+\s*(?:میلیون|ملیون|هزار)?)/);
  const minMatch = text.match(/(?:بالای|بیشتر از|حداقل|از)\s+([\d۰-۹.,]+\s*(?:میلیون|ملیون|هزار)?)/);
  const key = next.category || "__all__";
  if (maxMatch || minMatch) {
    const prev = next.budgetByCategory?.[key] || {};
    const max = maxMatch ? parseAmount(maxMatch[1]) : prev.max;
    const min = minMatch ? parseAmount(minMatch[1]) : prev.min;
    next.budgetByCategory = { ...next.budgetByCategory, [key]: { ...prev, min, max } };
  }

  // exclusions: "نمی‌خوام X", "بدون X"
  const excl = text.match(/(?:نمی‌خوام|نمیخوام|بدون|به جز)\s+([^,.،؛]{2,25})/);
  if (excl) {
    const term = excl[1].trim();
    if (term && !next.exclusions!.includes(term)) {
      next.exclusions = [...next.exclusions!, term].slice(-6);
    }
  }

  return next;
}

/** Merge a model-emitted GOAL object (all fields optional). */
export function mergeGoalSignal(base: ShoppingContext, goal: any): ShoppingContext {
  if (!goal || typeof goal !== "object") return base;
  const next = ensureShoppingContext(base);
  if (typeof goal.use_case === "string" && goal.use_case.trim()) next.useCase = goal.use_case.trim();
  if (typeof goal.recipient === "string" && goal.recipient.trim()) next.recipient = goal.recipient.trim();
  if (typeof goal.category === "string" && goal.category.trim()) next.category = goal.category.trim();
  if (Array.isArray(goal.preferences)) {
    next.preferences = Array.from(new Set([...(next.preferences || []), ...goal.preferences.filter((x: any) => typeof x === "string")])).slice(-8);
  }
  if (Array.isArray(goal.exclusions)) {
    next.exclusions = Array.from(new Set([...(next.exclusions || []), ...goal.exclusions.filter((x: any) => typeof x === "string")])).slice(-8);
  }
  if (goal.budget && typeof goal.budget === "object") {
    const cat = next.category || "__all__";
    const prev = next.budgetByCategory?.[cat] || {};
    next.budgetByCategory = {
      ...next.budgetByCategory,
      [cat]: {
        min: typeof goal.budget.min === "number" ? goal.budget.min : prev.min,
        max: typeof goal.budget.max === "number" ? goal.budget.max : prev.max,
      },
    };
  }
  return next;
}

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** Short human-readable text for the prompt (a few lines at most). */
export function serializeShoppingContext(ctx?: ShoppingContext | null): string {
  const c = ensureShoppingContext(ctx);
  const lines: string[] = [];
  if (c.category) lines.push(`دسته فعلی: ${c.category}`);
  if (c.useCase) lines.push(`کاربرد: ${c.useCase}`);
  if (c.recipient) lines.push(`برای: ${c.recipient}`);
  const budgets = Object.entries(c.budgetByCategory || {}).filter(([, v]) => v && (v.min || v.max));
  for (const [cat, v] of budgets) {
    const label = cat === "__all__" ? "بودجه" : `بودجه ${cat}`;
    const parts: string[] = [];
    if (v.min) parts.push(`از ${faNum(v.min)}`);
    if (v.max) parts.push(`تا ${faNum(v.max)}`);
    lines.push(`${label}: ${parts.join(" ")} تومان`);
  }
  if (c.preferences?.length) lines.push(`ترجیحات: ${c.preferences.join("، ")}`);
  if (c.exclusions?.length) lines.push(`نمی‌خواهد: ${c.exclusions.join("، ")}`);
  return lines.join("\n");
}
