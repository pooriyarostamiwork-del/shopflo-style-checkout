import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "../shared/FormField";
import { PolicyRadioGroup } from "../shared/PolicyRadioGroup";
import { StickySaveBar } from "../shared/StickySaveBar";
import { PendingApprovalPill } from "../shared/PendingApprovalPill";
import { SettingsListRow } from "../shared/SettingsListRow";
import { SectionTitle } from "../shared/SectionTitle";
import {
  profileSchema,
  returnPolicySchema,
  accountEmailSchema,
  accountMobileSchema,
} from "../data/schemas";
import { useVendorDashboard } from "../context/VendorDashboardContext";
import { maskMobile, maskEmail, toPersianDigits, BUSINESS_TYPES } from "../data/mockVendor";

type TabKey = "profile" | "returns" | "account";
const isTab = (v: string | null): v is TabKey => v === "profile" || v === "returns" || v === "account";

export const MobileVendorSettings = () => {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const [tab, setTab] = useState<TabKey>(isTab(tabParam) ? tabParam : "profile");
  const { vendor, enqueueChange, getPendingForSection, cancelPending } = useVendorDashboard();

  useEffect(() => {
    if (isTab(tabParam) && tabParam !== tab) setTab(tabParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const handleTab = (v: string) => {
    setTab(v as TabKey);
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  // ---------- Profile form ----------
  const pendingProfile = getPendingForSection("profile");
  const profileValues = {
    ...vendor.profile,
    ...(pendingProfile?.fields as any || {}),
  };
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: profileValues,
    mode: "onBlur",
  });
  useEffect(() => { profileForm.reset(profileValues); /* eslint-disable-next-line */ }, [vendor.profile, pendingProfile?.id]);

  const saveProfile = profileForm.handleSubmit(
    (data) => {
      enqueueChange("profile", data);
      profileForm.reset(data);
      toast.success("درخواست تغییر پروفایل برای بررسی ادمین ارسال شد");
    },
    () => toast.error("لطفاً خطاهای فرم را برطرف کنید"),
  );

  // ---------- Return Policy form ----------
  const pendingReturns = getPendingForSection("returnPolicy");
  const returnsValues = { ...vendor.returnPolicy, ...(pendingReturns?.fields as any || {}) };
  const returnsForm = useForm({
    resolver: zodResolver(returnPolicySchema),
    defaultValues: returnsValues,
    mode: "onBlur",
  });
  useEffect(() => { returnsForm.reset(returnsValues); /* eslint-disable-next-line */ }, [vendor.returnPolicy, pendingReturns?.id]);

  const saveReturns = returnsForm.handleSubmit((data) => {
    enqueueChange("returnPolicy", data);
    returnsForm.reset(data);
    toast.success("سیاست بازگشت برای بررسی ادمین ارسال شد");
  });

  // ---------- Account change sheets ----------
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="pb-1">
        <div className="text-[11px] text-muted-foreground">داشبورد فروشنده</div>
        <div className="text-base font-semibold text-foreground mt-0.5">تنظیمات</div>
      </div>

      <Tabs value={tab} onValueChange={handleTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-full p-1 h-auto">
          <TabsTrigger value="account" className="rounded-full text-xs data-[state=active]:bg-[hsl(var(--vd-accent))] data-[state=active]:text-white">حساب</TabsTrigger>
          <TabsTrigger value="returns" className="rounded-full text-xs data-[state=active]:bg-[hsl(var(--vd-accent))] data-[state=active]:text-white">بازگشت</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-full text-xs data-[state=active]:bg-[hsl(var(--vd-accent))] data-[state=active]:text-white">پروفایل</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile" className="mt-4 space-y-3">
          <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">اطلاعات کسب‌وکار</div>
              {pendingProfile && <PendingApprovalPill onCancel={() => cancelPending(pendingProfile.id)} />}
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--vd-accent-soft))] border border-[hsl(var(--vd-stroke))] flex items-center justify-center text-xs text-[hsl(var(--vd-accent))] shrink-0">
                لوگو
              </div>
              <div className="flex-1 text-right">
                <Button variant="outline" size="sm" type="button" className="rounded-full">
                  بارگذاری
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1" dir="rtl">تأیید توسط ادمین لازم است.</p>
              </div>
            </div>

            <FormField label="نام کسب‌وکار" registerProps={profileForm.register("businessName")} error={profileForm.formState.errors.businessName?.message as string} />
            <FormField
              label="توضیحات کسب‌وکار"
              type="textarea"
              registerProps={profileForm.register("description")}
              error={profileForm.formState.errors.description?.message as string}
              helper={`${toPersianDigits(profileForm.watch("description")?.length ?? 0)} / ۲۵۰`}
            />
            <FormField label="تلفن پشتیبانی" type="tel" registerProps={profileForm.register("supportPhone")} error={profileForm.formState.errors.supportPhone?.message as string} dir="ltr" inputClassName="text-left" />

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">نوع کسب‌وکار</label>
              <Select
                value={profileForm.watch("businessType")}
                onValueChange={(v) => profileForm.setValue("businessType", v, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger className="rounded-2xl border-[hsl(var(--vd-stroke))]">
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <FormField label="آدرس وب‌سایت" registerProps={profileForm.register("website")} error={profileForm.formState.errors.website?.message as string} dir="ltr" inputClassName="text-left" />
            <FormField label="ساعات کاری" registerProps={profileForm.register("operatingHours")} error={profileForm.formState.errors.operatingHours?.message as string} />
          </div>
          <StickySaveBar visible={profileForm.formState.isDirty} onSave={saveProfile} onCancel={() => profileForm.reset()} />
        </TabsContent>

        {/* RETURNS */}
        <TabsContent value="returns" className="mt-4 space-y-3">
          <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">سیاست بازگشت کالا</div>
              {pendingReturns && <PendingApprovalPill onCancel={() => cancelPending(pendingReturns.id)} />}
            </div>
            <PolicyRadioGroup
              label="پذیرش بازگشت کالا"
              value={returnsForm.watch("returnsAccepted") as "yes" | "no"}
              onChange={(v) => returnsForm.setValue("returnsAccepted", v, { shouldDirty: true })}
              options={[{ key: "yes", label: "بله" }, { key: "no", label: "خیر" }]}
            />
            <PolicyRadioGroup
              label="بازه زمانی بازگشت"
              value={returnsForm.watch("returnWindow") as "7" | "14" | "30"}
              onChange={(v) => returnsForm.setValue("returnWindow", v, { shouldDirty: true })}
              options={[{ key: "7", label: "۷ روز" }, { key: "14", label: "۱۴ روز" }, { key: "30", label: "۳۰ روز" }]}
            />
            <PolicyRadioGroup
              label="مسئولیت هزینه ارسال بازگشتی"
              value={returnsForm.watch("shippingResponsibility") as "customer" | "merchant" | "depends"}
              onChange={(v) => returnsForm.setValue("shippingResponsibility", v, { shouldDirty: true })}
              options={[
                { key: "customer", label: "مشتری" },
                { key: "merchant", label: "فروشنده" },
                { key: "depends", label: "بسته به دلیل" },
              ]}
            />
          </div>
          <StickySaveBar visible={returnsForm.formState.isDirty} onSave={saveReturns} onCancel={() => returnsForm.reset()} saveLabel="ذخیره سیاست" />
        </TabsContent>

        {/* ACCOUNT */}
        <TabsContent value="account" className="mt-4 space-y-3">
          <SectionTitle eyebrow="ورود">اطلاعات حساب کاربری</SectionTitle>
          <div className="space-y-2">
            <SettingsListRow
              label="شماره موبایل"
              value={maskMobile(vendor.account.mobile)}
              helper="شناسه ورود، بازیابی حساب و ارتباطات."
              onClick={() => setMobileSheetOpen(true)}
            />
            <SettingsListRow
              label="رمز عبور"
              value="••••••••••••"
              onClick={() => setPasswordSheetOpen(true)}
            />
            <SettingsListRow
              label="ایمیل (اختیاری)"
              value={maskEmail(vendor.account.email)}
              helper="فقط برای فاکتور، پشتیبانی و اطلاع‌رسانی."
              onClick={() => setEmailSheetOpen(true)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ChangeMobileSheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen} />
      <ChangeEmailSheet open={emailSheetOpen} onOpenChange={setEmailSheetOpen} />
      <ChangePasswordSheet open={passwordSheetOpen} onOpenChange={setPasswordSheetOpen} />
    </div>
  );
};

// ----- Account change sheets (lightweight, inline) -----

const ChangeMobileSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { enqueueChange } = useVendorDashboard();
  const [stage, setStage] = useState<"input" | "otp">("input");
  const form = useForm({ resolver: zodResolver(accountMobileSchema), defaultValues: { mobile: "" } });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const submitMobile = form.handleSubmit(() => setStage("otp"));
  const confirmOtp = () => {
    if (otp.some((d) => !d)) { toast.error("کد ۶ رقمی را کامل وارد کنید"); return; }
    enqueueChange("account", { mobile: form.getValues("mobile") });
    toast.success("درخواست تغییر شماره برای بررسی ارسال شد");
    onOpenChange(false);
    setTimeout(() => { setStage("input"); setOtp(["", "", "", "", "", ""]); form.reset(); }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" dir="rtl" className="rounded-t-3xl border-t border-[hsl(var(--vd-stroke))] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.18)] pb-[max(env(safe-area-inset-bottom),20px)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-[hsl(var(--vd-stroke))] -mt-2 mb-3" />
        <SheetHeader className="text-right"><SheetTitle className="text-base">تغییر شماره موبایل</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          {stage === "input" ? (
            <>
              <FormField label="شماره موبایل جدید" type="tel" placeholder="۰۹۱۲۰۰۰۰۰۰۰" registerProps={form.register("mobile")} error={form.formState.errors.mobile?.message as string} />
              <Button className="w-full rounded-full" onClick={submitMobile}>ارسال کد تأیید</Button>
            </>

          ) : (
            <>
              <p className="text-xs text-muted-foreground">کد ۶ رقمی ارسال شد به {toPersianDigits(form.getValues("mobile"))}</p>
              <div className="flex gap-2 justify-center" dir="ltr">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    value={d}
                    maxLength={1}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      const next = [...otp]; next[i] = v; setOtp(next);
                      if (v && i < 5) (document.getElementById(`otp-${i+1}`) as HTMLInputElement)?.focus();
                    }}
                    id={`otp-${i}`}
                    className="w-10 h-12 text-center text-lg rounded-xl border border-[hsl(var(--vd-stroke))] bg-[hsl(var(--vd-surface))]"
                  />
                ))}
              </div>
              <Button className="w-full rounded-full" onClick={confirmOtp}>تأیید و ارسال درخواست</Button>
            </>
          )}
          <p className="text-[11px] text-muted-foreground text-center">تغییر شماره پس از تأیید ادمین اعمال می‌شود.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ChangeEmailSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { enqueueChange } = useVendorDashboard();
  const form = useForm({ resolver: zodResolver(accountEmailSchema), defaultValues: { email: "" } });
  const submit = form.handleSubmit((data) => {
    enqueueChange("account", { email: data.email });
    toast.success("درخواست تغییر ایمیل برای بررسی ارسال شد");
    onOpenChange(false);
    form.reset();
  });
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" dir="rtl" className="rounded-t-3xl border-t border-[hsl(var(--vd-stroke))] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.18)] pb-[max(env(safe-area-inset-bottom),20px)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-[hsl(var(--vd-stroke))] -mt-2 mb-3" />
        <SheetHeader className="text-right"><SheetTitle className="text-base">به‌روزرسانی ایمیل</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <FormField label="ایمیل جدید" type="email" placeholder="you@example.com" registerProps={form.register("email")} error={form.formState.errors.email?.message as string} />
          <Button className="w-full rounded-full" onClick={submit}>ارسال درخواست</Button>
          <p className="text-[11px] text-muted-foreground text-center">تغییر پس از تأیید ادمین اعمال می‌شود.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};


const ChangePasswordSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (next.length < 8) { setErr("رمز عبور باید حداقل ۸ کاراکتر باشد"); return; }
    if (next !== confirm) { setErr("تکرار رمز عبور مطابقت ندارد"); return; }
    setErr(null);
    toast.success("رمز عبور با موفقیت تغییر کرد (نمایشی)");
    onOpenChange(false);
    setCurrent(""); setNext(""); setConfirm("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" dir="rtl" className="rounded-t-3xl border-t border-[hsl(var(--vd-stroke))] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.18)] pb-[max(env(safe-area-inset-bottom),20px)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-[hsl(var(--vd-stroke))] -mt-2 mb-3" />
        <SheetHeader className="text-right"><SheetTitle className="text-base">تغییر رمز عبور</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <FormField label="رمز عبور فعلی" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <FormField label="رمز عبور جدید" type="password" value={next} onChange={(e) => setNext(e.target.value)} helper="حداقل ۸ کاراکتر" />
          <FormField label="تکرار رمز جدید" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={err ?? undefined} />
          <Button className="w-full rounded-full" onClick={submit}>تغییر رمز</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

