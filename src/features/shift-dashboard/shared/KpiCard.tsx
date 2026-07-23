import { ReactNode } from "react";
import { DeltaChip } from "./DeltaChip";

interface Props {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  live?: boolean;
  icon?: ReactNode;
}

export const KpiCard = ({ label, value, sub, delta, live, icon }: Props) => (
  <div className={`sd-card sd-card-hover sd-anim-in p-4 ${live ? "sd-breathe" : ""}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--sd-primary-soft))", color: "hsl(var(--sd-primary))" }}>
            {icon}
          </div>
        )}
        <div className="text-[11px] text-[hsl(var(--sd-muted))]">{label}</div>
      </div>
      {typeof delta === "number" && <DeltaChip value={delta} />}
    </div>
    <div className="mt-3 text-2xl font-bold tracking-tight sd-num">{value}</div>
    {sub && <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1 sd-num">{sub}</div>}
  </div>
);
