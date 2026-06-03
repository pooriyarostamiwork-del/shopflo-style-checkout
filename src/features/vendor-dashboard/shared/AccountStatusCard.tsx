import { Check } from "lucide-react";

const items = [
  "فروشگاه فعال",
  "تأیید احراز هویت",
  "حساب بانکی تأیید شده",
  "پرداخت‌ها فعال",
];

export const AccountStatusCard = () => (
  <div className="bg-card border border-border rounded-2xl p-4">
    <div className="text-sm font-semibold text-foreground mb-3">وضعیت حساب</div>
    <ul className="space-y-2.5">
      {items.map((label) => (
        <li key={label} className="flex items-center gap-2 text-sm text-foreground">
          <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-primary" strokeWidth={3} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  </div>
);
