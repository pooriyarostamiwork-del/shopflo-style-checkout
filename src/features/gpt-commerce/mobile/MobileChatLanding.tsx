import { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Sparkles, Zap, Layers, ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, CartItem } from "@/data/gptCommerceData";
import slideDrnext from "@/assets/mobile-slide-drnext.jpg";
import slideItick from "@/assets/mobile-slide-itick.jpg";

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
  { id: "drnext", image: slideDrnext, alt: "دکترنکست" },
  { id: "itick", image: slideItick, alt: "آی‌تیکت" },
];

interface MobileChatLandingProps {
  onSendMessage: (message: string, forceNew?: boolean) => void;
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  isProcessing: boolean;
  isAuthenticated?: boolean;
  userFirstName?: string;
  onOpenBaskets?: () => void;
  onOpenCart?: () => void;
  onOpenAccount?: () => void;
}

export const MobileChatLanding = ({
  onSendMessage,
  isProcessing,
  isAuthenticated,
  userFirstName,
  onOpenBaskets,
  onOpenCart,
  onOpenAccount,
}: MobileChatLandingProps) => {
  const [inputValue, setInputValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

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

  // Track which slide is most visible — measure per-slide width (RTL-safe)
  const handleSliderScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    const firstSlide = el.querySelector<HTMLElement>("[data-slide]");
    const slideW = firstSlide ? firstSlide.offsetWidth + 12 /* gap */ : el.clientWidth;
    // In RTL, scrollLeft is <= 0 in most browsers
    const offset = Math.abs(el.scrollLeft);
    const idx = Math.min(
      heroSlides.length - 1,
      Math.max(0, Math.round(offset / slideW))
    );
    if (idx !== activeSlide) setActiveSlide(idx);
  };

  const goToSlide = (i: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const firstSlide = el.querySelector<HTMLElement>("[data-slide]");
    const slideW = firstSlide ? firstSlide.offsetWidth + 12 : el.clientWidth;
    const target = slideW * i;
    // RTL → negative scrollLeft
    el.scrollTo({ left: -target, behavior: "smooth" });
  };

  const submit = (msg?: string) => {
    const text = (msg ?? inputValue).trim();
    if (!text || isProcessing) return;
    onSendMessage(text, true);
    setInputValue("");
  };

  // Subtle dotted background pattern (light)
  const bgPattern: React.CSSProperties = {
    backgroundImage:
      "radial-gradient(hsl(var(--primary) / 0.06) 1px, transparent 1px)",
    backgroundSize: "18px 18px",
  };

  return (
    <div
      className="relative flex flex-col min-h-full overflow-y-auto bg-gradient-to-b from-background via-background to-primary/5 pb-44"
      dir="rtl"
    >
      {/* Light dotted pattern overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={bgPattern}
      />

      <div className="relative z-10 flex flex-col">
        {/* Inside logo + subtitle (larger) */}
        <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Flowcart</span>
          </div>
          <p className="text-sm text-muted-foreground leading-snug max-w-[260px]">
            دستیار خرید هوشمند تو — فقط بگو چی می‌خوای
          </p>
          {isAuthenticated && userFirstName && (
            <p className="text-sm font-medium text-foreground mt-2">
              سلام {userFirstName} جان 👋
            </p>
          )}
        </div>

        {/* Hero slider — slidable, snap-proximity for easy swipe */}
        <div className="pt-2 pb-5">
          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="hero-slider-track overflow-x-auto snap-x snap-proximity scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              scrollPaddingInline: "1.25rem",
            }}
          >
            <style>{`.hero-slider-track::-webkit-scrollbar{display:none}`}</style>
            <div className="flex gap-3 ps-5 pe-5">
              {heroSlides.map((s) => (
                <div
                  key={s.id}
                  data-slide
                  className="snap-start shrink-0 w-[97%] rounded-2xl overflow-hidden relative"
                  style={{
                    border: "1px solid hsl(0 0% 0% / 0.06)",
                    aspectRatio: "1920 / 1080",
                    background:
                      "linear-gradient(110deg, hsl(0 0% 95%) 30%, hsl(0 0% 90%) 50%, hsl(0 0% 95%) 70%)",
                    backgroundSize: "200% 100%",
                    animation: "heroShimmer 1.6s linear infinite",
                  }}
                >
                  <style>{`@keyframes heroShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                  <img
                    src={s.image}
                    alt={s.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover relative z-10"
                    draggable={false}
                    onLoad={(e) => {
                      const parent = e.currentTarget.parentElement as HTMLElement;
                      parent.style.animation = "none";
                      parent.style.background = "hsl(0 0% 96%)";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Dot indicators — clickable */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`اسلاید ${i + 1}`}
                onClick={() => goToSlide(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === activeSlide ? 18 : 6,
                  height: 6,
                  background:
                    i === activeSlide
                      ? "hsl(var(--primary))"
                      : "hsl(0 0% 0% / 0.15)",
                }}
              />
            ))}
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
          className="flex items-center gap-2 p-2 rounded-2xl"
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
                className="absolute inset-0 flex items-center pointer-events-none px-2"
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
          <div className="flex items-center gap-1.5">
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
