// Cross-sell bundle config for the playground.
// Front-end only: the shapes mirror what an AI agent would emit for a
// personalized bundle (per-item reason, per-item discount, bundle discount).
import { PgProduct, PG_PRODUCTS } from "./mockStore";

export interface PgCrossSellItem {
  product: PgProduct;
  /** Personalized reason for THIS item. */
  why: string;
  /** Short tag shown on the card, e.g. «پرتکرار با انتخاب تو». */
  tag?: string;
  /** Item-level discount percent applied inside the bundle. */
  discountPercent: number;
}

export interface PgCrossSellBundle {
  id: string;
  title: string;
  /** Personalized reason for the whole bundle. */
  why: string;
  /** Signal line, e.g. based on past orders / current cart. */
  basis: string;
  /** Extra percent unlocked only when the full list is added. */
  bundleBonusPercent: number;
  items: PgCrossSellItem[];
}

const p = (id: string) => PG_PRODUCTS.find((x) => x.id === id)!;

export const PG_CROSS_SELL: PgCrossSellBundle = {
  id: "cs-audio-setup",
  title: "ست کامل‌کننده هدفون آرام‌X",
  why: "این سه مورد بیشترین هم‌خریدی را با هدفونی که انتخاب کردی دارند: شارژ در سفر، صدای بلند برای جمع و تایپ بی‌صدا هنگام تماس. با هم گرفتنشان هم هزینه ارسال جداگانه ندارد.",
  basis: "بر اساس سبد فعلی تو و ۱٫۲ هزار خرید مشابه",
  bundleBonusPercent: 7,
  items: [
    {
      product: p("pg-5"),
      why: "هدفونت ۳۰ ساعت شارژ دارد؛ این پاوربانک برای سفرهای بیشتر از دو روز کافی است و همان کابل Type-C را می‌گیرد.",
      tag: "۸۴٪ با هم خریده شده",
      discountPercent: 12,
    },
    {
      product: p("pg-3"),
      why: "برای وقتی هدفون مناسب نیست (جمع دوستانه یا حمام) — ضدآب است و از همان اپ کنترل می‌شود.",
      tag: "تکمیل‌کننده صوتی",
      discountPercent: 15,
    },
    {
      product: p("pg-2"),
      why: "کنترل پخش و پاسخ به تماس روی مچ، بدون درآوردن گوشی؛ با هدفون به‌صورت مستقیم جفت می‌شود.",
      tag: "پیشنهاد شخصی‌سازی‌شده",
      discountPercent: 8,
    },
  ],
};

/* ---------- Pricing helpers (pure, front-end only) ---------- */

export const csItemFinal = (i: PgCrossSellItem) =>
  Math.round(i.product.price * (1 - i.discountPercent / 100));

export const csItemSaving = (i: PgCrossSellItem) => i.product.price - csItemFinal(i);

export const csBundleMath = (b: PgCrossSellBundle) => {
  const listPrice = b.items.reduce((s, i) => s + i.product.price, 0);
  const afterItems = b.items.reduce((s, i) => s + csItemFinal(i), 0);
  const itemsSaving = listPrice - afterItems;
  const bonusSaving = Math.round(afterItems * (b.bundleBonusPercent / 100));
  const finalPrice = afterItems - bonusSaving;
  const totalSaving = listPrice - finalPrice;
  const totalPercent = Math.round((totalSaving / listPrice) * 100);
  return { listPrice, afterItems, itemsSaving, bonusSaving, finalPrice, totalSaving, totalPercent };
};
