import { KpiCard } from "../shared/KpiCard";
import { TrendChart } from "../shared/TrendChart";
import { IntentCloud } from "../shared/IntentCloud";
import { MissingChip } from "../shared/MissingChip";
import { ProLock, ProBadge } from "../shared/ProLock";
import { useDashboard } from "../context/DashboardContext";
import { kpis, faToman, faNum, faPct, fa, failedMatches, dropoffs, topProducts } from "../data/mockDashboard";
import { Wallet, Users, MousePointerClick, TrendingUp } from "lucide-react";

export const PerformanceHome = () => {
  const { plan, content } = useDashboard();
  const isPro = plan === "pro";

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="sd-card sd-anim-in p-5 flex items-center justify-between gap-4"
        style={{ background: "linear-gradient(120deg, hsl(var(--sd-primary-soft)), hsl(var(--sd-surface)) 60%)",
          borderColor: "hsl(var(--sd-primary)/.2)" }}>
        <div>
          <div className="text-[11px] text-[hsl(var(--sd-primary-ink))] font-semibold mb-1">امروز</div>
          <h1 className="text-2xl font-bold tracking-tight">
            {content.agentName} فعال است
          </h1>
          <p className="text-sm text-[hsl(var(--sd-muted))] mt-1">
            نمای کلی عملکرد و سیگنال‌های امروز فروشگاه شما
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px] text-[hsl(var(--sd-muted))]">
          <span className="sd-live-dot" /> {fa(kpis.customersHelped.liveNow)} گفتگوی زنده
        </div>
      </div>

      {!isPro && (
        <MissingChip text="قیف پرداخت و نرخ ترک سبد در Shift Pro قابل مشاهده است" />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="درآمد مساعدت‌شده" value={faToman(kpis.assistedRevenue.value)} delta={kpis.assistedRevenue.delta} icon={<Wallet className="w-4 h-4" />} />
        <KpiCard
          label="مشتریان کمک‌گرفته"
          value={faNum(kpis.customersHelped.value)}
          sub={`${faNum(kpis.customersHelped.firstTimers)} تازه‌وارد · ${faNum(kpis.customersHelped.returning)} بازگشتی`}
          delta={kpis.customersHelped.delta}
          live
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard label="کلیک روی کارت محصول" value={faNum(kpis.productClicks.value)} delta={kpis.productClicks.delta} icon={<MousePointerClick className="w-4 h-4" />} />
        <KpiCard label="نرخ تبدیل گفتگو→خرید" value={faPct(kpis.conversion.value)} delta={kpis.conversion.delta} icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TrendChart
          title="درآمد مساعدت‌شده در برابر مشتریان کمک‌گرفته"
          seriesA={{ key: "assistedRevenue", name: "درآمد" }}
          seriesB={{ key: "customersHelped", name: "مشتریان" }}
          formatterA={(n) => faToman(n)}
        />
        <TrendChart
          title="مشتریان کمک‌گرفته در برابر نرخ تبدیل"
          seriesA={{ key: "customersHelped", name: "مشتریان" }}
          seriesB={{ key: "conversion", name: "نرخ تبدیل" }}
          formatterB={(n) => faPct(n)}
        />
      </div>

      {/* Signals */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full" style={{ background: "hsl(var(--sd-primary))" }} />
          <h2 className="text-base font-semibold">سیگنال‌ها</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="sd-card p-4">
            <div className="text-sm font-semibold mb-3">پرتکرارترین نیت‌ها و جست‌وجوهای مشتریان</div>
            <IntentCloud />
          </div>
          <div className="sd-card p-4">
            <div className="text-sm font-semibold mb-3">جست‌وجوهای بدون تطبیق</div>
            <ul className="space-y-2">
              {failedMatches.map(f => (
                <li key={f.q} className="flex items-center justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                  <span className="text-[13px]">{f.q}</span>
                  <span className="sd-chip sd-num">{fa(f.count)} بار</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sd-card p-4">
            <div className="text-sm font-semibold mb-3">دلایل ترک خرید</div>
            <div className="space-y-2.5">
              {dropoffs.map(d => {
                const row = (
                  <div className="flex items-center gap-3">
                    <div className="w-28 text-[13px] flex items-center gap-1.5">
                      {d.reason}
                      {d.pro && !isPro && <ProBadge />}
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--sd-surface-2))" }}>
                      <div style={{ width: `${d.pct}%`, background: "hsl(var(--sd-primary))", height: "100%" }} />
                    </div>
                    <div className="w-12 text-left text-[12px] sd-num text-[hsl(var(--sd-muted))]">{faPct(d.pct)}</div>
                  </div>
                );
                return <div key={d.reason}>{d.pro && !isPro ? <div className="opacity-70">{row}</div> : row}</div>;
              })}
            </div>
          </div>

          <div className="sd-card p-4">
            <div className="text-sm font-semibold mb-3">پرپیشنهادترین محصولات</div>
            <table className="w-full text-[12px]" dir="rtl">
              <thead className="text-[11px] text-[hsl(var(--sd-muted))]">
                <tr>
                  <th className="text-right font-normal pb-2">محصول</th>
                  <th className="text-left font-normal pb-2">پیشنهاد</th>
                  <th className="text-left font-normal pb-2">کلیک</th>
                  <th className="text-left font-normal pb-2">CTR</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map(p => (
                  <tr key={p.name} className="border-t" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                    <td className="py-2">{p.name}</td>
                    <td className="text-left sd-num">{fa(p.recs)}</td>
                    <td className="text-left sd-num">{fa(p.clicks)}</td>
                    <td className="text-left sd-num">{faPct(p.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
