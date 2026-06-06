import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetPortal, SheetOverlay, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatToman, toEnglishDigits, toPersianDigits } from "../data/mockVendor";
import { withdrawalSchema } from "../data/schemas";
import { useVendorDashboard } from "../context/VendorDashboardContext";
import { BankAccountRow } from "../shared/BankAccountRow";
import { FormField } from "../shared/FormField";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PERCENT_CHIPS = [25, 50, 100];

export const WithdrawSheet = ({ open, onOpenChange }: Props) => {
  const { vendor, addWithdrawal } = useVendorDashboard();
  const navigate = useNavigate();
  const balance = vendor.payouts.withdrawable;
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"form" | "loading" | "success">("form");
  const [refId, setRefId] = useState("");

  useEffect(() => {
    if (open) {
      setAmountStr("");
      setNote("");
      setError(null);
      setStage("form");
    }
  }, [open]);

  const amount = useMemo(() => {
    const n = parseInt(toEnglishDigits(amountStr).replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }, [amountStr]);

  const setPercent = (pct: number) => {
    const v = Math.floor((balance * pct) / 100);
    setAmountStr(toPersianDigits(v.toLocaleString("en-US")));
  };

  const submit = () => {
    const parsed = withdrawalSchema(balance).safeParse({ amount, note });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "خطا");
      return;
    }
    setError(null);
    setStage("loading");
    setTimeout(() => {
      const row = addWithdrawal(amount, note);
      setRefId(toPersianDigits(row.id));
      setStage("success");
    }, 1100);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetOverlay className="bg-black/50 z-50" />
        <SheetPrimitive.Content
          dir="rtl"
          className="vendor-dash fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-[hsl(var(--vd-stroke))] p-0 max-h-[92vh] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.18)] pb-[max(env(safe-area-inset-bottom),16px)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-300 data-[state=open]:duration-400"
        >
          <div className="mx-auto w-10 h-1.5 rounded-full bg-[hsl(var(--vd-stroke))] mt-2" />
          <div className="flex items-center justify-between px-5 pt-3 pb-3">
            <SheetHeader className="text-right space-y-0">
              <SheetTitle className="text-base">برداشت وجه</SheetTitle>
            </SheetHeader>
            <button onClick={() => onOpenChange(false)} className="vd-interactive w-8 h-8 rounded-full border border-[hsl(var(--vd-stroke))] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>


        {stage === "success" ? (
          <div className="px-5 pb-6 space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--vd-positive-soft))] text-[hsl(var(--vd-positive))] flex items-center justify-center">
              <Check className="w-8 h-8" strokeWidth={3} />
            </div>
            <div className="text-base font-semibold text-foreground">درخواست برداشت ثبت شد</div>
            <div className="text-xs text-muted-foreground" style={{ unicodeBidi: "isolate" }}>
              کد پیگیری: {refId}
            </div>
            <div className="text-xs text-muted-foreground">واریز طی ۲ تا ۳ روز کاری انجام می‌شود.</div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
                بازگشت
              </Button>
              <Button
                className="rounded-full"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/m/gptcommerce/dash/finance");
                }}
              >
                مشاهده تاریخچه
              </Button>
            </div>
          </div>
        ) : stage === "loading" ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[hsl(var(--vd-stroke))] border-t-[hsl(var(--vd-accent))] animate-spin" />
            <div className="text-xs text-muted-foreground">در حال ثبت درخواست...</div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            <div className="bg-[hsl(var(--vd-surface-ink))] text-white rounded-2xl p-4">
              <div className="text-[11px] text-white/60">موجودی قابل برداشت</div>
              <div className="text-2xl font-semibold mt-1" style={{ unicodeBidi: "isolate" }}>
                {formatToman(balance)}
              </div>
            </div>

            <BankAccountRow
              bank={vendor.banking.bank}
              iban={vendor.banking.iban || "IR000000000000000000000000"}
              holder={vendor.banking.holder}
            />
            <p className="text-[11px] text-muted-foreground -mt-2">برای تغییر حساب به بخش مالی بروید.</p>

            <FormField
              label="مبلغ برداشت (تومان)"
              value={amountStr}
              placeholder="۰"
              onChange={(e) => setAmountStr(e.target.value)}
              error={error ?? undefined}
            />

            <div className="flex gap-2">
              {PERCENT_CHIPS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(p)}
                  className="vd-interactive flex-1 text-xs rounded-full border border-[hsl(var(--vd-stroke))] bg-[hsl(var(--vd-surface))] py-2"
                >
                  {toPersianDigits(p)}٪
                </button>
              ))}
            </div>


            <FormField
              label="یادداشت (اختیاری)"
              type="textarea"
              value={note}
              placeholder="مثلاً تسویه ماهانه"
              onChange={(e) => setNote(e.target.value)}
              helper={`${toPersianDigits(note.length)}/۱۰۰`}
            />

            <Button className="w-full rounded-full" onClick={submit}>
              تأیید برداشت
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
