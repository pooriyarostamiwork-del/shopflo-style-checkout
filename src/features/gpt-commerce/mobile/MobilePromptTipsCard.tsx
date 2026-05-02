import { Sparkles, Scale, Wallet, Gift, Wand2, MessageCircle } from "lucide-react";

interface Tip {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  example: string;
  gradient: string;
  iconBg: string;
}

const tips: Tip[] = [
  {
    icon: Sparkles,
    title: "کشف هوشمند",
    example: "بهترین هدفون نویزکنسلینگ زیر ۵ میلیون",
    gradient: "linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.02))",
    iconBg: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
  },
  {
    icon: Scale,
    title: "مقایسه هوشمند",
    example: "گلکسی S۲۴ بهتره یا آیفون ۱۵؟",
    gradient: "linear-gradient(135deg, hsl(199 89% 48% / 0.10), hsl(199 89% 48% / 0.02))",
    iconBg: "linear-gradient(135deg, hsl(199 89% 48%), hsl(199 89% 48% / 0.8))",
  },
  {
    icon: Wallet,
    title: "بودجه‌محور",
    example: "یه هدیه شیک تا ۲ میلیون پیشنهاد بده",
    gradient: "linear-gradient(135deg, hsl(142 70% 45% / 0.10), hsl(142 70% 45% / 0.02))",
    iconBg: "linear-gradient(135deg, hsl(142 70% 45%), hsl(142 70% 45% / 0.8))",
  },
  {
    icon: Wand2,
    title: "خرید خودکار",
    example: "خودت برام انتخاب کن و سبد رو بچین",
    gradient: "linear-gradient(135deg, hsl(280 70% 55% / 0.10), hsl(280 70% 55% / 0.02))",
    iconBg: "linear-gradient(135deg, hsl(280 70% 55%), hsl(280 70% 55% / 0.8))",
  },
  {
    icon: Gift,
    title: "پرسش از محصول",
    example: "این لپ‌تاپ برای برنامه‌نویسی خوبه؟",
    gradient: "linear-gradient(135deg, hsl(25 95% 55% / 0.10), hsl(25 95% 55% / 0.02))",
    iconBg: "linear-gradient(135deg, hsl(25 95% 55%), hsl(25 95% 55% / 0.8))",
  },
];

interface MobilePromptTipsCardProps {
  onSendMessage: (message: string, forceNew?: boolean) => void;
}

export const MobilePromptTipsCard = ({ onSendMessage }: MobilePromptTipsCardProps) => {
  return (
    <section className="mt-8" dir="rtl">
      <div className="px-5 mb-3">
        <p className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "0.88rem" }}>
          <Sparkles className="w-4 h-4 text-primary" />
          هوشمندانه‌تر بپرس
        </p>
      </div>
      <div
        className="overflow-x-auto snap-x snap-proximity scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        <div
          className="flex gap-2.5 items-stretch"
          style={{ paddingInlineStart: "1.25rem", paddingInlineEnd: "1.25rem" }}
        >
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSendMessage(tip.example, true)}
                className="snap-start flex-shrink-0 w-[210px] rounded-2xl text-right active:scale-[0.98] transition-transform overflow-hidden relative"
                style={{
                  background: tip.gradient,
                  border: "1px solid hsl(var(--primary) / 0.12)",
                }}
              >
                {/* Decorative gradient blob */}
                <div
                  aria-hidden
                  className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-30 pointer-events-none"
                  style={{ background: tip.iconBg, filter: "blur(18px)" }}
                />
                <div className="relative p-3.5 flex flex-col gap-2.5 min-h-[140px]">
                  {/* Header: icon + title */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: tip.iconBg }}
                    >
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[13px] font-semibold text-foreground leading-tight">
                      {tip.title}
                    </span>
                  </div>

                  {/* Example chat-bubble snippet */}
                  <div
                    className="mt-auto rounded-[12px_12px_4px_12px] px-2.5 py-2 flex items-start gap-1.5"
                    style={{
                      background: "hsl(0 0% 100% / 0.85)",
                      border: "1px solid hsl(0 0% 0% / 0.05)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <MessageCircle className="w-3 h-3 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <span className="text-[11.5px] text-foreground/80 leading-snug line-clamp-3">
                      {tip.example}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
