import { IntelInsight } from "./types";

export const InsightBlock = ({ insight }: { insight: IntelInsight }) => (
  <div
    className="mt-3 sd-card overflow-hidden"
    style={{ background: "hsl(var(--sd-surface))" }}
  >
    <div
      className="px-4 py-3 border-b flex items-center gap-2"
      style={{ borderColor: "hsl(var(--sd-stroke))" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "hsl(var(--sd-primary))" }}
      />
      <span className="text-[12px] font-semibold text-[hsl(var(--sd-ink))]">
        {insight.title}
      </span>
    </div>

    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-px"
      style={{ background: "hsl(var(--sd-stroke))" }}
    >
      {insight.kpis.map((k, i) => (
        <div
          key={i}
          className="px-4 py-3"
          style={{ background: "hsl(var(--sd-surface))" }}
        >
          <div className="text-[10.5px] text-[hsl(var(--sd-muted))] tracking-wide">
            {k.label}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <div className="sd-num text-[17px] font-bold text-[hsl(var(--sd-ink))]">
              {k.value}
            </div>
            {k.delta && (
              <div className="sd-num text-[10.5px] text-[hsl(var(--sd-muted))]">
                {k.delta}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    {insight.bullets && insight.bullets.length > 0 && (
      <ul className="px-4 py-3 flex flex-col gap-2">
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
    )}
  </div>
);
