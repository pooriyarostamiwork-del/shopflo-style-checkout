import { CreditCard } from "lucide-react";
import { toPersianDigits } from "../data/mockVendor";

interface Props {
  bank: string;
  iban: string;
  holder: string;
}

const maskIban = (iban: string) => {
  if (!iban) return "—";
  const trimmed = iban.replace(/\s/g, "");
  if (trimmed.length < 10) return trimmed;
  return `${trimmed.slice(0, 4)} •••• •••• •••• ${trimmed.slice(-4)}`;
};

export const BankAccountRow = ({ bank, iban, holder }: Props) => (
  <div className="bg-[hsl(var(--vd-surface-2))] border border-[hsl(var(--vd-stroke))] rounded-2xl p-3 flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-[hsl(var(--vd-accent-soft))] text-[hsl(var(--vd-accent))] flex items-center justify-center">
      <CreditCard className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-foreground truncate">{bank || "حساب بانکی ثبت نشده"}</div>
      <div className="text-[11px] text-muted-foreground" style={{ unicodeBidi: "isolate" }}>
        {toPersianDigits(maskIban(iban))}
      </div>
      {holder && <div className="text-[11px] text-muted-foreground mt-0.5">به نام {holder}</div>}
    </div>
  </div>
);
