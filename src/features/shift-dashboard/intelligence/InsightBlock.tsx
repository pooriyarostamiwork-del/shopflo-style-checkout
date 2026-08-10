import { IntelInsight } from "./types";
import { BarChart3 } from "lucide-react";

const deltaTone = (delta?: string) => {
  if (!delta) return null;
  const isDown = delta.includes("-") || delta.includes("−") || delta.includes("↓");
  return isDown
    ? { color: "hsl(var(--sd-primary-ink))", bg: "hsl(var(--sd-primary-soft))" }
    : { color: "hsl(var(--sd-ok, 152 45% 32%))", bg: "hsl(var(--sd-surface-2))" };
};

export const InsightBlock = ({ insight }: { insight: IntelInsight }) => (
  <div
    className="mt-3 rounded-2xl border overflow-hidden"
    style={{
      background: "hsl(var(--sd-surface))",
      borderColor: "hsl(var(--sd-stroke))",
    }}
  >
    {/* Header */}
    <div className="px-4 pt-3.5 pb-3 flex items-center gap-2.5">
      <span
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "hsl(var(--sd-primary-soft))",
          color: "hsl(var(--sd-primary-ink))",
        }}
      >
        <BarChart3 className="w-3.5 h-3.5" strokeWidth={2} />
      </span>
      <span className="text-[12.5px] font-semibold text-[hsl(var(--sd-ink))] leading-5">
        {insight.title}
      </span>
    </div>

    {/* Metric rows — readable list instead of a cramped table */}
    <div className="px-2 pb-1">
      {insight.kpis.map((k, i) => {
        const tone = deltaTone(k.delta);
        return (
          <div
            key={i}
            className="flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-xl"
            style={{
              background: i % 2 === 0 ? "hsl(var(--sd-surface-2) / .5)" : "transparent",
            }}
          >
            <span className="text-[11.5px] text-[hsl(var(--sd-muted))] min-w-0 truncate">
              {k.label}
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="sd-num text-[14.5px] font-bold text-[hsl(var(--sd-ink))]">
                {k.value}
              </span>
              {tone && (
                <span
                  className="sd-num text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ color: tone.color, background: tone.bg }}
                >
                  {k.delta}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>

    {insight.bullets && insight.bullets.length > 0 && (
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "hsl(var(--sd-stroke))" }}
      >
        <ul className="flex flex-col gap-2">
          {insight.bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12.5px] text-[hsl(var(--sd-ink-2))] leading-6"
            >
              <span
                className="mt-2 w-1 h-1 rounded-full shrink-0"
                style={{ background: "hsl(var(--sd-primary))" }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);
