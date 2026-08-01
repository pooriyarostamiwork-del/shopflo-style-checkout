// Config for the conversational discovery components (quiz, wizard, budget).
// Front-end only: no backend, no AI — the shapes mirror what an agent would emit.

export type PgInteractive = "quiz" | "wizard" | "budget";

export interface PgQuizOption {
  id: string;
  label: string;
  emoji?: string;
  hint?: string;
}

export interface PgQuizConfig {
  question: string;
  helper?: string;
  options: PgQuizOption[];
  multi?: boolean;
}

export const PG_QUIZ: PgQuizConfig = {
  question: "حیوان خونگی‌ت چیه؟",
  helper: "یکی رو انتخاب کن تا پیشنهادها رو دقیق‌تر کنم",
  options: [
    { id: "dog", label: "سگ", emoji: "🐶", hint: "خشک، تشویقی، اسباب‌بازی" },
    { id: "cat", label: "گربه", emoji: "🐱", hint: "خاک، کنسرو، درخت گربه" },
    { id: "bird", label: "پرنده", emoji: "🐦", hint: "دانه، قفس، مکمل" },
    { id: "rabbit", label: "خرگوش", emoji: "🐰", hint: "یونجه، بستر، پلت" },
  ],
};

export interface PgWizardStep {
  id: string;
  title: string;
  question: string;
  options: PgQuizOption[];
}

export const PG_WIZARD_STEPS: PgWizardStep[] = [
  {
    id: "pet",
    title: "حیوان",
    question: "برای کدوم حیوان می‌گردی؟",
    options: [
      { id: "dog", label: "سگ", emoji: "🐶" },
      { id: "cat", label: "گربه", emoji: "🐱" },
      { id: "bird", label: "پرنده", emoji: "🐦" },
      { id: "rabbit", label: "خرگوش", emoji: "🐰" },
    ],
  },
  {
    id: "age",
    title: "سن",
    question: "چند سالشه؟",
    options: [
      { id: "baby", label: "بچه", hint: "زیر ۱ سال" },
      { id: "adult", label: "بالغ", hint: "۱ تا ۷ سال" },
      { id: "senior", label: "سالمند", hint: "بالای ۷ سال" },
    ],
  },
  {
    id: "weight",
    title: "وزن",
    question: "وزنش تقریباً چقدره؟",
    options: [
      { id: "s", label: "کوچک", hint: "زیر ۵ کیلو" },
      { id: "m", label: "متوسط", hint: "۵ تا ۱۵ کیلو" },
      { id: "l", label: "بزرگ", hint: "بالای ۱۵ کیلو" },
    ],
  },
  {
    id: "budget",
    title: "بودجه",
    question: "بودجه‌ت چه محدوده‌ایه؟",
    options: [
      { id: "low", label: "اقتصادی", hint: "تا ۱ میلیون" },
      { id: "mid", label: "متوسط", hint: "۱ تا ۳ میلیون" },
      { id: "high", label: "پریمیوم", hint: "بالای ۳ میلیون" },
    ],
  },
  {
    id: "need",
    title: "نیاز",
    question: "دنبال چی هستی؟",
    options: [
      { id: "food", label: "غذا" },
      { id: "toy", label: "اسباب‌بازی" },
      { id: "health", label: "بهداشت و درمان" },
      { id: "accessory", label: "لوازم جانبی" },
    ],
  },
];

export const PG_BUDGET = {
  min: 200_000,
  max: 8_000_000,
  step: 100_000,
  initial: 3_000_000,
  presets: [1_000_000, 2_500_000, 5_000_000],
};
