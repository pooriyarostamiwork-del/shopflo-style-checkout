import { Check } from "lucide-react";

const items = ["فروشگاه فعال", "تأیید احراز هویت", "حساب بانکی تأیید شده", "پرداخت‌ها فعال"];

export const AccountStatusCard = () => (
  <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-3xl overflow-hidden">
    <div className="px-4 pt-4 pb-2 text-sm font-semibold text-foreground">وضعیت حساب</div>
    <ul>
      {items.map((label, i) => (
        <li
          key={label}
          className={`flex items-center gap-2 text-sm text-foreground px-4 py-3 ${
            i < items.length - 1 ? "border-b border-[hsl(var(--vd-stroke))]" : ""
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--vd-positive-soft))] text-[hsl(var(--vd-positive))] flex items-center justify-center shrink-0">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  </div>
);
