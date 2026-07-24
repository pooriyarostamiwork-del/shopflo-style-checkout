import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fa } from "../data/mockDashboard";

export const DeltaChip = ({ value, invert }: { value: number; invert?: boolean }) => {
  const up = value >= 0;
  return (
    <span className={`sd-chip ${up ? "sd-chip-up" : "sd-chip-down"}`}
      style={invert ? { background: "rgba(255,255,255,.14)", color: "white", borderColor: "rgba(255,255,255,.22)" } : undefined}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      <span className="sd-num">{fa(Math.abs(value).toFixed(1))}٪</span>
    </span>
  );
};
