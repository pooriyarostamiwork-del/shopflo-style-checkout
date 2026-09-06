/**
 * Intent-derived label shown inside the assistant's loading bubble.
 * Purely presentational — no extra model calls.
 */
const RULES: Array<[RegExp, string]> = [
  [/(سبد|خرید کن|اضافه کن|حذف کن|بردار|پرداخت|نهایی)/, "دارم سبدت رو به‌روز می‌کنم…"],
  [/(سفارش|پیگیری|مرسوله|کد رهگیری)/, "دارم سفارش‌هات رو چک می‌کنم…"],
  [/(چند|تعداد|قیمت|ارزون|گرون|برند|لیست)/, "دارم اطلاعات فروشگاه رو نگاه می‌کنم…"],
  [/(مقایسه|تفاوت|بهتره|کدوم)/, "دارم گزینه‌ها رو مقایسه می‌کنم…"],
  [/(راهنمایی|کمک|نمی\s*دونم|مشاوره|چی بگیرم|چی بخرم)/, "دارم درخواستت رو بررسی می‌کنم…"],
  [/(بخر|بگیر|پیشنهاد|دنبال|می\s*خوام|میخوام|معرفی)/, "دارم دنبال محصول می‌گردم…"],
];

export const getThinkingLabel = (lastUserText?: string): string => {
  const t = (lastUserText || "").replace(/ي/g, "ی").replace(/ك/g, "ک");
  for (const [re, label] of RULES) if (re.test(t)) return label;
  return "دارم درخواستت رو بررسی می‌کنم…";
};
