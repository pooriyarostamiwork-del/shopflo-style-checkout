import { useState, useRef, useEffect } from "react";
import { ArrowUp, Zap, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, CartItem } from "@/data/gptCommerceData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";

const placeholderTexts = [
  "«هدفون نویز کنسلینگ زیر ۵ میلیون»",
  "«بهترین تخفیف‌های امروز چیه؟»",
  "«خودت برام خرید کن»",
];

const promptChips = [
  "🎧 هدفون بی‌سیم زیر ۵ میلیون",
  "📱 گوشی موبایل با دوربین خوب",
  "💻 لپ‌تاپ برای برنامه‌نویسی",
  "⌚ ساعت هوشمند مناسب ورزش",
  "🎁 می‌خوام برای دوستم هدیه بخرم",
  "🔥 بهترین تخفیف‌های امروز",
  "🛒 خودت برام خرید کن",
  "⚖️ مقایسه دو محصول",
  "📷 دوربین دیجیتال برای عکاسی",
  "💬 نیاز به مشاوره دارم",
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
  const { getLogoSettings } = useHomepageSettings();
  const firstPageLogo = getLogoSettings("firstPage");

  useEffect(() => {
    if (inputValue) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputValue]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
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
      className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-background via-background to-primary/5"
      dir="rtl"
    >
      {/* Hero */}
      <div className="px-5 pt-12 pb-6 text-center">
        {firstPageLogo.imageUrl ? (
          <img
            src={firstPageLogo.imageUrl}
            alt="فلوکارت"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))",
              border: "1px solid hsl(0 0% 0% / 0.06)",
            }}
          >
            <Zap className="w-8 h-8 text-primary" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-foreground">
          {isAuthenticated && userFirstName
            ? `سلام ${userFirstName} جان 👋`
            : "Flowcart"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 px-4">
          {firstPageLogo.subtitle || "دستیار خرید هوشمند جیبی شما"}
        </p>
      </div>

      {/* Quick categories grid */}
      <div className="px-5 mb-6">
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          دسته‌بندی‌های پرطرفدار
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {quickCategories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => submit(cat.action)}
              className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl active:scale-95 transition-transform"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 0% / 0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-foreground">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="px-5 mb-6">
        <p className="text-xs text-muted-foreground mb-3">یا اینا رو امتحان کن</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="text-xs px-3.5 py-2 rounded-full active:scale-95 transition-transform"
              style={{
                background: "hsl(var(--primary) / 0.06)",
                border: "1px solid hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary))",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Floppy loan info pill */}
      <div className="px-5 mb-24">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))",
            border: "1px solid hsl(var(--primary) / 0.12)",
          }}
        >
          <span className="text-2xl">💸</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground leading-snug">
              تا صد میلیون اعتبار خرید
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              با وام فلوپی، الان بخر بعداً پرداخت کن
            </p>
          </div>
          <button className="text-xs font-semibold text-primary whitespace-nowrap">
            دریافت وام
          </button>
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
              className="w-full min-h-[44px] max-h-[120px] bg-transparent border-none focus:outline-none focus:ring-0 text-right text-base resize-none py-2.5 px-2"
              style={{ lineHeight: "1.5" }}
              dir="rtl"
            />
            {!inputValue && (
              <div
                className="absolute inset-0 flex items-center pointer-events-none px-2 py-2.5 overflow-hidden"
                dir="rtl"
              >
                <span
                  key={placeholderIndex}
                  className="text-muted-foreground/50 text-sm text-right w-full truncate"
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
