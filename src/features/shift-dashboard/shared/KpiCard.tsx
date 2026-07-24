import { ReactNode } from "react";
import { DeltaChip } from "./DeltaChip";

interface Props {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  live?: boolean;
  icon?: ReactNode;
  hero?: boolean;
}

export const KpiCard = ({ label, value, sub, delta, live, icon, hero }: Props) => {
  const base = hero ? "sd-card-hero" : "sd-card sd-card-raise";
  const labelColor = hero ? "rgba(255,255,255,.75)" : "hsl(var(--sd-muted))";
  const subColor = hero ? "rgba(255,255,255,.7)" : "hsl(var(--sd-muted))";
  return (
    <div className={`${base} sd-anim-in p-5 flex flex-col justify-between min-h-[130px]`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span style={{ color: hero ? "rgba(255,255,255,.85)" : "hsl(var(--sd-ink-2))" }}>
              {icon}
            </span>
          )}
          <div className="text-[11.5px]" style={{ color: labelColor, letterSpacing: ".01em" }}>{label}</div>
          {live && <span className="sd-live-dot" style={hero ? { background: "white" } : undefined} />}
        </div>
        {typeof delta === "number" && <DeltaChip value={delta} invert={hero} />}
      </div>
      <div className="mt-4">
        <div className="text-[28px] font-bold tracking-tight sd-num leading-none">{value}</div>
        {sub && <div className="text-[11.5px] mt-2 sd-num" style={{ color: subColor }}>{sub}</div>}
      </div>
    </div>
  );
};
