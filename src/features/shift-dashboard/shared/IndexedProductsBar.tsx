import { integrations, fa } from "../data/mockDashboard";

export const IndexedProductsBar = () => {
  const { indexed } = integrations;
  const total = indexed.total;
  const seg = [
    { label: "AI-اِلیجیبل", val: indexed.aiEligible, color: "hsl(var(--sd-primary))" },
    { label: "فقط ایندکس‌شده", val: indexed.justIndexed, color: "hsl(var(--sd-warning))" },
    { label: "خطا", val: indexed.errors, color: "hsl(var(--sd-danger))" },
  ];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-semibold">وضعیت ایندکس محصولات</div>
        <div className="text-[11px] text-[hsl(var(--sd-muted))] sd-num">
          مجموع {fa(total.toLocaleString("en-US"))}
        </div>
      </div>
      <div className="h-3 w-full rounded-full overflow-hidden flex" style={{ background: "hsl(var(--sd-surface-2))" }}>
        {seg.map(s => (
          <div key={s.label} style={{ width: `${(s.val / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {seg.map(s => (
          <div key={s.label} className="rounded-xl border p-2.5" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
            <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--sd-muted))]">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </div>
            <div className="mt-1 text-lg font-bold sd-num">{fa(s.val.toLocaleString("en-US"))}</div>
            <div className="text-[10px] text-[hsl(var(--sd-muted))] sd-num">
              {fa(((s.val / total) * 100).toFixed(1))}٪
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
