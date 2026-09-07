import { Sparkles } from "lucide-react";
import petabadLogo from "@/assets/petabad-logo.svg";

const SUGGESTIONS = [
  "برای بچه‌گربه‌ام غذا و اسباب‌بازی می‌خوام",
  "غذای خشک سگ نژاد بزرگ چی پیشنهاد می‌دی؟",
  "شامپو مناسب گربه با پوست حساس",
  "مکمل ویتامین برای سگ بالغ",
];

export const FloatingAgentEmptyState = ({ onPick }: { onPick: (q: string) => void }) => (
  <div className="mb-4 rounded-3xl border border-border/70 bg-card p-5 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
      <img src={petabadLogo} alt="پت آباد" className="h-8 w-8" />
    </div>
    <h2 className="mt-3 text-[15px] font-bold text-foreground">چی برای حیوون خونگیت لازم داری؟</h2>
    <p className="mt-1 text-xs leading-6 text-muted-foreground">
      بگو چه حیوونی داری و دنبال چی هستی؛ گزینه‌های مناسبش رو برات پیدا می‌کنم.
    </p>

    <div className="mt-4 space-y-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="flex w-full items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2.5 text-right text-xs leading-6 text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="flex-1">{s}</span>
        </button>
      ))}
    </div>
  </div>
);
