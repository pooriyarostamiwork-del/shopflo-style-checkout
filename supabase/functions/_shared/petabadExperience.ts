// Shared by the app and Telegram so checkout choices and opening copy cannot drift.
export const PETABAD_GREETING = 'سلام! 👋 من دستیار خرید هوشمند پت آباد هستم. چطور می‌تونم کمکت کنم؟\n\nمی‌تونی بگی دنبال چی می‌گردی، یا از من بخوای محصولات رو مقایسه کنم.';

export const PETABAD_SHIPPING = [
  { id: 'standard', label: 'ارسال عادی', deliveryWindow: '۲ تا ۷ روز کاری', fee: 55000, priceLabel: '۵۵٬۰۰۰ تومان', isDefault: true },
  { id: 'express', label: 'ارسال اکسپرس', deliveryWindow: '۲ تا ۴ روز کاری', fee: 85000, priceLabel: '۸۵٬۰۰۰ تومان', isDefault: false },
  { id: 'courier', label: 'ارسال با پیک', deliveryWindow: 'امروز', fee: 0, priceLabel: 'پس کرایه', isDefault: false },
] as const;

export const resolvePetabadShipping = (id: unknown) => PETABAD_SHIPPING.find(method => method.id === id);

export const topicName = (text: string) => text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'خرید جدید';

export const transientPair = (ids: number[], now = Date.now()) => ({ message_ids: ids, expires_at: now + 2 * 60 * 60 * 1000 });