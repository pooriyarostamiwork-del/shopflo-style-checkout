import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowRight,
  ShoppingCart,
  Bot,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

/* ───────────────────── Pitchdeck Viewer ───────────────────── */

const TOTAL_SLIDES = 6;

const placeholderSlides = [
  { title: "فلوکارت", subtitle: "دستیار خرید هوش مصنوعی", icon: Zap },
  { title: "مشکل", subtitle: "تجربه خرید آنلاین پیچیده و زمان‌بر", icon: ShoppingCart },
  { title: "راه‌حل", subtitle: "خرید گفتگو محور با هوش مصنوعی", icon: Bot },
  { title: "محصولات", subtitle: "سبد خرید یک کلیکی و دستیار هوشمند", icon: LayoutGrid },
  { title: "فناوری", subtitle: "مدل‌های زبانی بزرگ و جستجوی معنایی", icon: Sparkles },
  { title: "تماس با ما", subtitle: "flowcart.ai", icon: Zap },
];

function PitchdeckViewer() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(TOTAL_SLIDES - 1, c + 1));

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const slide = placeholderSlides[current];
  const Icon = slide.icon;

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[900px] mx-auto rounded-2xl border border-border overflow-hidden transition-all duration-300 ${
        isFullscreen ? "bg-foreground/95 flex flex-col justify-center" : "bg-card"
      }`}
    >
      {/* Slide area — 16:9 */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${
            isFullscreen ? "text-background" : "text-foreground"
          }`}
        >
          {/* decorative blurred circle */}
          <div className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-vazir">{slide.title}</h3>
            <p className={`text-sm sm:text-base ${isFullscreen ? "text-background/60" : "text-muted-foreground"} font-vazir`}>
              {slide.subtitle}
            </p>
          </div>

          {/* slide number watermark */}
          <span className={`absolute bottom-4 left-4 text-xs ${isFullscreen ? "text-background/20" : "text-muted-foreground/30"}`}>
            Slide {current + 1}
          </span>
        </div>
      </div>

      {/* Navigation bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-t ${
          isFullscreen ? "border-background/10" : "border-border"
        }`}
      >
        <button
          onClick={prev}
          disabled={current === 0}
          className="p-1.5 rounded-lg hover:bg-primary/5 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className={`text-xs tabular-nums ${isFullscreen ? "text-background/50" : "text-muted-foreground"}`}>
          {current + 1} / {TOTAL_SLIDES}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={next}
            disabled={current === TOTAL_SLIDES - 1}
            className="p-1.5 rounded-lg hover:bg-primary/5 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Product Card ───────────────────── */

interface ProductCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  delay: string;
}

function ProductCard({ to, icon, title, subtitle, description, delay }: ProductCardProps) {
  return (
    <Link
      to={to}
      className="group flex-1 min-w-[260px] max-w-[420px] rounded-2xl border border-border bg-card p-8 flex flex-col gap-4 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary/15">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground font-vazir">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed font-vazir">{description}</p>
      <div className="flex items-center gap-1.5 text-primary text-sm font-medium mt-auto pt-2">
        <span className="font-vazir">مشاهده</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
      </div>
    </Link>
  );
}

/* ───────────────────── Floating Decorative Shapes ───────────────────── */

function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute w-32 h-32 rounded-full bg-primary/5 animate-float-slow"
        style={{ top: "8%", left: "5%", ["--float-duration" as string]: "22s", ["--float-distance" as string]: "-10px" }}
      />
      <div
        className="absolute w-20 h-20 rounded-2xl bg-primary/[0.07] animate-float-slow"
        style={{ top: "15%", right: "8%", ["--float-duration" as string]: "28s", ["--float-distance" as string]: "-8px", ["--float-rotation" as string]: "6deg" }}
      />
      <div
        className="absolute w-16 h-16 rounded-full bg-primary/5 animate-float-slow"
        style={{ bottom: "20%", left: "10%", ["--float-duration" as string]: "30s", ["--float-distance" as string]: "-12px" }}
      />
      <div
        className="absolute w-24 h-12 rounded-full bg-primary/[0.04] animate-float-slow"
        style={{ bottom: "12%", right: "6%", ["--float-duration" as string]: "26s", ["--float-distance" as string]: "-6px", ["--float-rotation" as string]: "-4deg" }}
      />
    </div>
  );
}

/* ───────────────────── Landing Page ───────────────────── */

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center" dir="rtl">
      <FloatingShapes />

      {/* Radial gradient backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1000px] mx-auto px-6 py-16 sm:py-24 flex flex-col items-center gap-16">
        {/* ── Hero ── */}
        <header className="flex flex-col items-center gap-5 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground font-vazir tracking-tight">
            فلوکارت
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-vazir max-w-md leading-relaxed">
            دستیار خرید هوش مصنوعی و سبد خرید یک کلیکی
          </p>
        </header>

        {/* ── Pitchdeck ── */}
        <section className="w-full animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <PitchdeckViewer />
        </section>

        {/* ── Product Paths ── */}
        <section className="w-full flex flex-col sm:flex-row gap-5 justify-center items-stretch">
          <ProductCard
            to="/gptcommerce"
            icon={<Bot className="w-6 h-6" />}
            title="GPT Commerce"
            subtitle="AI Shopping Assistant"
            description="دستیار خرید هوشمند مبتنی بر هوش مصنوعی — جستجو، مقایسه و خرید در یک گفتگو."
            delay="0.2s"
          />
          <ProductCard
            to="/farsi"
            icon={<ShoppingCart className="w-6 h-6" />}
            title="فلوکارت چکاوت"
            subtitle="One-Click Persian Cart"
            description="سبد خرید فارسی با پرداخت یک کلیکی، کوپن هوشمند و تجربه خرید روان."
            delay="0.3s"
          />
        </section>
      </div>
    </div>
  );
}
