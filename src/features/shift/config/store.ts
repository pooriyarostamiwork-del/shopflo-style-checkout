// Single-vendor store identity for /shift. Edit to rebrand — no DB, no provider.
export const SHIFT_STORE = {
  slug: "shift",
  name_fa: "فروشگاه شیفت",
  tagline_fa: "همه‌چیز در یک فروشگاه، با مشاور هوشمند شما",
  logo_url: "",
  hero_image_url: "",
  theme_primary: "#696FC7",
  theme_accent: "#F5F6FA",
  suggested_prompts: [
    "چی پیشنهاد می‌دی؟",
    "محبوب‌ترین محصول‌ها رو نشون بده",
    "یه هدیه خوب می‌خوام",
  ],
} as const;

export type ShiftStoreConfig = typeof SHIFT_STORE;
