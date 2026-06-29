import { useState } from "react";
import { useShiftCart } from "../context/ShiftCartContext";
import { useShiftStore } from "../context/ShiftStoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "../data/format";
import { CheckCircle2 } from "lucide-react";

interface Props { onDone: () => void; }

type Step = "address" | "shipping" | "payment" | "done";

const CheckoutView = ({ onDone }: Props) => {
  const { store } = useShiftStore();
  const { user } = useAuth();
  const { items, subtotal, clear } = useShiftCart();
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState({
    full_name: "", phone: "", province: "", city: "", address_line: "", postal_code: "",
  });
  const [shipping, setShipping] = useState<"standard" | "express">("standard");
  const [payment, setPayment] = useState<"online" | "cod">("online");
  const [submitting, setSubmitting] = useState(false);

  const shippingCost = shipping === "express" ? 80_000 : 35_000;
  const total = subtotal + shippingCost;

  const placeOrder = async () => {
    setSubmitting(true);
    if (user && store) {
      await supabase.from("shift_orders").insert({
        user_id: user.id, store_id: store.id,
        items: items as any, subtotal, shipping_cost: shippingCost, total,
        address: address as any, shipping_method: shipping, payment_method: payment,
        status: "pending",
      });
    }
    clear();
    setStep("done");
    setSubmitting(false);
  };

  if (items.length === 0 && step !== "done") {
    return <div className="text-sm text-[hsl(var(--shift-muted))]">سبد خرید خالی است.</div>;
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center text-center py-16 gap-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        <h1 className="text-xl font-bold">سفارش شما ثبت شد</h1>
        <p className="text-sm text-[hsl(var(--shift-muted))] max-w-xs">به زودی برای تایید با شما تماس می‌گیریم.</p>
        <button onClick={onDone} className="px-5 py-2.5 rounded-full bg-[hsl(var(--shift-primary))] text-white text-sm">
          مشاهده سفارش‌ها
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">تسویه حساب</h1>
      <Stepper step={step} />

      {step === "address" && (
        <div className="space-y-3">
          {([
            ["full_name", "نام و نام خانوادگی"],
            ["phone", "شماره موبایل"],
            ["province", "استان"],
            ["city", "شهر"],
            ["address_line", "آدرس کامل"],
            ["postal_code", "کد پستی"],
          ] as const).map(([k, label]) => (
            <input key={k} placeholder={label} value={(address as any)[k]}
              onChange={(e) => setAddress({ ...address, [k]: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] text-sm"/>
          ))}
          <button onClick={() => setStep("shipping")}
            disabled={!address.full_name || !address.phone || !address.address_line}
            className="w-full py-3 rounded-xl bg-[hsl(var(--shift-primary))] text-white text-sm font-medium disabled:opacity-50">
            ادامه
          </button>
        </div>
      )}

      {step === "shipping" && (
        <div className="space-y-3">
          {([["standard", "ارسال عادی (۳ تا ۵ روز)", 35_000], ["express", "ارسال سریع (۱ تا ۲ روز)", 80_000]] as const).map(([k, label, price]) => (
            <button key={k} onClick={() => setShipping(k)}
              className={`w-full text-right p-4 rounded-xl border text-sm transition ${
                shipping === k ? "border-[hsl(var(--shift-primary))] bg-[hsl(var(--shift-primary)/0.05)]" : "border-[hsl(var(--shift-border))] bg-[hsl(var(--shift-surface))]"
              }`}>
              <div className="font-medium">{label}</div>
              <div className="text-xs text-[hsl(var(--shift-muted))] mt-1">{formatPrice(price)}</div>
            </button>
          ))}
          <button onClick={() => setStep("payment")} className="w-full py-3 rounded-xl bg-[hsl(var(--shift-primary))] text-white text-sm font-medium">ادامه</button>
        </div>
      )}

      {step === "payment" && (
        <div className="space-y-3">
          {([["online", "پرداخت آنلاین"], ["cod", "پرداخت در محل"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setPayment(k)}
              className={`w-full text-right p-4 rounded-xl border text-sm transition ${
                payment === k ? "border-[hsl(var(--shift-primary))] bg-[hsl(var(--shift-primary)/0.05)]" : "border-[hsl(var(--shift-border))] bg-[hsl(var(--shift-surface))]"
              }`}>
              {label}
            </button>
          ))}

          <div className="rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] p-4 space-y-2 text-sm">
            <Row label="جمع کالاها" value={formatPrice(subtotal)} />
            <Row label="هزینه ارسال" value={formatPrice(shippingCost)} />
            <div className="border-t border-[hsl(var(--shift-border))] pt-2 mt-2">
              <Row label="مبلغ نهایی" value={formatPrice(total)} bold />
            </div>
          </div>

          <button onClick={placeOrder} disabled={submitting}
            className="w-full py-3 rounded-xl bg-[hsl(var(--shift-primary))] text-white text-sm font-medium disabled:opacity-50">
            {submitting ? "در حال ثبت..." : "ثبت سفارش"}
          </button>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-[hsl(var(--shift-muted))]">{label}</span>
    <span className={bold ? "font-bold" : ""}>{value}</span>
  </div>
);

const Stepper = ({ step }: { step: Step }) => {
  const steps: { id: Step; label: string }[] = [
    { id: "address", label: "آدرس" },
    { id: "shipping", label: "ارسال" },
    { id: "payment", label: "پرداخت" },
  ];
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            i <= idx ? "bg-[hsl(var(--shift-primary))] text-white" : "bg-[hsl(var(--shift-surface))] text-[hsl(var(--shift-muted))]"
          }`}>{i + 1}</div>
          <div className="text-xs">{s.label}</div>
          {i < steps.length - 1 && <div className="flex-1 h-px bg-[hsl(var(--shift-border))]" />}
        </div>
      ))}
    </div>
  );
};

export default CheckoutView;
