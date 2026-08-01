import { useMemo, useState } from "react";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { faPrice, toFa } from "../data/mockStore";
import {
  PG_BUDGET,
  PG_QUIZ,
  PG_WIZARD_STEPS,
  PgQuizOption,
} from "../data/mockDiscovery";

/* =========================================================
   1) Quiz card — one question, tappable options
   ========================================================= */

export const PgQuizCard = ({ onAnswer }: { onAnswer: (text: string) => void }) => {
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (o: PgQuizOption) => {
    if (picked) return;
    setPicked(o.id);
    onAnswer(`${PG_QUIZ.question} ${o.label}`);
  };

  return (
    <div className="pg-card p-4 pg-anim-in" dir="rtl">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium leading-relaxed">{PG_QUIZ.question}</p>
          {PG_QUIZ.helper && (
            <p className="text-[11px] text-muted-foreground mt-1">{PG_QUIZ.helper}</p>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {PG_QUIZ.options.map((o) => {
          const active = picked === o.id;
          return (
            <button
              key={o.id}
              onClick={() => choose(o)}
              disabled={!!picked && !active}
              className={`w-full text-right flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 disabled:opacity-40"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  active ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {active && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </span>
              {o.emoji && <span className="text-base leading-none">{o.emoji}</span>}
              <span className="min-w-0">
                <span className="block text-sm">{o.label}</span>
                {o.hint && (
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {o.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================
   2) Multi-step selector — progressive filtering
   ========================================================= */

export const PgMultiStepSelector = ({
  onComplete,
}: {
  onComplete: (text: string) => void;
}) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PgQuizOption>>({});
  const done = index >= PG_WIZARD_STEPS.length;
  const step = PG_WIZARD_STEPS[Math.min(index, PG_WIZARD_STEPS.length - 1)];
  const progress = Math.round((Object.keys(answers).length / PG_WIZARD_STEPS.length) * 100);

  const pick = (o: PgQuizOption) => {
    const next = { ...answers, [step.id]: o };
    setAnswers(next);
    if (index + 1 >= PG_WIZARD_STEPS.length) {
      setIndex(PG_WIZARD_STEPS.length);
      onComplete(
        "این‌ها انتخاب‌های منه: " +
          PG_WIZARD_STEPS.map((s) => `${s.title}: ${next[s.id]?.label ?? "-"}`).join("، "),
      );
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <div className="pg-card p-4 pg-anim-in" dir="rtl">
      {/* Rail */}
      <div className="flex items-center gap-1.5 mb-3">
        {PG_WIZARD_STEPS.map((s, i) => {
          const filled = !!answers[s.id];
          const current = i === index && !done;
          return (
            <div key={s.id} className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[11px] px-2 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                  current
                    ? "border-primary text-primary bg-primary/5"
                    : filled
                      ? "border-border text-foreground"
                      : "border-border text-muted-foreground"
                }`}
              >
                {s.title}
              </span>
              {i < PG_WIZARD_STEPS.length - 1 && (
                <ChevronLeft className="w-3 h-3 text-muted-foreground/60 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="h-1 rounded-full bg-muted overflow-hidden mb-3">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {done ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">انتخاب‌هات ثبت شد ✅</p>
          <div className="flex flex-wrap gap-1.5">
            {PG_WIZARD_STEPS.map((s) => (
              <span
                key={s.id}
                className="text-[11px] px-2 py-1 rounded-lg border border-border text-muted-foreground"
              >
                {s.title}: <span className="text-foreground">{answers[s.id]?.label}</span>
              </span>
            ))}
          </div>
          <button
            onClick={() => {
              setAnswers({});
              setIndex(0);
            }}
            className="text-[11px] text-primary mt-1"
          >
            از اول انتخاب می‌کنم
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium leading-relaxed">{step.question}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            مرحله {toFa(index + 1)} از {toFa(PG_WIZARD_STEPS.length)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {step.options.map((o) => (
              <button
                key={o.id}
                onClick={() => pick(o)}
                className="px-3 py-2 rounded-xl border border-border text-right hover:border-primary/40 transition-colors"
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
          {index > 0 && (
            <button
              onClick={() => setIndex(index - 1)}
              className="text-[11px] text-muted-foreground mt-3"
            >
              مرحله قبل
            </button>
          )}
        </>
      )}
    </div>
  );
};

/* =========================================================
   3) Budget slider
   ========================================================= */

export const PgBudgetSlider = ({ onConfirm }: { onConfirm: (text: string) => void }) => {
  const [value, setValue] = useState(PG_BUDGET.initial);
  const [sent, setSent] = useState(false);

  const pct = useMemo(
    () => ((value - PG_BUDGET.min) / (PG_BUDGET.max - PG_BUDGET.min)) * 100,
    [value],
  );

  return (
    <div className="pg-card p-4 pg-anim-in" dir="rtl">
      <p className="text-sm font-medium">بودجه‌ت رو مشخص کن</p>
      <p className="text-[11px] text-muted-foreground mt-1">
        فقط گزینه‌های زیر این سقف رو پیشنهاد می‌دم
      </p>

      <p className="text-lg font-semibold mt-3 tabular-nums">{faPrice(value)}</p>

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

      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{faPrice(PG_BUDGET.max)}</span>
        <span>{faPrice(PG_BUDGET.min)}</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {PG_BUDGET.presets.map((p) => (
          <button
            key={p}
            onClick={() => setValue(p)}
            className={`px-3 py-1.5 rounded-lg text-[11px] border transition-colors ${
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
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs mt-4 disabled:opacity-50"
      >
        {sent ? "ثبت شد" : "همین بودجه"}
      </button>
    </div>
  );
};
