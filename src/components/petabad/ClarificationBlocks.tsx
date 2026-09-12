import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Pencil, Sparkles, SlidersHorizontal } from "lucide-react";
import type { Clarification, ClarificationOption, QuestionJourney } from "@/data/petabadData";
import { ShiningText } from "./ShiningText";

/**
 * One card for the whole guidance journey. Answered questions collapse into a
 * list (question → answer, changeable while the journey is live), the current
 * question sits below with its options, and a shimmer shows while the next
 * question is being checked against stock. Read-only once done or abandoned.
 */
export const JourneyCard = ({
  journey,
  onAnswer,
  onRedo,
}: {
  journey: QuestionJourney;
  onAnswer: (answer: string) => void;
  onRedo: (stepIndex: number) => void;
}) => {
  const [picked, setPicked] = useState<string[]>([]);
  const current = journey.current;
  const live = journey.status === "asking" || journey.status === "checking";
  const busy = journey.status === "checking";

  // A fresh question always starts with an empty selection.
  useEffect(() => setPicked([]), [current?.id, current?.question]);

  if (!current && journey.steps.length === 0) return null;

  const title =
    journey.status === "asking" && current
      ? current.question || "کدوم گزینه برات مناسب‌تره؟"
      : busy
        ? "یک لحظه…"
        : "انتخاب‌هات";
  const eyebrow = journey.status === "asking" && current?.progress ? current.progress : "راهنمای انتخاب";

  return (
    <div dir="rtl" className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-start gap-2.5 p-3.5 pb-3">
        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium tracking-wide text-primary">{eyebrow}</p>
          <p className="text-sm font-semibold leading-6 mt-0.5">{title}</p>
          {journey.status === "asking" && current && (current.multi || current.helper) && (
            <p className="text-[11px] leading-5 text-muted-foreground mt-1">
              {current.multi ? "می‌تونی چند گزینه انتخاب کنی" : current.helper}
            </p>
          )}
        </div>
        {journey.status === "asking" && current && (
          <button
            onClick={() => onAnswer("فرقی نمی‌کنه، خودت انتخاب کن")}
            className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            رد می‌کنم
          </button>
        )}
      </div>

      {journey.steps.length > 0 && (
        <div className="mx-3.5 mb-3 rounded-xl border border-border divide-y divide-border overflow-hidden">
          {journey.steps.map((s, i) => {
            const answer = s.answer.trim() || "فرقی نمی‌کنه";
            const row = (
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-muted-foreground leading-4">{s.card.title || s.card.question}</span>
                  <span className="block text-[13px] font-medium leading-5 truncate">{answer}</span>
                </span>
                {live && !busy && <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              </div>
            );
            return live && !busy ? (
              <button key={`${s.card.id}-${i}`} onClick={() => onRedo(i)} className="w-full text-right hover:bg-muted/60 transition-colors">
                {row}
              </button>
            ) : (
              <div key={`${s.card.id}-${i}`}>{row}</div>
            );
          })}
        </div>
      )}

      {busy && (
        <div className="px-3.5 pb-3.5 text-[12px]">
          <ShiningText text="دارم گزینه‌های بعدی رو از موجودی چک می‌کنم…" />
        </div>
      )}

      {journey.status === "asking" && current && (current.options?.length ?? 0) > 0 && (
        <div className="px-3.5 pb-3.5">
          <div className="space-y-2">
            {current.options!.map((o, i) => (
              <OptionButton
                key={`${o.label}-${i}`}
                option={o}
                multi={current.multi}
                selected={current.multi ? picked.includes(o.label) : undefined}
                onClick={() => {
                  if (current.multi) {
                    setPicked((prev) => (prev.includes(o.label) ? prev.filter((p) => p !== o.label) : [...prev, o.label]));
                  } else {
                    onAnswer(o.label);
                  }
                }}
              />
            ))}
          </div>
          {current.multi && <ConfirmButton count={picked.length} onClick={() => onAnswer(picked.join(" و "))} />}
        </div>
      )}
    </div>
  );
};

/**
 * The shopper reply that came after this message, if any.
 * `undefined` → the card is still awaiting an answer and stays interactive.
 */
export const answerAfter = (
  messages: Array<{ id: string; role: string; content: string }>,
  messageId: string
): string | undefined => {
  const at = messages.findIndex((m) => m.id === messageId);
  if (at < 0) return undefined;
  const next = messages.slice(at + 1).find((m) => m.role === "user");
  return next ? next.content : undefined;
};

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
  multi,
  onClick,
}: {
  option: ClarificationOption;
  selected?: boolean;
  multi?: boolean;
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
        className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
          multi ? "rounded-[5px]" : "rounded-full"
        } ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
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

const ConfirmButton = ({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={count === 0}
    className="mt-2.5 w-full rounded-xl bg-primary px-3 py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity disabled:opacity-40"
  >
    {count > 0 ? `ادامه (${count.toLocaleString("fa-IR")} مورد انتخاب شد)` : "یکی یا چند مورد انتخاب کن"}
  </button>
);

/**
 * Renders an agent-supplied clarification as an interactive card.
 * Single question → quiz card. Multiple attributes → step-by-step selector.
 * Steps flagged `multi` let the shopper pick several needs at once.
 * The answer is sent back as a normal chat message.
 */
export const ClarificationBlock = ({
  clarification,
  onAnswer,
  resolvedWith,
}: {
  clarification: Clarification;
  onAnswer: (message: string) => void;
  /** Set once the shopper answered: the card collapses to a static summary. */
  resolvedWith?: string;
}) => {
  const [done, setDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string[]>([]);

  const steps = useMemo(() => clarification.steps ?? [], [clarification.steps]);

  // Answered cards disappear entirely — the shopper's own reply is the record.
  if (resolvedWith !== undefined) return null;


  if (done) {
    // Answer is sent as a normal chat message; nothing extra should linger here.
    return null;
  }

  if (clarification.kind === "steps" && steps.length > 0) {
    const step = steps[Math.min(stepIndex, steps.length - 1)];
    const finish = (nextAnswers: Record<string, string>) => {
      setDone(true);
      onAnswer(
        Object.entries(nextAnswers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("، ")
      );
    };
    const advance = (label: string) => {
      const nextAnswers = { ...answers, [step.title]: label };
      setAnswers(nextAnswers);
      setPicked([]);
      if (stepIndex + 1 < steps.length) setStepIndex(stepIndex + 1);
      else finish(nextAnswers);
    };

    return (
      <Shell
        icon={<SlidersHorizontal className="w-4 h-4" />}
        eyebrow={`مرحله ${(stepIndex + 1).toLocaleString("fa-IR")} از ${steps.length.toLocaleString("fa-IR")}`}
        title={step.question}
        helper={step.multi ? "می‌تونی چند گزینه انتخاب کنی" : clarification.helper}
        onSkip={() => {
          setDone(true);
          onAnswer("فرقی نمی‌کنه، خودت انتخاب کن");
        }}
      >
        <div className="space-y-2">
          {step.options.map((o, i) => (
            <OptionButton
              key={`${o.label}-${i}`}
              option={o}
              multi={step.multi}
              selected={step.multi ? picked.includes(o.label) : undefined}
              onClick={() => {
                if (step.multi) {
                  setPicked((prev) =>
                    prev.includes(o.label) ? prev.filter((p) => p !== o.label) : [...prev, o.label]
                  );
                } else {
                  advance(o.label);
                }
              }}
            />
          ))}
        </div>
        {step.multi && <ConfirmButton count={picked.length} onClick={() => advance(picked.join(" و "))} />}
        {stepIndex > 0 && (
          <button
            onClick={() => {
              setPicked([]);
              setStepIndex(stepIndex - 1);
            }}
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
      eyebrow={clarification.progress || "برای دقیق‌تر شدن پیشنهادها"}
      title={clarification.question || "کدوم گزینه برات مناسب‌تره؟"}
      helper={clarification.multi ? "می‌تونی چند گزینه انتخاب کنی" : clarification.helper}
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
            multi={clarification.multi}
            selected={clarification.multi ? picked.includes(o.label) : undefined}
            onClick={() => {
              if (clarification.multi) {
                setPicked((prev) =>
                  prev.includes(o.label) ? prev.filter((p) => p !== o.label) : [...prev, o.label]
                );
              } else {
                setDone(true);
                onAnswer(o.label);
              }
            }}
          />
        ))}
      </div>
      {clarification.multi && (
        <ConfirmButton
          count={picked.length}
          onClick={() => {
            setDone(true);
            onAnswer(picked.join(" و "));
          }}
        />
      )}
    </Shell>
  );
};
