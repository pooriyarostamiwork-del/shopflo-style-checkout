import { useMemo, useState } from "react";
import { Check, ChevronLeft, Sparkles, SlidersHorizontal } from "lucide-react";
import type { Clarification, ClarificationOption } from "@/data/gptCommerceData";

const Shell = ({
  icon,
  eyebrow,
  title,
  helper,
  onSkip,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  helper?: string;
  onSkip?: () => void;
  children: React.ReactNode;
}) => (
  <div dir="rtl" className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="flex items-start gap-2.5 p-3.5 pb-3">
      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-wide text-primary">{eyebrow}</p>
        <p className="text-sm font-semibold leading-6 mt-0.5">{title}</p>
        {helper && <p className="text-[11px] leading-5 text-muted-foreground mt-1">{helper}</p>}
      </div>
      {onSkip && (
        <button
          onClick={onSkip}
          className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          رد می‌کنم
        </button>
      )}
    </div>
    <div className="px-3.5 pb-3.5">{children}</div>
  </div>
);

const OptionButton = ({
  option,
  selected,
  onClick,
}: {
  option: ClarificationOption;
  selected?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-right rounded-xl border px-3 py-2.5 transition-colors ${
      selected
        ? "border-primary bg-primary/5"
        : "border-border bg-background hover:bg-muted/60"
    }`}
  >
    <div className="flex items-center gap-2">
      <span
        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {selected && <Check className="w-3 h-3" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-5">{option.label}</span>
        {option.hint && (
          <span className="block text-[11px] text-muted-foreground leading-4 mt-0.5">{option.hint}</span>
        )}
      </span>
    </div>
  </button>
);

/**
 * Renders an agent-supplied clarification as an interactive card.
 * Single question → quiz card. Multiple attributes → step-by-step selector.
 * The answer is sent back as a normal chat message.
 */
export const ClarificationBlock = ({
  clarification,
  onAnswer,
}: {
  clarification: Clarification;
  onAnswer: (message: string) => void;
}) => {
  const [done, setDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const steps = useMemo(() => clarification.steps ?? [], [clarification.steps]);

  if (done) {
    return (
      <div dir="rtl" className="rounded-2xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
        باشه، ادامه می‌دیم.
      </div>
    );
  }

  if (clarification.kind === "steps" && steps.length > 0) {
    const step = steps[Math.min(stepIndex, steps.length - 1)];
    const pick = (label: string) => {
      const nextAnswers = { ...answers, [step.title]: label };
      setAnswers(nextAnswers);
      if (stepIndex + 1 < steps.length) {
        setStepIndex(stepIndex + 1);
      } else {
        setDone(true);
        onAnswer(
          Object.entries(nextAnswers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("، ")
        );
      }
    };

    return (
      <Shell
        icon={<SlidersHorizontal className="w-4 h-4" />}
        eyebrow={`مرحله ${stepIndex + 1} از ${steps.length}`}
        title={step.question}
        helper={clarification.helper}
        onSkip={() => {
          setDone(true);
          onAnswer("فرقی نمی‌کنه، خودت انتخاب کن");
        }}
      >
        <div className="space-y-2">
          {step.options.map((o, i) => (
            <OptionButton key={`${o.label}-${i}`} option={o} onClick={() => pick(o.label)} />
          ))}
        </div>
        {stepIndex > 0 && (
          <button
            onClick={() => setStepIndex(stepIndex - 1)}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-3 h-3" />
            مرحله قبل
          </button>
        )}
      </Shell>
    );
  }

  const options = clarification.options ?? [];
  if (options.length === 0) return null;

  return (
    <Shell
      icon={<Sparkles className="w-4 h-4" />}
      eyebrow="برای دقیق‌تر شدن پیشنهادها"
      title={clarification.question || "کدوم گزینه برات مناسب‌تره؟"}
      helper={clarification.helper}
      onSkip={() => {
        setDone(true);
        onAnswer("فرقی نمی‌کنه، خودت انتخاب کن");
      }}
    >
      <div className="space-y-2">
        {options.map((o, i) => (
          <OptionButton
            key={`${o.label}-${i}`}
            option={o}
            onClick={() => {
              setDone(true);
              onAnswer(o.label);
            }}
          />
        ))}
      </div>
    </Shell>
  );
};
