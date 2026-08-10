import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fa } from "../data/mockDashboard";

interface Props {
  label: string;
  value: string;
  /** Optional trailing unit shown smaller/lighter on the same line, e.g. "تومان" */
  unit?: string;
  sub?: string;
  delta?: number;
  live?: boolean;
  icon?: ReactNode;
  /** Highlighted hero variant — differentiated background (used for primary revenue KPI) */
  hero?: boolean;
  /** Period label shown next to delta, e.g. "۷ روز اخیر" */
  period?: string;
}

export const KpiCard = ({ label, value, unit, sub, delta, live, icon, hero, period = "۷ روز اخیر" }: Props) => {
  const up = typeof delta === "number" ? delta >= 0 : true;
  const deltaColor = up ? "hsl(var(--sd-success))" : "hsl(var(--sd-danger))";
  const deltaBg = up ? "hsl(var(--sd-success) / .09)" : "hsl(var(--sd-danger) / .09)";
  const iconTint = "hsl(var(--sd-surface-2))";
  const iconInk = "hsl(var(--sd-ink-2))";


  // Hero variant colors
  const heroBg = "hsl(var(--sd-ink))";
  const heroInk = "hsl(0 0% 100%)";
  const heroMuted = "hsl(0 0% 100% / .62)";
  const heroBorder = "hsl(var(--sd-ink))";
  const heroAccent = "hsl(var(--sd-primary))";

  return (
    <div
      className="sd-card sd-card-raise sd-anim-in p-5 min-h-[130px] flex items-start justify-between gap-4"
      style={hero ? { background: heroBg, borderColor: heroBorder, color: heroInk } : undefined}
    >
      {/* Right side (RTL start): text block */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Modern label: accent bar + uppercase-like small caps eyebrow */}
        <div className="flex items-center gap-2">
          <span
            className="w-1 h-3.5 rounded-full shrink-0"
            style={{ background: hero ? heroAccent : "hsl(var(--sd-primary))" }}
          />
          <span
            className="text-[11px] font-medium truncate"
            style={{
              color: hero ? heroMuted : "hsl(var(--sd-muted))",
              letterSpacing: ".01em",
            }}
          >
            {label}
          </span>
          {live && <span className="sd-live-dot" />}
        </div>

        <div
          className="text-[26px] font-bold tracking-tight sd-num leading-none mt-3 flex items-baseline gap-1.5 flex-nowrap"
          style={hero ? { color: heroInk } : undefined}
        >
          <span className="truncate">{value}</span>
          {unit && (
            <span
              className="text-[13px] font-medium shrink-0"
              style={{ color: hero ? heroMuted : "hsl(var(--sd-muted))" }}
            >
              {unit}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px]"
            style={{ color: hero ? heroMuted : "hsl(var(--sd-muted))" }}
          >
            {period}
          </span>
          {typeof delta === "number" && (
            <span
              className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold sd-num"
              style={{ color: hero ? (up ? "hsl(152 70% 72%)" : "hsl(0 90% 78%)") : deltaColor, unicodeBidi: "isolate" }}
            >
              {up ? (
                <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="w-3 h-3" strokeWidth={2.5} />
              )}
              {up ? "+" : "−"}{fa(Math.abs(delta).toFixed(1))}٪
            </span>
          )}
        </div>

        {sub && (
          <div
            className="text-[11px] mt-2 sd-num truncate"
            style={{ color: hero ? heroMuted : "hsl(var(--sd-muted))" }}
            title={sub}
          >
            {sub}
          </div>
        )}
      </div>

      {/* Left side (RTL end): tinted icon block */}
      {icon && (
        <div
          className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
          style={
            hero
              ? { background: "hsl(0 0% 100% / .12)", color: heroInk }
              : { background: iconTint, color: iconInk }
          }
        >
          {icon}
        </div>
      )}
    </div>
  );
};
