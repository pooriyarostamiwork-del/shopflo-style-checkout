import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fa } from "../data/mockDashboard";

export const DeltaChip = ({ value }: { value: number }) => {
  const up = value >= 0;
  return (
    <span className={`sd-chip ${up ? "sd-chip-up" : "sd-chip-down"}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      <span className="sd-num">{fa(Math.abs(value).toFixed(1))}٪</span>
    </span>
  );
};
