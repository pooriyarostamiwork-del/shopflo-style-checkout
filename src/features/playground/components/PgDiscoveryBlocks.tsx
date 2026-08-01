import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles, Wallet } from "lucide-react";
import { faPrice, toFa } from "../data/mockStore";
import {
  PG_BUDGET,
  PG_QUIZ,
  PG_WIZARD_STEPS,
  PgQuizOption,
} from "../data/mockDiscovery";

/* =========================================================
   Shared shell pieces
   ========================================================= */

const BlockShell = ({
  icon,
  eyebrow,
  title,
  helper,
  onSkip,
  skipLabel = "رد می‌کنم",
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  helper?: string;
  onSkip?: () => void;
  skipLabel?: string;
  children: React.ReactNode;
}) => (
  <div className="pg-card pg-anim-in overflow-hidden" dir="rtl">
    <div className="flex items-start gap-2.5 p-3.5 pb-3">
      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-wide text-primary">{eyebrow}</p>
        <p className="text-sm font-semibold leading-6 mt-0.5">{title}</p>
        {helper && (
          <p className="text-[11px] leading-5 text-muted-foreground mt-1">{helper}</p>
        )}
      </div>
      {onSkip && (
        <button
          onClick={onSkip}
          className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          {skipLabel}
        </button>
      )}
    </div>
    <div className="px-3.5 pb-3.5">{children}</div>
  </div>
);

const SkippedNote = ({ text }: { text: string }) => (
  <div className="pg-card pg-anim-in p-3 text-[11px] text-muted-foreground" dir="rtl">
    {text}
  </div>
);

/* =========================================================
   1) Quiz card — one question, tappable options
   ========================================================= */

export const PgQuizCard = ({
  onAnswer,
  onSkip,
}: {
  onAnswer: (text: string) => void;
  onSkip?: (text: string) => void;
}) => {
  const [picked, setPicked] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  if (skipped) return <SkippedNote text="این سؤال رد شد — بدون فیلتر ادامه می‌دم." />;

  const choose = (o: PgQuizOption) => {
    if (picked) return;
    setPicked(o.id);
    onAnswer(`${PG_QUIZ.question} ${o.label}`);
  };

  return (
    <BlockShell
      icon={<Sparkles className="w-3.5 h-3.5" />}
      eyebrow="یک سؤال کوتاه"
      title={PG_QUIZ.question}
      helper={PG_QUIZ.helper}
      onSkip={
        picked
          ? undefined
          : () => {
              setSkipped(true);
              onSkip?.("این سؤال رو رد کن");
            }
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {PG_QUIZ.options.map((o) => {
          const active = picked === o.id;
          return (
            <button
              key={o.id}
              onClick={() => choose(o)}
              disabled={!!picked && !active}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 disabled:opacity-40"
              }`}
            >
              {o.emoji ? (
                <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0">
                  {o.emoji}
                </span>
              ) : (
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    active ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  {active && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-5 truncate">{o.label}</span>
                {o.hint && (
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {o.hint}
                  </span>
                )}
              </span>
              {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </BlockShell>
  );
};

/* =========================================================
   2) Multi-step selector — progressive filtering
   ========================================================= */

export const PgMultiStepSelector = ({
  onComplete,
  onSkip,
}: {
  onComplete: (text: string) => void;
  onSkip?: (text: string) => void;
}) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PgQuizOption>>({});
  const [skipped, setSkipped] = useState(false);
  const done = index >= PG_WIZARD_STEPS.length;
  const step = PG_WIZARD_STEPS[Math.min(index, PG_WIZARD_STEPS.length - 1)];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / PG_WIZARD_STEPS.length) * 100);

  if (skipped)
    return <SkippedNote text="پرسش‌ها رد شد — پیشنهادهای عمومی رو نشون می‌دم." />;

  const finish = (next: Record<string, PgQuizOption>) => {
    setIndex(PG_WIZARD_STEPS.length);
    const picks = PG_WIZARD_STEPS.filter((s) => next[s.id]).map(
      (s) => `${s.title}: ${next[s.id].label}`,
    );
    onComplete(
      picks.length
        ? "این‌ها انتخاب‌های منه: " + picks.join("، ")
        : "بدون فیلتر خاص پیشنهاد بده",
    );
  };

  const pick = (o: PgQuizOption) => {
    const next = { ...answers, [step.id]: o };
    setAnswers(next);
    if (index + 1 >= PG_WIZARD_STEPS.length) finish(next);
    else setIndex(index + 1);
  };

  const skipStep = () => {
    if (index + 1 >= PG_WIZARD_STEPS.length) finish(answers);
    else setIndex(index + 1);
  };

  return (
    <BlockShell
      icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
      eyebrow={done ? "تمام شد" : `مرحله ${toFa(index + 1)} از ${toFa(PG_WIZARD_STEPS.length)}`}
      title={done ? "انتخاب‌هات ثبت شد" : step.question}
      onSkip={
        done
          ? undefined
          : () => {
              setSkipped(true);
              onSkip?.("پرسش‌ها رو رد کن");
            }
      }
      skipLabel="رد کردن همه"
    >
      {/* Progress rail */}
      <div className="mb-3">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-1 overflow-x-auto pg-scroll-hidden">
          {PG_WIZARD_STEPS.map((s, i) => {
            const filled = !!answers[s.id];
            const current = i === index && !done;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    current
                      ? "bg-primary/10 text-primary font-medium"
                      : filled
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
                {i < PG_WIZARD_STEPS.length - 1 && (
                  <ChevronLeft className="w-3 h-3 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {done ? (
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {PG_WIZARD_STEPS.map((s) => (
              <span
                key={s.id}
                className="text-[11px] px-2 py-1 rounded-lg bg-muted text-muted-foreground"
              >
                {s.title}:{" "}
                <span className="text-foreground">{answers[s.id]?.label ?? "—"}</span>
              </span>
            ))}
          </div>
          <button
            onClick={() => {
              setAnswers({});
              setIndex(0);
            }}
            className="text-[11px] text-primary"
          >
            از اول انتخاب می‌کنم
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {step.options.map((o) => (
              <button
                key={o.id}
                onClick={() => pick(o)}
                className="px-3 py-2 rounded-xl border border-border text-right hover:border-primary/40 hover:bg-primary/[0.03] transition-colors"
              >
                <span className="text-xs flex items-center gap-1.5">
                  {o.emoji && <span>{o.emoji}</span>}
                  {o.label}
                </span>
                {o.hint && (
                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                    {o.hint}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            {index > 0 ? (
              <button
                onClick={() => setIndex(index - 1)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
                مرحله قبل
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={skipStep}
              className="inline-flex items-center gap-1 text-[11px] text-primary"
            >
              این مرحله مهم نیست
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </BlockShell>
  );
};

/* =========================================================
   3) Budget slider
   ========================================================= */

export const PgBudgetSlider = ({
  onConfirm,
  onSkip,
}: {
  onConfirm: (text: string) => void;
  onSkip?: (text: string) => void;
}) => {
  const [value, setValue] = useState(PG_BUDGET.initial);
  const [sent, setSent] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const pct = useMemo(
    () => ((value - PG_BUDGET.min) / (PG_BUDGET.max - PG_BUDGET.min)) * 100,
    [value],
  );

  if (skipped) return <SkippedNote text="بودجه رد شد — همه‌ی بازه‌های قیمتی رو می‌بینی." />;

  return (
    <BlockShell
      icon={<Wallet className="w-3.5 h-3.5" />}
      eyebrow="بودجه"
      title="سقف بودجه‌ت رو مشخص کن"
      helper="فقط گزینه‌های زیر این سقف رو پیشنهاد می‌دم"
      onSkip={
        sent
          ? undefined
          : () => {
              setSkipped(true);
              onSkip?.("بودجه مهم نیست، همه رو نشون بده");
            }
      }
      skipLabel="مهم نیست"
    >
      <div className="rounded-xl bg-muted/40 p-3">
        <p className="text-[10px] text-muted-foreground">تا سقف</p>
        <p className="text-lg font-semibold tabular-nums mt-0.5">{faPrice(value)}</p>

        <input
          type="range"
          min={PG_BUDGET.min}
          max={PG_BUDGET.max}
          step={PG_BUDGET.step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label="بودجه"
          className="pg-range w-full mt-3"
          style={{ ["--pg-range-fill" as string]: `${pct}%` }}
        />

        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 tabular-nums">
          <span>{faPrice(PG_BUDGET.min)}</span>
          <span>{faPrice(PG_BUDGET.max)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {PG_BUDGET.presets.map((p) => (
          <button
            key={p}
            onClick={() => setValue(p)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors ${
              value === p
                ? "border-primary text-primary bg-primary/5"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            تا {faPrice(p)}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          setSent(true);
          onConfirm(`بودجه من تا ${faPrice(value)} است`);
        }}
        disabled={sent}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs mt-3 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {sent ? <Check className="w-3.5 h-3.5" /> : null}
        {sent ? "ثبت شد" : "همین بودجه"}
      </button>
    </BlockShell>
  );
};
