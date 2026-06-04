import { ArrowLeft, Wallet } from "lucide-react";
import { formatToman } from "../data/mockVendor";

interface Props {
  balance: number;
  pending: number;
  nextSettlement: string;
  onWithdraw: () => void;
}

export const HeroBalanceCard = ({ balance, pending, nextSettlement, onWithdraw }: Props) => (
  <div className="rounded-3xl p-5 bg-[hsl(var(--vd-surface-ink))] text-white relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-20 pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at 100% 0%, hsl(var(--vd-accent)) 0%, transparent 60%)",
      }}
    />
    <div className="relative">
      <div className="flex items-center gap-2 text-[11px] text-white/60">
        <Wallet className="w-3.5 h-3.5" />
        موجودی قابل برداشت
      </div>
      <div
        className="text-3xl font-semibold tracking-tight mt-2"
        style={{ unicodeBidi: "isolate" }}
      >
        {formatToman(balance)}
      </div>

      <div className="flex items-center gap-2 mt-3 text-[11px] text-white/70">
        <span
          className="rounded-full bg-white/10 px-2 py-0.5"
          style={{ unicodeBidi: "isolate" }}
        >
          در انتظار تسویه {formatToman(pending)}
        </span>
        <span style={{ unicodeBidi: "isolate" }}>تسویه بعدی {nextSettlement}</span>
      </div>

      <button
        onClick={onWithdraw}
        className="mt-4 w-full bg-white text-[hsl(var(--vd-surface-ink))] rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
      >
        برداشت وجه
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  </div>
);
