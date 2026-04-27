import { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, CartItem } from "@/data/gptCommerceData";

const placeholderTexts = [
  "«هدفون نویز کنسلینگ زیر ۵ میلیون»",
  "«بهترین تخفیف‌های امروز چیه؟»",
  "«خودت برام خرید کن»",
];

// Capped to 6 chips → fits in max 3 rows on 360–430px viewports
const promptChips = [
  "🎧 هدفون بی‌سیم زیر ۵ میلیون",
  "📱 گوشی موبایل با دوربین خوب",
  "💻 لپ‌تاپ برای برنامه‌نویسی",
  "🎁 هدیه برای دوست",
  "🔥 بهترین تخفیف‌های امروز",
  "🛒 خودت برام خرید کن",
];

const heroSlides = [
  {
    id: "loan",
    emoji: "💸",
    title: "وام فلوپی",
    subtitle: "تا ۱۰۰ میلیون اعتبار خرید",
    gradient:
      "linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))",
  },
  {
    id: "deals",
    emoji: "🔥",
    title: "پیشنهادهای داغ امروز",
    subtitle: "تا ۴۰٪ تخفیف روی منتخب‌ها",
    gradient:
      "linear-gradient(135deg, hsl(20 95% 60% / 0.18), hsl(20 95% 60% / 0.05))",
  },
  {
    id: "shipping",
    emoji: "🚚",
    title: "ارسال رایگان",
    subtitle: "برای سفارش بالای ۲ میلیون",
    gradient:
      "linear-gradient(135deg, hsl(150 60% 45% / 0.18), hsl(150 60% 45% / 0.05))",
  },
];

interface MobileChatLandingProps {
  onSendMessage: (message: string, forceNew?: boolean) => void;
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  isProcessing: boolean;
  isAuthenticated?: boolean;
  userFirstName?: string;
}

export const MobileChatLanding = ({
  onSendMessage,
  isProcessing,
  isAuthenticated,
  userFirstName,
}: MobileChatLandingProps) => {
  const [inputValue, setInputValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputValue) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputValue]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
      const sh = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(sh, 120) + "px";
    }
  }, [inputValue]);

  const submit = (msg?: string) => {
    const text = (msg ?? inputValue).trim();
    if (!text || isProcessing) return;
    onSendMessage(text, true);
    setInputValue("");
  };

  return (
    <div
      className="flex flex-col min-h-full overflow-y-auto bg-gradient-to-b from-background via-background to-primary/5 pb-44"
      dir="rtl"
    >
      {/* Optional personalized greeting */}
      {isAuthenticated && userFirstName && (
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-xl font-semibold text-foreground">
            سلام {userFirstName} جان 👋
          </h1>
        </div>
      )}

      {/* Hero slider */}
      <div className="pt-4 pb-5">
        <div className="overflow-x-auto snap-x snap-mandatory scrollbar-none px-5">
          <div className="flex gap-3">
            {heroSlides.map((s) => (
              <div
                key={s.id}
                className="snap-center shrink-0 w-[85%] rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: s.gradient,
                  border: "1px solid hsl(0 0% 0% / 0.06)",
                  minHeight: 96,
                }}
              >
                <span className="text-3xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {s.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt chips — max 3 rows */}
      <div className="px-5">
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          از این‌ها شروع کن
        </p>
        <div className="flex flex-wrap gap-2">
          {promptChips.map((chip) => (
            <button
              key={chip}
              onClick={() => submit(chip.replace(/^[^\u0600-\u06FF\w]+\s*/, ""))}
              className="text-xs px-3.5 py-2 rounded-full active:scale-95 transition-transform leading-tight"
              style={{
                background: "hsl(var(--primary) / 0.06)",
                border: "1px solid hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary))",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky bottom input */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        style={{
          background:
            "linear-gradient(180deg, hsl(0 0% 100% / 0), hsl(0 0% 100% / 0.95) 30%)",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2 p-2 rounded-2xl"
          style={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(0 0% 0% / 0.08)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder=""
              className="w-full min-h-[56px] max-h-[120px] bg-transparent border-none focus:outline-none focus:ring-0 text-right text-base resize-none py-2.5 px-2"
              style={{ lineHeight: "1.5" }}
              dir="rtl"
            />
            {!inputValue && (
              <div
                className="absolute inset-0 flex items-start pointer-events-none px-2 py-2.5"
                dir="rtl"
              >
                <span
                  key={placeholderIndex}
                  className="text-muted-foreground/50 text-sm text-right w-full whitespace-normal break-words leading-snug"
                >
                  {placeholderTexts[placeholderIndex]}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 pb-1">
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
              style={{
                background: "hsl(0 0% 98%)",
                border: "1px solid hsl(0 0% 0% / 0.06)",
              }}
            >
              <Mic className="w-4 h-4 text-muted-foreground" />
            </button>
            <Button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="h-9 w-9 rounded-full p-0"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
