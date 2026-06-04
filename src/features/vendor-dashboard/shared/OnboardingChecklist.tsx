import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDigits, type OnboardingItem } from "../data/mockVendor";

interface Props {
  percent: number;
  items: OnboardingItem[];
  onComplete?: () => void;
}

const Ring = ({ percent }: { percent: number }) => {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--vd-stroke))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--vd-accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-foreground"
        style={{ unicodeBidi: "isolate" }}
      >
        {toPersianDigits(percent)}٪
      </div>
    </div>
  );
};

export const OnboardingChecklist = ({ percent, items, onComplete }: Props) => {
  const remaining = items.filter((i) => !i.done).length;
  return (
    <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-3xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <Ring percent={percent} />
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">شروع کار</div>
          <div className="text-[11px] text-muted-foreground" style={{ unicodeBidi: "isolate" }}>
            {toPersianDigits(remaining)} مرحله باقی‌مانده
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                item.done
                  ? "bg-[hsl(var(--vd-positive-soft))] text-[hsl(var(--vd-positive))]"
                  : "border border-[hsl(var(--vd-stroke))] bg-[hsl(var(--vd-surface-2))]"
              }`}
            >
              {item.done && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span className={item.done ? "text-muted-foreground" : "text-foreground"}>{item.label}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full mt-4 rounded-full" onClick={onComplete}>
        تکمیل ثبت‌نام
      </Button>
    </div>
  );
};
