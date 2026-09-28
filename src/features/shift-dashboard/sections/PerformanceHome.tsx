import { CSSProperties } from "react";
import { ArrowUpLeft, ArrowUpRight, ArrowDownRight, Lock, MessageCircle, Sparkles, SearchX, ShoppingBag, CircleHelp, MoveUpLeft } from "lucide-react";
import { TrendChart } from "../shared/TrendChart";
import { KpiCardSkeleton, TrendChartSkeleton, ListSkeleton } from "../shared/Skeleton";
import { useDashboard } from "../context/DashboardContext";
import { kpis, trends, intents, faToman, faNum, faPct, fa, failedMatches, dropoffs, topProducts } from "../data/mockDashboard";
import { AgentStatusToggle } from "../shared/AgentStatusToggle";
import { PlanTag } from "../shared/PlanTag";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import "../styles/home-bento.css";

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 40}ms` });

const Delta = ({ value }: { value: number }) => {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold ${up ? "hb-up" : "hb-down"}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
      <span className="hb-fig" style={{ fontWeight: 600 }}>{fa(Math.abs(value).toFixed(1))}٪</span>
      <span className="hidden sm:inline font-normal text-[hsl(var(--sd-muted))] mr-1">نسبت به هفته قبل</span>
    </span>
  );
};

export const PerformanceHome = () => {
  const { plan, content, loading, setActiveSection } = useDashboard();
  const isPro = plan === "pro";
  const week = trends["7d"].assistedRevenue;
  const max = Math.max(...week);

  return (
    <div>
      <header className="hb-control-panel flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="hb-title text-[24px] sm:text-[28px] font-semibold leading-tight">مرکز تحلیل داده‌ها</h1>
            <span className="sd-live-dot" aria-hidden />
          </div>
          <p className="text-[13px] text-[hsl(var(--sd-muted))]">عملکرد {content.agentName} در ۷ روز اخیر</p>
        </div>
        <div className="hb-control-cluster">
          <AgentStatusToggle />
          <span className="hb-control-divider" aria-hidden />
          <PlanTag plan={plan} />
          <span className="hb-live-count"><b className="hb-fig">{fa(kpis.customersHelped.liveNow)}</b> گفتگوی زنده</span>
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
          <Card className="hb-tile" style={delay(1)}>
            <span className="hb-label">مشتریان کمک‌گرفته</span>
            <div className="hb-fig text-[30px] mt-2">{faNum(kpis.customersHelped.value)}</div>
            <p className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">{faNum(kpis.customersHelped.firstTimers)} تازه‌وارد · {faNum(kpis.customersHelped.returning)} بازگشتی</p>
            <div className="mt-3"><Delta value={kpis.customersHelped.delta} /></div>
          </Card>

          {/* Clicks */}
          <Card className="hb-tile" style={delay(2)}>
            <span className="hb-label">کلیک روی کارت محصول</span>
            <div className="hb-fig text-[30px] mt-2">{faNum(kpis.productClicks.value)}</div>
            <p className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">از کارت‌های پیشنهادی در گفتگو</p>
            <div className="mt-3"><Delta value={kpis.productClicks.delta} /></div>
          </Card>

          {/* Conversion */}
          <Card className="hb-tile flex flex-col justify-between" style={delay(3)}>
            <span className="hb-label">تبدیل گفتگو به خرید</span>
            <div>
              <div className="hb-fig text-[30px]">{faPct(kpis.conversion.value)}</div>
              <div className="mt-2"><Delta value={kpis.conversion.delta} /></div>
            </div>
          </Card>

          <div className="hb-span-2 lg-span-4" style={{ animation: "hb-rise .5s both", ...delay(4) }}>
            <TrendChart title="درآمد در برابر مشتریان"
              seriesA={{ key: "assistedRevenue", name: "درآمد" }}
              seriesB={{ key: "customersHelped", name: "مشتریان" }}
              formatterA={(n) => faToman(n)} />
          </div>

          <Card className="hb-insight-card hb-span-2 lg-span-2 overflow-hidden" style={delay(5)}>
            <div className="hb-card-heading">
              <div className="flex items-center gap-2.5"><span className="hb-icon-box"><SearchX /></span><div><h2>جست‌وجوهای بدون نتیجه</h2><p>فرصت‌های از دست‌رفته این هفته</p></div></div>
              <Badge variant="outline" className="hb-attention-badge">نیاز به توجه</Badge>
            </div>
            <Table className="hb-table">
              <TableHeader><TableRow><TableHead>عبارت جست‌وجو</TableHead><TableHead>تکرار</TableHead><TableHead className="text-left">شدت تقاضا</TableHead></TableRow></TableHeader>
              <TableBody>{failedMatches.map((f, i) => (
                <TableRow key={f.q}>
                  <TableCell className="font-medium"><span className="hb-rank">{fa(i + 1)}</span>{f.q}</TableCell>
                  <TableCell className="hb-fig">{fa(f.count)} بار</TableCell>
                  <TableCell><div className="hb-demand"><span style={{ width: `${Math.max(28, (f.count / failedMatches[0].count) * 100)}%` }} /></div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </Card>

          <Card className="hb-insight-card hb-span-2 lg-span-2" style={delay(6)}>
            <div className="hb-card-heading">
              <div className="flex items-center gap-2.5"><span className="hb-icon-box"><ShoppingBag /></span><div><h2>دلایل ترک سبد</h2><p>از گفتگوهای تکمیل‌نشده</p></div></div>
              <Badge variant="outline" className="hb-neutral-badge">تحلیل هوشمند</Badge>
            </div>
            <div className="hb-reasons">
              {dropoffs.map((d, i) => {
                const locked = d.pro && !isPro;
                return (
                  <div key={d.reason} className="hb-reason-row">
                    <div className="flex items-center justify-between mb-2 text-[12.5px]">
                      <span className="flex items-center gap-1.5 text-[hsl(var(--sd-ink-2))]">
                        {d.reason}{locked && <Lock className="w-3 h-3 text-[hsl(var(--sd-muted))]" />}
                      </span>
                      <span className="hb-fig text-[12.5px]" style={locked ? { filter: "blur(5px)", userSelect: "none" } : undefined}>{faPct(d.pct)}</span>
                    </div>
                    <div className="hb-bar" style={locked ? { filter: "blur(3px)" } : undefined}>
                      <span className={i === 0 ? "signal" : ""} style={{ width: `${Math.min(100, d.pct * 2.2)}%`, animationDelay: `${300 + i * 60}ms` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="hb-question-banner hb-span-2 lg-span-4" style={delay(7)}>
            <div className="hb-question-visual" aria-hidden><CircleHelp /><span className="hb-question-orbit" /><span className="hb-question-orbit small" /></div>
            <div className="hb-question-copy">
              <span className="hb-question-kicker">هوش مشتری</span>
              <h2>{isPro ? "از مشتری‌هایت بپرس" : "جواب مشتری‌ها را ببین"}</h2>
              <p>{isPro ? "دلیل تردید، سوال‌های پرتکرار و چیزی که مانع خرید شده را مستقیم از گفتگوها پیدا کن." : "با Shift Pro دلیل واقعی ترک خرید و سوال‌های پرتکرار مشتری‌ها را کشف کن."}</p>
            </div>
            <Button className="hb-question-action" onClick={() => setActiveSection?.(isPro ? "intelligence" : "billing")}>
              {isPro ? <Sparkles /> : <Lock />}{isPro ? "شروع تحلیل" : "مشاهده Pro"}<MoveUpLeft />
            </Button>
          </Card>

          {/* Top products */}
          <section className="hb-tile hb-span-2 lg-span-2" style={delay(8)}>
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
          <section className="hb-tile hb-span-2 lg-span-4" style={delay(9)}>
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
