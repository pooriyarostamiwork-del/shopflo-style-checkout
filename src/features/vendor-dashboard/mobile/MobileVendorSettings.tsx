import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FormField } from "../shared/FormField";
import { PolicyRadioGroup } from "../shared/PolicyRadioGroup";
import { mockVendor } from "../data/mockVendor";

export const MobileVendorSettings = () => {
  const [returnsAccepted, setReturnsAccepted] = useState(mockVendor.returnPolicy.returnsAccepted);
  const [returnWindow, setReturnWindow] = useState(mockVendor.returnPolicy.returnWindow);
  const [shipping, setShipping] = useState(mockVendor.returnPolicy.shippingResponsibility);

  return (
    <div className="px-4 py-5">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-card border border-border rounded-full p-1 h-auto">
          <TabsTrigger value="profile" className="rounded-full text-xs">پروفایل</TabsTrigger>
          <TabsTrigger value="returns" className="rounded-full text-xs">بازگشت</TabsTrigger>
          <TabsTrigger value="account" className="rounded-full text-xs">حساب کاربری</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground">اطلاعات کسب‌وکار</div>
            <FormField label="نام کسب‌وکار" value={mockVendor.profile.businessName} />
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">لوگوی فروشگاه</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">
                  لوگو
                </div>
                <Button variant="outline" size="sm" type="button">
                  بارگذاری
                </Button>
              </div>
            </div>
            <FormField label="توضیحات کسب‌وکار" type="textarea" value={mockVendor.profile.description} />
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground">اطلاعات تماس</div>
            <FormField label="شماره تلفن پشتیبانی" type="tel" value={mockVendor.profile.supportPhone} />
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground">اطلاعات عملیاتی</div>
            <FormField label="نوع کسب‌وکار" value={mockVendor.profile.businessType} />
            <FormField label="آدرس وب‌سایت" value={mockVendor.profile.website} />
            <FormField label="ساعات کاری" value={mockVendor.profile.operatingHours} />
          </div>

          <Button className="w-full" onClick={() => toast.success("ذخیره شد (نمایشی)")}>
            ذخیره تغییرات
          </Button>
        </TabsContent>

        <TabsContent value="returns" className="mt-4 space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <PolicyRadioGroup<"yes" | "no">
              label="پذیرش بازگشت کالا"
              value={returnsAccepted}
              onChange={setReturnsAccepted}
              options={[
                { key: "yes", label: "بله" },
                { key: "no", label: "خیر" },
              ]}
            />
            <PolicyRadioGroup<"7" | "14" | "30">
              label="بازه زمانی بازگشت"
              value={returnWindow}
              onChange={setReturnWindow}
              options={[
                { key: "7", label: "۷ روز" },
                { key: "14", label: "۱۴ روز" },
                { key: "30", label: "۳۰ روز" },
              ]}
            />
            <PolicyRadioGroup<"customer" | "merchant" | "depends">
              label="مسئولیت هزینه ارسال بازگشتی"
              value={shipping}
              onChange={setShipping}
              options={[
                { key: "customer", label: "مشتری" },
                { key: "merchant", label: "فروشنده" },
                { key: "depends", label: "بسته به دلیل" },
              ]}
            />
          </div>
          <Button className="w-full" onClick={() => toast.success("سیاست ذخیره شد (نمایشی)")}>
            ذخیره سیاست
          </Button>
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">شماره موبایل</div>
                <div className="text-xs text-muted-foreground mt-0.5" style={{ unicodeBidi: "isolate" }}>
                  {mockVendor.account.mobile}
                </div>
              </div>
              <Button variant="outline" size="sm">تغییر شماره</Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-5">
              این شماره برای ورود، بازیابی حساب و ارتباطات استفاده می‌شود.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">رمز عبور</div>
              <div className="text-xs text-muted-foreground mt-0.5">••••••••••••</div>
            </div>
            <Button variant="outline" size="sm">تغییر رمز عبور</Button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">ایمیل (اختیاری)</div>
                <div className="text-xs text-muted-foreground mt-0.5" style={{ unicodeBidi: "isolate" }}>
                  {mockVendor.account.email}
                </div>
              </div>
              <Button variant="outline" size="sm">به‌روزرسانی ایمیل</Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-5">
              فقط برای فاکتور، پشتیبانی و اطلاع‌رسانی استفاده می‌شود. برای ورود کاربرد ندارد.
            </p>
          </div>

          <Button className="w-full" onClick={() => toast.success("ذخیره شد (نمایشی)")}>
            ذخیره تغییرات
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
