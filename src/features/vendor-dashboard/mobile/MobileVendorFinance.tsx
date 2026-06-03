import { useState } from "react";
import { toast } from "sonner";
import { KpiCard } from "../shared/KpiCard";
import { SectionTitle } from "../shared/SectionTitle";
import { TimeframeSelector, type Timeframe } from "../shared/TimeframeSelector";
import { WithdrawalHistoryList } from "../shared/WithdrawalHistoryList";
import { FormField } from "../shared/FormField";
import { MerchantTypeToggle, type MerchantType } from "../shared/MerchantTypeToggle";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { mockVendor, formatToman, toPersianDigits } from "../data/mockVendor";

export const MobileVendorFinance = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [merchantType, setMerchantType] = useState<MerchantType>("individual");
  const snap = mockVendor.revenueByRange[timeframe];
  const { payouts, withdrawals } = mockVendor;

  return (
    <div className="px-4 py-5 space-y-5">
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle className="!mt-0 !mb-0">مرور درآمد</SectionTitle>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="درآمد" value={formatToman(snap.revenue)} />
          <KpiCard label="سفارش‌ها" value={`${toPersianDigits(snap.orders)} سفارش`} />
          <KpiCard label="میانگین ارزش سفارش" value={formatToman(snap.aov)} />
          <KpiCard label="کمیسیون پرداختی" value={formatToman(snap.commission)} />
        </div>
      </section>

      <section>
        <SectionTitle>برداشت‌ها</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="موجودی قابل برداشت"
            value={formatToman(payouts.withdrawable)}
            ctaLabel="برداشت وجه"
            onCtaClick={() => toast.success("درخواست برداشت ثبت شد (نمایشی)")}
          />
          <KpiCard label="در انتظار تسویه" value={formatToman(payouts.pending)} />
          <KpiCard label="مجموع برداشت‌ها" value={formatToman(payouts.totalWithdrawn)} />
          <KpiCard label="تسویه بعدی" value={payouts.nextSettlement} />
        </div>
      </section>

      <section>
        <SectionTitle>تاریخچه برداشت</SectionTitle>
        <WithdrawalHistoryList rows={withdrawals} />
      </section>

      <section className="space-y-3">
        <SectionTitle>تنظیمات مالی</SectionTitle>

        <MerchantTypeToggle value={merchantType} onChange={setMerchantType} />

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">اطلاعات هویتی</div>
          {merchantType === "individual" ? (
            <>
              <FormField label="نام کامل" placeholder="نام و نام خانوادگی" />
              <FormField label="کد ملی" placeholder="۰۰۱۲۳۴۵۶۷۸" />
              <FormField label="شماره موبایل" type="tel" placeholder="۰۹۱۲۰۰۰۰۰۰۰" />
              <FormField label="تاریخ تولد" placeholder="۱۳۷۰/۰۱/۰۱" />
              <FormField label="آدرس" type="textarea" />
            </>
          ) : (
            <>
              <FormField label="نام شرکت" />
              <FormField label="شناسه ملی شرکت" />
              <FormField label="شماره ثبت شرکت" />
              <FormField label="نام نماینده مجاز" />
              <FormField label="کد ملی نماینده" />
              <div className="text-sm font-semibold text-foreground pt-2">اطلاعات تماس</div>
              <FormField label="شماره تلفن" type="tel" />
              <FormField label="ایمیل" type="email" />
              <FormField label="آدرس شرکت" type="textarea" />
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">اطلاعات بانکی</div>
          <FormField label="نام صاحب حساب" />
          <FormField label="نام بانک" />
          <FormField label="شماره حساب" />
          <FormField label="شماره شبا" placeholder="IR" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">اطلاعات مالیاتی</div>
          {merchantType === "individual" ? (
            <>
              <FormField label="کد مالیاتی (اختیاری)" />
              <FormField label="شماره پرونده مالیاتی (اختیاری)" />
            </>
          ) : (
            <>
              <FormField label="کد اقتصادی" />
              <FormField label="شناسه مالیاتی" />
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">قرارداد فروشنده</div>
            <div className="text-xs text-muted-foreground mt-1">مطالعه و امضای قرارداد همکاری</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.message("دانلود شد (نمایشی)")}>
            <Download className="w-3.5 h-3.5" />
            دانلود
          </Button>
        </div>

        <Button className="w-full" onClick={() => toast.success("ذخیره شد (نمایشی)")}>
          ذخیره تغییرات
        </Button>
      </section>
    </div>
  );
};
