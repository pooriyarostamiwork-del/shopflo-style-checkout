import { useState } from "react";
import { Sparkles, Scale, Wallet, Gift, Wand2 } from "lucide-react";
import { MobilePromptTemplateModal, PromptTemplate } from "./MobilePromptTemplateModal";

const templates: PromptTemplate[] = [
  {
    title: "کشف هوشمند",
    template: "بهترین {category} زیر {budget} تومان",
    slots: [
      { key: "category", label: "دسته‌بندی", placeholder: "هدفون نویزکنسلینگ", default: "هدفون نویزکنسلینگ" },
      { key: "budget", label: "بودجه", placeholder: "۵ میلیون", default: "۵ میلیون" },
    ],
    iconBg: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
    IconComp: Sparkles,
  },
  {
    title: "مقایسه هوشمند",
    template: "{product_a} بهتره یا {product_b}؟",
    slots: [
      { key: "product_a", label: "محصول اول", placeholder: "گلکسی S۲۴", default: "گلکسی S۲۴" },
      { key: "product_b", label: "محصول دوم", placeholder: "آیفون ۱۵", default: "آیفون ۱۵" },
    ],
    iconBg: "linear-gradient(135deg, hsl(199 89% 48%), hsl(199 89% 48% / 0.8))",
    IconComp: Scale,
  },
  {
    title: "بودجه‌محور",
    template: "یه {occasion} شیک تا {budget} پیشنهاد بده",
    slots: [
      { key: "occasion", label: "مناسبت / نوع", placeholder: "هدیه", default: "هدیه" },
      { key: "budget", label: "سقف بودجه", placeholder: "۲ میلیون", default: "۲ میلیون" },
    ],
    iconBg: "linear-gradient(135deg, hsl(142 70% 45%), hsl(142 70% 45% / 0.8))",
    IconComp: Wallet,
  },
  {
    title: "خرید خودکار",
    template: "خودت برام {goal} انتخاب کن و سبد رو بچین",
    slots: [
      { key: "goal", label: "هدف خرید", placeholder: "لوازم سفر", default: "لوازم سفر" },
    ],
    iconBg: "linear-gradient(135deg, hsl(280 70% 55%), hsl(280 70% 55% / 0.8))",
    IconComp: Wand2,
  },
  {
    title: "پرسش از محصول",
    template: "این {product} برای {use_case} خوبه؟",
    slots: [
      { key: "product", label: "محصول", placeholder: "لپ‌تاپ ایسوس", default: "لپ‌تاپ ایسوس" },
      { key: "use_case", label: "کاربرد", placeholder: "برنامه‌نویسی", default: "برنامه‌نویسی" },
    ],
    iconBg: "linear-gradient(135deg, hsl(25 95% 55%), hsl(25 95% 55% / 0.8))",
    IconComp: Gift,
  },
];

interface MobilePromptTipsCardProps {
  onSendMessage: (message: string, forceNew?: boolean) => void;
}

const renderPreview = (tpl: PromptTemplate) =>
  tpl.template.replace(/\{(\w+)\}/g, (_m, k) => {
    const slot = tpl.slots.find((s) => s.key === k);
    return slot ? slot.default : `{${k}}`;
  });

// Render template with slot values highlighted as chips inline
const TemplatePreview = ({ tpl }: { tpl: PromptTemplate }) => {
  const parts: { type: "text" | "slot"; value: string }[] = [];
  const regex = /\{(\w+)\}/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(tpl.template)) !== null) {
    if (m.index > lastIdx) parts.push({ type: "text", value: tpl.template.slice(lastIdx, m.index) });
    const slot = tpl.slots.find((s) => s.key === m![1]);
    parts.push({ type: "slot", value: slot?.default || m[1] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < tpl.template.length) parts.push({ type: "text", value: tpl.template.slice(lastIdx) });

  return (
    <span className="text-[11.5px] text-foreground/80 leading-snug">
      {parts.map((p, i) =>
        p.type === "text" ? (
          <span key={i}>{p.value}</span>
        ) : (
          <span
            key={i}
            className="inline-block mx-0.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-medium"
            style={{
              background: "hsl(var(--primary) / 0.12)",
              color: "hsl(var(--primary))",
              border: "1px dashed hsl(var(--primary) / 0.3)",
            }}
          >
            {p.value}
          </span>
        )
      )}
    </span>
  );
};

export const MobilePromptTipsCard = ({ onSendMessage }: MobilePromptTipsCardProps) => {
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);

  return (
    <section className="mt-8" dir="rtl">
      <div className="px-5 mb-3">
        <p className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "0.88rem" }}>
          <Sparkles className="w-4 h-4 text-primary" />
          الگوهای پرسش — قابل ویرایش
        </p>
      </div>

      {/* Aligned carousel: outer px-5 + inner -mx-5 + flex px-5 */}
      <div className="px-5">
        <div
          className="-mx-5 overflow-x-auto snap-x snap-proximity scrollbar-none"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          <div className="flex gap-2.5 items-stretch px-5">
            {templates.map((tpl, i) => {
              const Icon = tpl.IconComp;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTemplate(tpl)}
                  className="snap-start flex-shrink-0 w-[230px] rounded-2xl text-right active:scale-[0.98] transition-transform overflow-hidden relative"
                  style={{
                    background: "hsl(var(--primary) / 0.04)",
                    border: "1px solid hsl(var(--primary) / 0.12)",
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-25 pointer-events-none"
                    style={{ background: tpl.iconBg, filter: "blur(18px)" }}
                  />
                  <div className="relative p-3.5 flex flex-col gap-2.5 min-h-[150px]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: tpl.iconBg }}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[13px] font-semibold text-foreground leading-tight">
                        {tpl.title}
                      </span>
                    </div>

                    <div
                      className="mt-auto rounded-[12px_12px_4px_12px] px-2.5 py-2"
                      style={{
                        background: "hsl(0 0% 100% / 0.85)",
                        border: "1px solid hsl(0 0% 0% / 0.05)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <TemplatePreview tpl={tpl} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <MobilePromptTemplateModal
        open={!!activeTemplate}
        onClose={() => setActiveTemplate(null)}
        template={activeTemplate}
        onSubmit={(text) => onSendMessage(text, true)}
      />
    </section>
  );
};
