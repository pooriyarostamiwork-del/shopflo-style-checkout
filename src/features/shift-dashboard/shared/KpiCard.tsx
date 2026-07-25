import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fa } from "../data/mockDashboard";

interface Props {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  live?: boolean;
  icon?: ReactNode;
  hero?: boolean;
  /** Period label shown next to delta, e.g. "۷ روز اخیر" */
  period?: string;
}

export const KpiCard = ({ label, value, sub, delta, live, icon, hero, period = "۷ روز اخیر" }: Props) => {
  const up = typeof delta === "number" ? delta >= 0 : true;
  const deltaColor = up ? "hsl(var(--sd-success))" : "hsl(var(--sd-danger))";
  const iconTint = up ? "hsl(var(--sd-success) / .10)" : "hsl(var(--sd-danger) / .10)";
  const iconInk = up ? "hsl(var(--sd-success))" : "hsl(var(--sd-danger))";

  return (
    <div className="sd-card sd-card-raise sd-anim-in p-5 min-h-[130px] flex items-start justify-between gap-4">
      {/* Right side (RTL start): text block */}
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11.5px]"
            style={{ color: "hsl(var(--sd-muted))", letterSpacing: ".01em" }}
          >
            {label}
          </span>
          {live && <span className="sd-live-dot" />}
        </div>

        <div className="text-[26px] font-bold tracking-tight sd-num leading-none mt-3">
          {value}
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px]" style={{ color: "hsl(var(--sd-muted))" }}>
            {period}
          </span>
          {typeof delta === "number" && (
            <span
              className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold sd-num"
              style={{ color: deltaColor, unicodeBidi: "isolate" }}
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
            style={{ color: "hsl(var(--sd-muted))" }}
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
          style={{ background: hero ? "hsl(var(--sd-primary) / .12)" : iconTint, color: hero ? "hsl(var(--sd-primary-ink))" : iconInk }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};
