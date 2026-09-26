import { CSSProperties } from "react";
import { ArrowUpLeft, ArrowUpRight, ArrowDownRight, Lock, MessageCircle, Sparkles } from "lucide-react";
import { TrendChart } from "../shared/TrendChart";
import { KpiCardSkeleton, TrendChartSkeleton, ListSkeleton } from "../shared/Skeleton";
import { useDashboard } from "../context/DashboardContext";
import { kpis, trends, intents, faToman, faNum, faPct, fa, failedMatches, dropoffs, topProducts } from "../data/mockDashboard";
import "../styles/home-bento.css";

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 40}ms` });

const Delta = ({ value }: { value: number }) => {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold ${up ? "hb-up" : "hb-down"}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
      <span className="hb-fig" style={{ fontWeight: 600 }}>{fa(Math.abs(value).toFixed(1))}٪</span>
      <span className="font-normal text-[hsl(var(--sd-muted))] mr-1">نسبت به هفته قبل</span>
    </span>
  );
};

export const PerformanceHome = () => {
  const { plan, content, loading, setActiveSection } = useDashboard() as ReturnType<typeof useDashboard> & { setActiveSection: (s: string) => void };
  const isPro = plan === "pro";
  const week = trends["7d"].assistedRevenue;
  const max = Math.max(...week);

  return (
    <div>
      {/* Header */}
      <header className="flex items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="hb-title text-[24px] sm:text-[28px] font-semibold tracking-tight leading-tight">داشبورد</h1>
          <p className="text-[13px] text-[hsl(var(--sd-muted))] mt-1 truncate">{content.agentName} · ۷ روز اخیر</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] shrink-0"
          style={{ borderColor: "hsl(var(--sd-stroke))", background: "hsl(var(--sd-surface))" }}>
          <span className="sd-live-dot" /> <span className="hb-fig" style={{ fontWeight: 500 }}>{fa(kpis.customersHelped.liveNow)}</span> گفتگوی زنده
        </div>
      </header>

      {loading ? (
        <div className="hb-grid">
          <div className="hb-span-2 lg-span-2"><KpiCardSkeleton /></div>
          <KpiCardSkeleton /><KpiCardSkeleton />
          <div className="hb-span-2 lg-span-4"><TrendChartSkeleton /></div>
          <div className="hb-span-2 lg-span-4"><ListSkeleton rows={4} /></div>
        </div>
      ) : (
        <div className="hb-grid">
          {/* Hero: assisted revenue */}
          <section className="hb-tile hb-span-2 hb-hero flex flex-col justify-between gap-6" style={delay(0)}>
            <div>
              <span className="hb-label">درآمد مساعدت‌شده توسط دستیار</span>
              <div className="flex items-baseline gap-2 mt-3 flex-wrap">
                <span className="hb-fig text-[40px] sm:text-[52px]">{faNum(kpis.assistedRevenue.value)}</span>
                <span className="text-[14px] text-[hsl(var(--sd-muted))]">تومان</span>
              </div>
              <div className="mt-2"><Delta value={kpis.assistedRevenue.delta} /></div>
            </div>
            <div>
              <div className="hb-spark" aria-hidden>
                {week.map((v, i) => (
                  <span key={i} className={i === week.length - 1 ? "last" : ""} style={{ height: `${Math.max(12, (v / max) * 100)}%`, animationDelay: `${120 + i * 40}ms` }} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-[hsl(var(--sd-muted))]">
                {trends["7d"].labels.map(l => <span key={l} className="flex-1 text-center">{l}</span>)}
              </div>
            </div>
          </section>

          {/* Customers */}
          <section className="hb-tile" style={delay(1)}>
            <span className="hb-label">مشتریان کمک‌گرفته</span>
            <div className="hb-fig text-[30px] mt-2">{faNum(kpis.customersHelped.value)}</div>
            <p className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">{faNum(kpis.customersHelped.firstTimers)} تازه‌وارد · {faNum(kpis.customersHelped.returning)} بازگشتی</p>
            <div className="mt-3"><Delta value={kpis.customersHelped.delta} /></div>
          </section>

          {/* Clicks */}
          <section className="hb-tile" style={delay(2)}>
            <span className="hb-label">کلیک روی کارت محصول</span>
            <div className="hb-fig text-[30px] mt-2">{faNum(kpis.productClicks.value)}</div>
            <p className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">از کارت‌های پیشنهادی در گفتگو</p>
            <div className="mt-3"><Delta value={kpis.productClicks.delta} /></div>
          </section>

          {/* Conversion */}
          <section className="hb-tile flex flex-col justify-between aspect-square lg:aspect-auto" style={delay(3)}>
            <span className="hb-label">تبدیل گفتگو به خرید</span>
            <div>
              <div className="hb-fig text-[30px]">{faPct(kpis.conversion.value)}</div>
              <div className="mt-2"><Delta value={kpis.conversion.delta} /></div>
            </div>
          </section>

          {/* Ink tile: plan */}
          <section className="hb-tile hb-tile-ink flex flex-col justify-between aspect-square lg:aspect-auto" style={delay(4)}>
            <span className="hb-label">پلن فعلی</span>
            <div>
              <div className="hb-fig text-[26px]" style={{ unicodeBidi: "plaintext" }}>Shift {isPro ? "Pro" : "Lite"}</div>
              <p className="text-[11.5px] mt-1" style={{ color: "hsl(var(--sd-surface) / .6)" }}>{isPro ? "همه گزارش‌ها باز است" : "گزارش‌های پایه"}</p>
            </div>
          </section>

          {/* Signal action */}
          <button type="button" className="hb-tile hb-tile-signal hb-span-2 lg-span-2" style={delay(5)}
            onClick={() => setActiveSection?.(isPro ? "intelligence" : "billing")}>
            <div>
              <h3 className="hb-title text-[17px] font-semibold flex items-center gap-2">
                {isPro ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isPro ? "از مشتری‌هایت بپرس" : "ارتقا به Shift Pro"}
              </h3>
              <p className="text-[12px] mt-1" style={{ color: "hsl(var(--sd-surface) / .85)" }}>
                {isPro ? "تحلیل گفتگوها و بازار را از دستیار هوش مشتری بخواه" : "قیف پرداخت و همه دلایل ترک سبد را ببین"}
              </p>
            </div>
            <ArrowUpLeft className="w-6 h-6 shrink-0" strokeWidth={1.75} />
          </button>

          {/* Alert: no-match searches */}
          <section className="hb-tile hb-span-2 lg-span-2" style={delay(6)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold">جست‌وجوهای بدون نتیجه</span>
              <span className="hb-tag">نیاز به محصول</span>
            </div>
            {failedMatches.map(f => (
              <div key={f.q} className="hb-row">
                <span className="truncate text-[hsl(var(--sd-ink-2))]">{f.q}</span>
                <span className="hb-fig text-[13px] shrink-0">{fa(f.count)} بار</span>
              </div>
            ))}
          </section>

          {/* Chart */}
          <div className="hb-span-2 lg-span-4" style={{ animation: "hb-rise .5s both", ...delay(7) }}>
            <TrendChart title="درآمد در برابر مشتریان"
              seriesA={{ key: "assistedRevenue", name: "درآمد" }}
              seriesB={{ key: "customersHelped", name: "مشتریان" }}
              formatterA={(n) => faToman(n)} />
          </div>

          {/* Dropoffs */}
          <section className="hb-tile hb-span-2 lg-span-2" style={delay(8)}>
            <span className="text-[13px] font-semibold">دلایل ترک سبد</span>
            <div className="space-y-3.5 mt-4">
              {dropoffs.map((d, i) => {
                const locked = d.pro && !isPro;
                return (
                  <div key={d.reason}>
                    <div className="flex items-center justify-between mb-1.5 text-[12.5px]">
                      <span className="flex items-center gap-1.5 text-[hsl(var(--sd-ink-2))]">
                        {d.reason}{locked && <Lock className="w-3 h-3 text-[hsl(var(--sd-muted))]" />}
                      </span>
                      <span className="hb-fig text-[12.5px]" style={locked ? { filter: "blur(5px)", userSelect: "none" } : undefined}>{faPct(d.pct)}</span>
                    </div>
                    <div className="hb-bar" style={locked ? { filter: "blur(3px)" } : undefined}>
                      <span className={i === 0 ? "signal" : ""} style={{ width: `${d.pct * 2}%`, animationDelay: `${300 + i * 60}ms` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Top products */}
          <section className="hb-tile hb-span-2 lg-span-2" style={delay(9)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold">پرپیشنهادترین محصولات</span>
              <span className="text-[11px] text-[hsl(var(--sd-muted))]">نرخ کلیک</span>
            </div>
            {topProducts.map(p => (
              <div key={p.name} className="hb-row">
                <span className="truncate text-[hsl(var(--sd-ink-2))]">{p.name}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[hsl(var(--sd-muted))]">{fa(p.recs)} پیشنهاد</span>
                  <span className="hb-fig text-[13px]">{faPct(p.ctr)}</span>
                </span>
              </div>
            ))}
          </section>

          {/* Intents */}
          <section className="hb-tile hb-span-2 lg-span-4" style={delay(10)}>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-[hsl(var(--sd-muted))]" />
              <span className="text-[13px] font-semibold">مشتری‌ها بیشتر دنبال چی بودن</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {intents.map(t => (
                <span key={t.label} className="hb-chip">{t.label} <b className="hb-fig">{fa(t.weight)}</b></span>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
