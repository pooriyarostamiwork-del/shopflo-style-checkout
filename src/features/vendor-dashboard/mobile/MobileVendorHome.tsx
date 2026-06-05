import { useState } from "react";
import { KpiCard } from "../shared/KpiCard";
import { HeroBalanceCard } from "../shared/HeroBalanceCard";
import { OnboardingChecklist } from "../shared/OnboardingChecklist";
import { AccountStatusCard } from "../shared/AccountStatusCard";
import { RevenueSparkChart } from "../shared/RevenueSparkChart";
import { SectionTitle } from "../shared/SectionTitle";
import { mockVendor, formatToman, toPersianDigits } from "../data/mockVendor";
import { useVendorDashboard } from "../context/VendorDashboardContext";
import { WithdrawSheet } from "./WithdrawSheet";
import { toast } from "sonner";

export const MobileVendorHome = () => {
  const { vendor, onboardingComplete, toggleOnboarding } = useVendorDashboard();
  const { home, todayLabel, storeName } = vendor;
  const onboarding = mockVendor.onboarding;
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <div className="text-xs text-muted-foreground" style={{ unicodeBidi: "isolate" }}>
          {todayLabel}
        </div>
        <div className="text-lg font-semibold text-foreground mt-0.5">سلام، {storeName} 👋</div>
      </div>

      <HeroBalanceCard
        balance={home.withdrawableBalance}
        pending={home.pendingSettlement}
        onWithdraw={() => setWithdrawOpen(true)}
      />


      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="درآمد ماه" value={formatToman(home.revenue)} delta={home.deltas.revenue} />
        <KpiCard label="سفارش‌ها" value={`${toPersianDigits(home.orders)} سفارش`} delta={home.deltas.orders} />
        <KpiCard label="محصولات فعال" value={`${toPersianDigits(home.activeProducts)} محصول`} delta={home.deltas.activeProducts} />
        <KpiCard label="میانگین سفارش" value={formatToman(home.aov)} delta={home.deltas.aov} />
      </div>

      <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-3xl p-4">
        <SectionTitle eyebrow="روند هفتگی">درآمد ۷ روز اخیر</SectionTitle>
        <RevenueSparkChart data={mockVendor.trendByRange.week} height={100} />
      </div>

      {onboardingComplete ? (
        <AccountStatusCard />
      ) : (
        <OnboardingChecklist
          percent={onboarding.percent}
          items={onboarding.items}
          onComplete={() => toast.message("به مرحله بعد بروید (نمایشی)")}
        />
      )}

      <button
        onClick={toggleOnboarding}
        className="w-full text-[11px] text-muted-foreground border border-dashed border-[hsl(var(--vd-stroke))] rounded-full py-2"
      >
        تغییر وضعیت نمایشی ثبت‌نام
      </button>

      <WithdrawSheet open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </div>
  );
};
