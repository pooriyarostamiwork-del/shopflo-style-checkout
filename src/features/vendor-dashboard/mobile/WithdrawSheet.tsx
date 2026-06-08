import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { formatToman, toEnglishDigits, toPersianDigits } from "../data/mockVendor";
import { withdrawalSchema } from "../data/schemas";
import { useVendorDashboard } from "../context/VendorDashboardContext";
import { BankAccountRow } from "../shared/BankAccountRow";
import { FormField } from "../shared/FormField";
import { VendorBottomSheet } from "../shared/VendorBottomSheet";
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
    <VendorBottomSheet open={open} onOpenChange={onOpenChange} title="برداشت وجه">
      {stage === "success" ? (
        <div className="space-y-4 text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--vd-positive-soft))] text-[hsl(var(--vd-positive))] flex items-center justify-center">
            <Check className="w-8 h-8" strokeWidth={3} />
          </div>
          <div className="text-base font-semibold text-foreground">درخواست برداشت ثبت شد</div>
          <div className="text-xs text-muted-foreground vd-num">کد پیگیری: {refId}</div>
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
        <div className="py-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[hsl(var(--vd-stroke))] border-t-[hsl(var(--vd-accent))] animate-spin" />
          <div className="text-xs text-muted-foreground">در حال ثبت درخواست...</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[hsl(var(--vd-surface-ink))] text-white rounded-2xl p-4">
            <div className="text-[11px] text-white/60">موجودی قابل برداشت</div>
            <div className="text-2xl font-semibold mt-1 vd-num">{formatToman(balance)}</div>
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
                className="vd-interactive flex-1 text-xs rounded-full border border-[hsl(var(--vd-stroke))] bg-[hsl(var(--vd-surface))] py-2 vd-num"
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
    </VendorBottomSheet>
  );
};
