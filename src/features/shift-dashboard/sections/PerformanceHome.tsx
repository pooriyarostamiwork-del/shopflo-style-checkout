import { useMemo, useState } from "react";
import { KpiCard } from "../shared/KpiCard";
import { TrendChart } from "../shared/TrendChart";
import { IntentCloud } from "../shared/IntentCloud";
import { MissingChip } from "../shared/MissingChip";
import { ProBadge } from "../shared/ProLock";
import { SectionHeader } from "../shared/SectionHeader";
import { KpiCardSkeleton, TrendChartSkeleton, ListSkeleton, MeterListSkeleton, IntentCloudSkeleton, TableSkeleton } from "../shared/Skeleton";
import { useDashboard } from "../context/DashboardContext";
import { kpis, faToman, faNum, faPct, fa, failedMatches, dropoffs, topProducts } from "../data/mockDashboard";
import { Wallet, Users, MousePointerClick, TrendingUp, ArrowUp, ArrowDown, Lock } from "lucide-react";

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

type SortDir = "asc" | "desc";
type ProductKey = "recs" | "clicks" | "ctr";

const SortableTh = ({
  label, active, dir, onClick, align = "right",
}: { label: string; active: boolean; dir: SortDir; onClick: () => void; align?: "right" | "left" }) => (
  <th className={align === "left" ? "!text-left" : ""}>
    <button
      type="button"
      onClick={onClick}
      className="sd-th-sort"
      data-active={active || undefined}
    >
      <span>{label}</span>
      {active && (dir === "asc" ? <ArrowUp className="w-3 h-3" strokeWidth={2.25} /> : <ArrowDown className="w-3 h-3" strokeWidth={2.25} />)}
    </button>
  </th>
);

const TableCardHeader = ({
  title, subtitle, count,
}: { title: string; subtitle?: string; count: number }) => (
  <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-[13.5px] font-semibold">{title}</h3>
        <span className="sd-count-pill sd-num">{fa(count)}</span>
      </div>
      {subtitle && <p className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">{subtitle}</p>}
    </div>
  </div>
);

export const PerformanceHome = () => {
  const { plan, content, loading } = useDashboard();
  const isPro = plan === "pro";

  // Top products sort
  const [sortKey, setSortKey] = useState<ProductKey>("recs");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const sortedProducts = useMemo(() => {
    const arr = [...topProducts];
    arr.sort((a, b) => {
      const d = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? d : -d;
    });
    return arr;
  }, [sortKey, sortDir]);
  const toggleSort = (k: ProductKey) => {
    if (k === sortKey) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {loading ? (
          <><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /></>
        ) : (
          <>
            <KpiCard hero label="درآمد مساعدت‌شده" value={faNum(kpis.assistedRevenue.value)} unit="تومان" delta={kpis.assistedRevenue.delta}
              icon={<Wallet className="w-5 h-5" strokeWidth={1.75} />} />
            <KpiCard label="مشتریان کمک‌گرفته" value={faNum(kpis.customersHelped.value)}
              sub={`${faNum(kpis.customersHelped.firstTimers)} تازه‌وارد · ${faNum(kpis.customersHelped.returning)} بازگشتی`}
              delta={kpis.customersHelped.delta} live icon={<Users className="w-5 h-5" strokeWidth={1.75} />} />
            <KpiCard label="کلیک روی کارت محصول" value={faNum(kpis.productClicks.value)} delta={kpis.productClicks.delta}
              icon={<MousePointerClick className="w-5 h-5" strokeWidth={1.75} />} />
            <KpiCard label="نرخ تبدیل گفت‌وگو به خرید" value={faPct(kpis.conversion.value)} delta={kpis.conversion.delta}
              icon={<TrendingUp className="w-5 h-5" strokeWidth={1.75} />} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {loading ? (<><TrendChartSkeleton /><TrendChartSkeleton /></>) : (
          <>
            <TrendChart title="درآمد در برابر مشتریان"
              seriesA={{ key: "assistedRevenue", name: "درآمد" }}
              seriesB={{ key: "customersHelped", name: "مشتریان" }}
              formatterA={(n) => faToman(n)} />
            <TrendChart title="مشتریان در برابر نرخ تبدیل"
              seriesA={{ key: "customersHelped", name: "مشتریان" }}
              seriesB={{ key: "conversion", name: "نرخ تبدیل" }}
              formatterB={(n) => faPct(n)} />
          </>
        )}
      </div>

      {/* Signals */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="sd-eyebrow shrink-0">سیگنال‌ها</h2>
        <span className="h-px flex-1" style={{ background: "hsl(var(--sd-stroke))" }} />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Intent tags */}
        <div className="sd-card p-4 sm:p-5">
          <TableCardHeader title="پرتکرارترین نیت‌ها و جست‌وجوها" subtitle="نیت‌های استخراج‌شده از گفتگو‌های ۷ روز اخیر" count={loading ? 0 : 10} />
          {loading ? <IntentCloudSkeleton /> : <IntentCloud />}
        </div>

        {/* Failed matches — proper table */}
        <div className="sd-card p-4 sm:p-5">
          <TableCardHeader title="جست‌وجوهای بدون تطبیق" subtitle="عبارت‌هایی که مشتری خواست اما محصولی برایش پیدا نشد" count={loading ? 0 : failedMatches.length} />
          {loading ? <ListSkeleton rows={5} /> : (
            <div className="sd-table-wrap">
              <table className="sd-table sd-table-tight" dir="rtl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>عبارت جست‌وجو</th>
                    <th className="!text-left">تکرار</th>
                  </tr>
                </thead>
                <tbody>
                  {failedMatches.map((f, idx) => (
                    <tr key={f.q}>
                      <td>
                        <span className="sd-rank sd-num">{fa(idx + 1)}</span>
                      </td>
                      <td className="text-[13px] text-[hsl(var(--sd-ink))]">{f.q}</td>
                      <td className="text-left">
                        <span className="sd-badge-group sd-badge-inline" data-tone="neutral">
                          <span className="sd-badge-dot" aria-hidden />
                          <span className="sd-num">{fa(f.count)}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dropoffs */}
        <div className="sd-card p-4 sm:p-5">
          <TableCardHeader title="دلایل ترک خرید" subtitle="سهم هر دلیل از رهاسازی سبد در ۷ روز اخیر" count={loading ? 0 : dropoffs.length} />
          {loading ? <MeterListSkeleton rows={4} /> : (
            <div className="space-y-3.5">
              {dropoffs.map(d => {
                const locked = d.pro && !isPro;
                return (
                  <div key={d.reason}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="text-[13px] flex items-center gap-2 min-w-0">
                        <span className="truncate text-[hsl(var(--sd-ink))]">{d.reason}</span>
                        {locked && (
                          <span className="sd-badge-group sd-badge-inline" data-tone="brand">
                            <span className="sd-badge-dot" aria-hidden />
                            <Lock className="w-2.5 h-2.5" />
                            <span>Pro</span>
                          </span>
                        )}
                      </div>
                      <div
                        className="text-[12px] sd-num text-[hsl(var(--sd-muted))] shrink-0"
                        style={locked ? { filter: "blur(5px)", userSelect: "none" } : undefined}
                        aria-hidden={locked || undefined}
                      >
                        {faPct(d.pct)}
                      </div>
                    </div>
                    <div style={locked ? { filter: "blur(4px)", opacity: 0.75 } : undefined}>
                      <Meter pct={d.pct} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top products — sortable table */}
        <div className="sd-card p-4 sm:p-5">
          <TableCardHeader title="پرپیشنهادترین محصولات" subtitle="محصولاتی که بیشترین پیشنهاد و کلیک را داشته‌اند" count={loading ? 0 : topProducts.length} />
          {loading ? <TableSkeleton rows={5} cols={4} /> : (
            <div className="sd-table-wrap">
              <table className="sd-table" dir="rtl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>محصول</th>
                    <SortableTh label="پیشنهاد" active={sortKey === "recs"} dir={sortDir} onClick={() => toggleSort("recs")} align="left" />
                    <SortableTh label="کلیک" active={sortKey === "clicks"} dir={sortDir} onClick={() => toggleSort("clicks")} align="left" />
                    <SortableTh label="CTR" active={sortKey === "ctr"} dir={sortDir} onClick={() => toggleSort("ctr")} align="left" />
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p, idx) => {
                    const tone = p.ctr >= 33 ? "success" : p.ctr >= 30 ? "warn" : "neutral";
                    return (
                      <tr key={p.name}>
                        <td>
                          <span className="sd-rank sd-num">{fa(idx + 1)}</span>
                        </td>
                        <td className="text-[hsl(var(--sd-ink))]">{p.name}</td>
                        <td className="text-left sd-num text-[hsl(var(--sd-ink-2))]">{fa(p.recs)}</td>
                        <td className="text-left sd-num text-[hsl(var(--sd-ink-2))]">{fa(p.clicks)}</td>
                        <td className="text-left">
                          <span className="sd-badge-group sd-badge-inline" data-tone={tone}>
                            <span className="sd-badge-dot" aria-hidden />
                            <span className="sd-num">{faPct(p.ctr)}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
