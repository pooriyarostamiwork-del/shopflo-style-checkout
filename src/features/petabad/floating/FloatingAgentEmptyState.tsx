import petabadLogo from "@/assets/petabad-logo.svg";

const SUGGESTIONS = [
  "برای بچه‌گربه‌ام غذا و اسباب‌بازی می‌خوام",
  "غذای خشک سگ نژاد بزرگ چی پیشنهاد می‌دی؟",
  "شامپو مناسب گربه با پوست حساس",
  "مکمل ویتامین برای سگ بالغ",
];

export const FloatingAgentEmptyState = ({ onPick }: { onPick: (q: string) => void }) => (
  <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
    <img src={petabadLogo} alt="پت آباد" className="h-12 w-12" />
    <div>
      <h2 className="text-base font-semibold text-foreground">چی برای حیوون خونگیت لازم داری؟</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        بگو چه حیوونی داری و دنبال چی هستی؛ محصول مناسبش رو پیدا می‌کنم.
      </p>
    </div>
    <div className="flex w-full flex-col gap-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="rounded-xl border border-border px-3 py-2 text-right text-xs text-foreground transition-colors hover:bg-muted"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);
