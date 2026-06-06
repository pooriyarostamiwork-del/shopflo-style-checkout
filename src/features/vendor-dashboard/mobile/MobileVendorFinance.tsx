import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KpiCard } from "../shared/KpiCard";
import { SectionTitle } from "../shared/SectionTitle";
import { TimeframeSelector, type Timeframe } from "../shared/TimeframeSelector";
import { RevenueSparkChart } from "../shared/RevenueSparkChart";
import { WithdrawalHistoryList } from "../shared/WithdrawalHistoryList";
import { FormField } from "../shared/FormField";
import { MerchantTypeToggle, type MerchantType } from "../shared/MerchantTypeToggle";
import { HeroBalanceCard } from "../shared/HeroBalanceCard";
import { StickySaveBar } from "../shared/StickySaveBar";
import { PendingApprovalPill } from "../shared/PendingApprovalPill";
import { mockVendor, formatToman, toPersianDigits, IRANIAN_BANKS } from "../data/mockVendor";
import {
  individualIdentitySchema,
  companyIdentitySchema,
  bankingSchema,
} from "../data/schemas";
import { useVendorDashboard } from "../context/VendorDashboardContext";
import { WithdrawSheet } from "./WithdrawSheet";

const isTimeframe = (v: string | null): v is Timeframe => v === "day" || v === "week" || v === "month";

type SubTab = "performance" | "payouts" | "settings";
const isSub = (v: string | null): v is SubTab => v === "performance" || v === "payouts" || v === "settings";

const taxIndividualSchema = z.object({
  taxCode: z.string().optional(),
  taxFile: z.string().optional(),
});
const taxCompanySchema = z.object({
  economicCode: z.string().min(6, "الزامی"),
  taxId: z.string().min(6, "الزامی"),
});

export const MobileVendorFinance = () => {
  const [params, setParams] = useSearchParams();
  const subParam = params.get("sub");
  const [sub, setSub] = useState<SubTab>(isSub(subParam) ? subParam : "performance");

  const tfParam = params.get("range");
  const [timeframe, setTimeframe] = useState<Timeframe>(isTimeframe(tfParam) ? tfParam : "month");
  const [merchantType, setMerchantType] = useState<MerchantType>("individual");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { vendor, enqueueChange, getPendingForSection, cancelPending } = useVendorDashboard();

  useEffect(() => {
    if (isSub(subParam) && subParam !== sub) setSub(subParam);
    if (isTimeframe(tfParam) && tfParam !== timeframe) setTimeframe(tfParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subParam, tfParam]);

  const handleSub = (v: string) => {
    setSub(v as SubTab);
    const next = new URLSearchParams(params);
    next.set("sub", v);
    setParams(next, { replace: true });
  };

  const handleTimeframe = (v: Timeframe) => {
    setTimeframe(v);
    const next = new URLSearchParams(params);
    next.set("range", v);
    setParams(next, { replace: true });
  };

  const snap = mockVendor.revenueByRange[timeframe];
  const trend = mockVendor.trendByRange[timeframe];
  const { payouts } = vendor;
  const withdrawals = useVendorDashboard().withdrawals;

  const identitySchema = merchantType === "individual" ? individualIdentitySchema : companyIdentitySchema;
  const idForm = useForm<any>({ resolver: zodResolver(identitySchema as any), mode: "onBlur" });
  const bankForm = useForm<any>({ resolver: zodResolver(bankingSchema), mode: "onBlur" });
  const taxForm = useForm<any>({
    resolver: zodResolver((merchantType === "individual" ? taxIndividualSchema : taxCompanySchema) as any),
    mode: "onBlur",
  });

  const dirty = idForm.formState.isDirty || bankForm.formState.isDirty || taxForm.formState.isDirty;
  const bankPending = getPendingForSection("banking");

  const saveAll = async () => {
    let ok = true;
    if (idForm.formState.isDirty) ok = (await idForm.trigger()) && ok;
    if (bankForm.formState.isDirty) ok = (await bankForm.trigger()) && ok;
    if (taxForm.formState.isDirty) ok = (await taxForm.trigger()) && ok;
    if (!ok) {
      toast.error("لطفاً خطاهای فرم را برطرف کنید");
      return;
    }
    if (idForm.formState.isDirty) enqueueChange("identity", idForm.getValues());
    if (bankForm.formState.isDirty) enqueueChange("banking", bankForm.getValues());
    if (taxForm.formState.isDirty) enqueueChange("tax", taxForm.getValues());
    idForm.reset(idForm.getValues());
    bankForm.reset(bankForm.getValues());
    taxForm.reset(taxForm.getValues());
    toast.success("درخواست تغییر برای بررسی ادمین ارسال شد");
  };

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="pb-1">
        <div className="text-[11px] text-muted-foreground">داشبورد فروشنده</div>
        <div className="text-base font-semibold text-foreground mt-0.5">مالی</div>
      </div>

      <Tabs value={sub} onValueChange={handleSub} className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-full p-1 h-auto">
          <TabsTrigger value="settings" className="rounded-full text-xs data-[state=active]:bg-[hsl(var(--vd-accent))] data-[state=active]:text-white">تنظیمات</TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-full text-xs data-[state=active]:bg-[hsl(var(--vd-accent))] data-[state=active]:text-white">تسویه</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-full text-xs data-[state=active]:bg-[hsl(var(--vd-accent))] data-[state=active]:text-white">عملکرد</TabsTrigger>
        </TabsList>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="mt-4 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <SectionTitle className="mb-0" eyebrow="عملکرد">مرور درآمد</SectionTitle>
            <TimeframeSelector value={timeframe} onChange={handleTimeframe} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard animateKey={timeframe} label="درآمد" value={formatToman(snap.revenue)} delta={snap.deltaPct} />
            <KpiCard animateKey={timeframe} label="سفارش‌ها" value={`${toPersianDigits(snap.orders)} سفارش`} />
            <KpiCard animateKey={timeframe} label="میانگین ارزش سفارش" value={formatToman(snap.aov)} />
            <KpiCard animateKey={timeframe} label="کمیسیون پرداختی" value={formatToman(snap.commission)} />
          </div>
          <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-3xl p-4">
            <div className="text-[11px] text-muted-foreground mb-2">روند درآمد</div>
            <RevenueSparkChart data={trend} labels={mockVendor.trendLabelsByRange[timeframe]} height={160} />
          </div>
        </TabsContent>

        {/* PAYOUTS */}
        <TabsContent value="payouts" className="mt-4 space-y-4">
          <HeroBalanceCard
            balance={payouts.withdrawable}
            pending={payouts.pending}
            onWithdraw={() => setWithdrawOpen(true)}
          />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="در انتظار" value={formatToman(payouts.pending)} />
            <KpiCard label="مجموع برداشت" value={formatToman(payouts.totalWithdrawn)} />
          </div>
          <div>
            <SectionTitle eyebrow="تاریخچه">برداشت‌های اخیر</SectionTitle>
            <WithdrawalHistoryList rows={withdrawals} />
          </div>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <SectionTitle eyebrow="تنظیمات">اطلاعات مالی</SectionTitle>
          <MerchantTypeToggle value={merchantType} onChange={setMerchantType} />

          <Accordion type="multiple" defaultValue={["identity"]} className="space-y-2">
            <AccordionItem
              value="identity"
              className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl px-4"
            >
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline text-right">اطلاعات هویتی</AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {merchantType === "individual" ? (
                  <>
                    <FormField label="نام کامل" registerProps={idForm.register("fullName")} error={idForm.formState.errors.fullName?.message as string} />
                    <FormField label="کد ملی" placeholder="۰۰۱۲۳۴۵۶۷۸" registerProps={idForm.register("nationalCode")} error={idForm.formState.errors.nationalCode?.message as string} />
                    <FormField label="شماره موبایل" type="tel" placeholder="۰۹۱۲۰۰۰۰۰۰۰" registerProps={idForm.register("mobile")} error={idForm.formState.errors.mobile?.message as string} />
                    <FormField label="تاریخ تولد" placeholder="۱۳۷۰/۰۱/۰۱" registerProps={idForm.register("birthDate")} error={idForm.formState.errors.birthDate?.message as string} />
                    <FormField label="آدرس" type="textarea" registerProps={idForm.register("address")} error={idForm.formState.errors.address?.message as string} />
                  </>
                ) : (
                  <>
                    <FormField label="نام شرکت" registerProps={idForm.register("companyName")} error={idForm.formState.errors.companyName?.message as string} />
                    <FormField label="شناسه ملی شرکت" registerProps={idForm.register("companyNationalId")} error={idForm.formState.errors.companyNationalId?.message as string} />
                    <FormField label="شماره ثبت" registerProps={idForm.register("registrationNumber")} error={idForm.formState.errors.registrationNumber?.message as string} />
                    <FormField label="نام نماینده مجاز" registerProps={idForm.register("repName")} error={idForm.formState.errors.repName?.message as string} />
                    <FormField label="کد ملی نماینده" registerProps={idForm.register("repNationalCode")} error={idForm.formState.errors.repNationalCode?.message as string} />
                    <FormField label="تلفن شرکت" type="tel" registerProps={idForm.register("phone")} error={idForm.formState.errors.phone?.message as string} />
                    <FormField label="ایمیل" type="email" registerProps={idForm.register("email")} error={idForm.formState.errors.email?.message as string} />
                    <FormField label="آدرس شرکت" type="textarea" registerProps={idForm.register("address")} error={idForm.formState.errors.address?.message as string} />
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="banking"
              className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl px-4"
            >
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline text-right">
                <span className="flex items-center gap-2">
                  اطلاعات بانکی
                  {bankPending && <PendingApprovalPill onCancel={() => cancelPending(bankPending.id)} />}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <FormField label="نام صاحب حساب" registerProps={bankForm.register("holder")} error={bankForm.formState.errors.holder?.message as string} />
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">نام بانک</label>
                  <Select onValueChange={(v) => bankForm.setValue("bank", v, { shouldDirty: true, shouldValidate: true })}>
                    <SelectTrigger className="rounded-2xl border-[hsl(var(--vd-stroke))]">
                      <SelectValue placeholder="انتخاب بانک" />
                    </SelectTrigger>
                    <SelectContent>
                      {IRANIAN_BANKS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bankForm.formState.errors.bank && (
                    <p className="text-[11px] text-[hsl(var(--vd-danger))]">{bankForm.formState.errors.bank?.message as string}</p>
                  )}
                </div>
                <FormField label="شماره حساب" registerProps={bankForm.register("accountNumber")} error={bankForm.formState.errors.accountNumber?.message as string} />
                <FormField label="شماره شبا" placeholder="شبا با IR شروع می‌شود" registerProps={bankForm.register("iban")} error={bankForm.formState.errors.iban?.message as string} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="tax"
              className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl px-4"
            >
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline text-right">اطلاعات مالیاتی</AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {merchantType === "individual" ? (
                  <>
                    <FormField label="کد مالیاتی (اختیاری)" registerProps={taxForm.register("taxCode")} />
                    <FormField label="شماره پرونده مالیاتی (اختیاری)" registerProps={taxForm.register("taxFile")} />
                  </>
                ) : (
                  <>
                    <FormField label="کد اقتصادی" registerProps={taxForm.register("economicCode")} error={taxForm.formState.errors.economicCode?.message as string} />
                    <FormField label="شناسه مالیاتی" registerProps={taxForm.register("taxId")} error={taxForm.formState.errors.taxId?.message as string} />
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="agreement"
              className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl px-4"
            >
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline text-right">قرارداد فروشنده</AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">مطالعه و امضای قرارداد همکاری</div>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => toast.message("دانلود شد (نمایشی)")}>
                    <Download className="w-3.5 h-3.5" />
                    دانلود
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <StickySaveBar visible={dirty} onSave={saveAll} onCancel={() => { idForm.reset(); bankForm.reset(); taxForm.reset(); }} />
        </TabsContent>
      </Tabs>

      <WithdrawSheet open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </div>
  );
};
