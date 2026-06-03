import { useState } from "react";
import { toast } from "sonner";
import { KpiCard } from "../shared/KpiCard";
import { OnboardingChecklist } from "../shared/OnboardingChecklist";
import { AccountStatusCard } from "../shared/AccountStatusCard";
import { mockVendor, formatToman, toPersianDigits } from "../data/mockVendor";

export const MobileVendorHome = () => {
  const [onboardingComplete, setOnboardingComplete] = useState(mockVendor.onboarding.complete);
  const { home, onboarding, storeName } = mockVendor;

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">سلام،</div>
          <div className="text-base font-semibold text-foreground">{storeName}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-border flex items-center justify-center text-primary font-semibold">
          ن
        </div>
      </div>

      <div className="space-y-3">
        <KpiCard
          label="درآمد"
          value={formatToman(home.revenue)}
          sublabel="بازه: ۱ ماه"
        />
        <KpiCard
          label="سفارش‌های ایجاد شده"
          value={`${toPersianDigits(home.orders)} سفارش`}
        />
        <KpiCard
          label="محصولات فعال"
          value={`${toPersianDigits(home.activeProducts)} محصول`}
        />
        <KpiCard
          label="در انتظار تسویه"
          value={formatToman(home.pendingSettlement)}
          sublabel={`تسویه بعدی: ${home.nextSettlement}`}
        />
        <KpiCard
          label="موجودی قابل برداشت"
          value={formatToman(home.withdrawableBalance)}
          sublabel="قابل برداشت"
          ctaLabel="برداشت وجه"
          onCtaClick={() => toast.success("درخواست برداشت ثبت شد (نمایشی)")}
        />
      </div>

      {onboardingComplete ? (
        <AccountStatusCard />
      ) : (
        <OnboardingChecklist
          percent={onboarding.percent}
          items={onboarding.items}
          onComplete={() => toast.message("به صفحه تکمیل ثبت‌نام بروید (نمایشی)")}
        />
      )}

      <button
        onClick={() => setOnboardingComplete((v) => !v)}
        className="w-full text-[11px] text-muted-foreground border border-dashed border-border rounded-lg py-2"
      >
        تغییر وضعیت نمایشی ثبت‌نام
      </button>
    </div>
  );
};
