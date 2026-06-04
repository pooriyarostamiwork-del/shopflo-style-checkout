import { toPersianDigits } from "../data/mockVendor";
import { ArrowUp, ArrowDown } from "lucide-react";

export const DeltaChip = ({ value }: { value: number }) => {
  if (value === 0) return null;
  const up = value > 0;
  const cls = up
    ? "bg-[hsl(var(--vd-positive-soft))] text-[hsl(var(--vd-positive))]"
    : "bg-[hsl(var(--vd-danger-soft))] text-[hsl(var(--vd-danger))]";
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cls}`}
      style={{ unicodeBidi: "isolate" }}
    >
      <Icon className="w-2.5 h-2.5" strokeWidth={3} />
      {toPersianDigits(Math.abs(value))}٪
    </span>
  );
};
