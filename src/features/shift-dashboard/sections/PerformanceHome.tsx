import { KpiCard } from "../shared/KpiCard";
import { TrendChart } from "../shared/TrendChart";
import { IntentCloud } from "../shared/IntentCloud";
import { MissingChip } from "../shared/MissingChip";
import { ProBadge } from "../shared/ProLock";
import { SectionHeader } from "../shared/SectionHeader";
import { useDashboard } from "../context/DashboardContext";
import { kpis, faToman, faNum, faPct, fa, failedMatches, dropoffs, topProducts } from "../data/mockDashboard";
import { Wallet, Users, MousePointerClick, TrendingUp } from "lucide-react";

const Meter = ({ pct }: { pct: number }) => {
  const filled = Math.round(pct / 10);
  return (
    <div className="sd-meter">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={i < filled ? "on" : ""} />
      ))}
    </div>
  );
};

export const PerformanceHome = () => {
  const { plan, content } = useDashboard();
  const isPro = plan === "pro";

  return (
    <div>
      <SectionHeader
        eyebrow="امروز"
        title={`${content.agentName} فعال است`}
        subtitle="نمای کلی عملکرد و سیگنال‌های امروز فروشگاه شما"
        actions={
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11.5px] text-[hsl(var(--sd-ink-2))]"
            style={{ borderColor: "hsl(var(--sd-stroke))", background: "hsl(var(--sd-surface))" }}>
            <span className="sd-live-dot" /> {fa(kpis.customersHelped.liveNow)} گفتگوی زنده
          </div>
        }
      />

      {!isPro && (
        <div className="mb-5">
          <MissingChip text="قیف پرداخت و نرخ ترک سبد در Shift Pro قابل مشاهده است" />
        </div>
      )}

      {/* KPIs — one hero */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          hero
          label="درآمد مساعدت‌شده"
          value={faToman(kpis.assistedRevenue.value)}
          delta={kpis.assistedRevenue.delta}
          icon={<Wallet className="w-4 h-4" strokeWidth={1.75} />}
        />
        <KpiCard
          label="مشتریان کمک‌گرفته"
          value={faNum(kpis.customersHelped.value)}
          sub={`${faNum(kpis.customersHelped.firstTimers)} تازه‌وارد · ${faNum(kpis.customersHelped.returning)} بازگشتی`}
          delta={kpis.customersHelped.delta}
          live
          icon={<Users className="w-4 h-4" strokeWidth={1.75} />}
        />
        <KpiCard
          label="کلیک روی کارت محصول"
          value={faNum(kpis.productClicks.value)}
          delta={kpis.productClicks.delta}
          icon={<MousePointerClick className="w-4 h-4" strokeWidth={1.75} />}
        />
        <KpiCard
          label="نرخ تبدیل گفتگو→خرید"
          value={faPct(kpis.conversion.value)}
          delta={kpis.conversion.delta}
          icon={<TrendingUp className="w-4 h-4" strokeWidth={1.75} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <TrendChart
          title="درآمد در برابر مشتریان"
          seriesA={{ key: "assistedRevenue", name: "درآمد" }}
          seriesB={{ key: "customersHelped", name: "مشتریان" }}
          formatterA={(n) => faToman(n)}
        />
        <TrendChart
          title="مشتریان در برابر نرخ تبدیل"
          seriesA={{ key: "customersHelped", name: "مشتریان" }}
          seriesB={{ key: "conversion", name: "نرخ تبدیل" }}
          formatterB={(n) => faPct(n)}
        />
      </div>

      {/* Signals */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1 h-4 rounded-full" style={{ background: "hsl(var(--sd-primary))" }} />
        <h2 className="text-[15px] font-semibold">سیگنال‌ها</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="sd-card p-5">
          <div className="text-[13px] font-semibold mb-4">پرتکرارترین نیت‌ها و جست‌وجوها</div>
          <IntentCloud />
        </div>

        <div className="sd-card p-5">
          <div className="text-[13px] font-semibold mb-4">جست‌وجوهای بدون تطبیق</div>
          <ul>
            {failedMatches.map(f => (
              <li key={f.q}
                className="flex items-center justify-between py-3 border-b last:border-b-0 transition"
                style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                <span className="text-[13px] text-[hsl(var(--sd-ink-2))]">{f.q}</span>
                <span className="sd-chip sd-num shrink-0">{fa(f.count)} بار</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sd-card p-5">
          <div className="text-[13px] font-semibold mb-4">دلایل ترک خرید</div>
          <div className="space-y-3">
            {dropoffs.map(d => {
              const locked = d.pro && !isPro;
              return (
                <div key={d.reason} className={locked ? "opacity-60" : ""}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[13px] flex items-center gap-1.5">
                      {d.reason}
                      {locked && <ProBadge />}
                    </div>
                    <div className="text-[12px] sd-num text-[hsl(var(--sd-muted))]">{faPct(d.pct)}</div>
                  </div>
                  <Meter pct={d.pct} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="sd-card p-5">
          <div className="text-[13px] font-semibold mb-3">پرپیشنهادترین محصولات</div>
          <table className="sd-table" dir="rtl">
            <thead>
              <tr>
                <th>محصول</th>
                <th className="!text-left">پیشنهاد</th>
                <th className="!text-left">کلیک</th>
                <th className="!text-left">CTR</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(p => {
                const ctrColor = p.ctr >= 33 ? "sd-chip-up" : p.ctr >= 30 ? "sd-chip-warn" : "sd-chip";
                return (
                  <tr key={p.name}>
                    <td className="text-[hsl(var(--sd-ink))]">{p.name}</td>
                    <td className="text-left sd-num">{fa(p.recs)}</td>
                    <td className="text-left sd-num">{fa(p.clicks)}</td>
                    <td className="text-left"><span className={`sd-chip sd-num ${ctrColor}`}>{faPct(p.ctr)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
