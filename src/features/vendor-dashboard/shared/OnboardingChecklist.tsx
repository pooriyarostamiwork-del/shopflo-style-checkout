import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toPersianDigits, type OnboardingItem } from "../data/mockVendor";

interface OnboardingChecklistProps {
  percent: number;
  items: OnboardingItem[];
  onComplete?: () => void;
}

export const OnboardingChecklist = ({ percent, items, onComplete }: OnboardingChecklistProps) => {
  const remaining = items.filter((i) => !i.done).length;
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-foreground">شروع کار</div>
        <div className="text-xs text-muted-foreground" style={{ unicodeBidi: "isolate" }}>
          {toPersianDigits(percent)}% تکمیل شده
        </div>
      </div>
      <Progress value={percent} className="h-1.5 mb-4" />
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            <span
              className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                item.done ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
              }`}
            >
              {item.done && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted-foreground mt-3" style={{ unicodeBidi: "isolate" }}>
        {toPersianDigits(remaining)} مرحله باقی‌مانده
      </div>
      <Button className="w-full mt-3" onClick={onComplete}>
        تکمیل ثبت‌نام
      </Button>
    </div>
  );
};
