import { useState, useMemo } from "react";
import {
  Area, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { trends, fa, faNum } from "../data/mockDashboard";
import { DeltaChip } from "./DeltaChip";

type Tf = "7d" | "30d" | "1y";
const tfLabels: Record<Tf, string> = { "7d": "۷ روز", "30d": "۳۰ روز", "1y": "۱ سال" };

interface Props {
  title: string;
  seriesA: { key: keyof typeof trends["7d"]; name: string };
  seriesB: { key: keyof typeof trends["7d"]; name: string };
  formatterA?: (n: number) => string;
  formatterB?: (n: number) => string;
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
const pctDelta = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const half = Math.floor(arr.length / 2);
  const prev = avg(arr.slice(0, half));
  const cur = avg(arr.slice(half));
  if (!prev) return 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
};

export const TrendChart = ({ title, seriesA, seriesB, formatterA = faNum, formatterB = faNum }: Props) => {
  const [tf, setTf] = useState<Tf>("7d");
  const t = trends[tf];

  const { data, headlineValue, headlineDelta, secondaryValue } = useMemo(() => {
    const arrA = t[seriesA.key] as number[];
    const arrB = t[seriesB.key] as number[];
    const data = (t.labels as string[]).map((label, i) => ({ label, a: arrA[i], b: arrB[i] }));
    const headlineValue = seriesA.key === "conversion" ? avg(arrA) : sum(arrA);
    const secondaryValue = seriesB.key === "conversion" ? avg(arrB) : sum(arrB);
    return { data, headlineValue, headlineDelta: pctDelta(arrA), secondaryValue };
  }, [t, seriesA.key, seriesB.key]);

  const gidA = `sd-grad-a-${seriesA.key}-${seriesB.key}`;
  const gidB = `sd-grad-b-${seriesA.key}-${seriesB.key}`;

  return (
    <div className="sd-card sd-anim-in p-4 sm:p-5">
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 pb-4 mb-4 border-b flex-wrap"
        style={{ borderColor: "hsl(var(--sd-stroke))" }}
      >
        <h3 className="text-[13.5px] font-semibold leading-tight">{title}</h3>
        <div className="sd-seg" role="tablist" aria-label="بازه زمانی">
          {(["7d", "30d", "1y"] as Tf[]).map(k => (
            <button key={k} role="tab" aria-selected={tf === k}
              className={tf === k ? "active" : ""} onClick={() => setTf(k)}>
              {tfLabels[k]}
            </button>
          ))}
        </div>
      </div>


      {/* Metric ribbon — two side-by-side metrics with clear separation */}
      <div className="flex items-stretch gap-5 mb-5">
        {/* Metric A (primary) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--sd-primary))" }} />
            <span className="text-[11px] text-[hsl(var(--sd-muted))]">{seriesA.name}</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-[22px] font-bold sd-num leading-none text-[hsl(var(--sd-ink))]">{formatterA(headlineValue)}</div>
            <DeltaChip value={headlineDelta} />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch" style={{ background: "hsl(var(--sd-stroke))" }} />

        {/* Metric B (secondary) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--sd-ink-2) / .55)" }} />
            <span className="text-[11px] text-[hsl(var(--sd-muted))]">{seriesB.name}</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-[22px] font-bold sd-num leading-none text-[hsl(var(--sd-ink-2))]">{formatterB(secondaryValue)}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 220, direction: "ltr" }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={gidA} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--sd-primary))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--sd-primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={gidB} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--sd-ink-2))" stopOpacity={0.14} />
                <stop offset="100%" stopColor="hsl(var(--sd-ink-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--sd-stroke))" strokeOpacity={0.9} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--sd-muted))" }}
              tickMargin={10}
              padding={{ left: 10, right: 10 }}
              minTickGap={12}
            />
            <YAxis
              yAxisId="left"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--sd-muted))" }}
              width={48}
              tickFormatter={(v) => faNum(v)}
            />
            <YAxis yAxisId="right" hide />
            <Tooltip
              cursor={{ stroke: "hsl(var(--sd-primary))", strokeWidth: 2, strokeDasharray: "3 3", strokeOpacity: .5 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const pA = payload.find(p => p.dataKey === "a");
                const pB = payload.find(p => p.dataKey === "b");
                return (
                  <div dir="rtl" className="sd-card p-3 text-[12px]"
                    style={{ boxShadow: "0 8px 30px hsl(var(--sd-ink) / .10)" }}>
                    <div className="text-[10px] text-[hsl(var(--sd-muted))] mb-2">{fa(String(label))}</div>
                    {pA && (
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: "hsl(var(--sd-primary))" }} />
                          <span className="text-[hsl(var(--sd-muted))]">{seriesA.name}</span>
                        </div>
                        <span className="sd-num font-semibold">{formatterA(Number(pA.value))}</span>
                      </div>
                    )}
                    {pB && (
                      <div className="flex items-center justify-between gap-6 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: "hsl(var(--sd-ink-2) / .55)" }} />
                          <span className="text-[hsl(var(--sd-muted))]">{seriesB.name}</span>
                        </div>
                        <span className="sd-num font-semibold">{formatterB(Number(pB.value))}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="b"
              stroke="hsl(var(--sd-ink-2))"
              strokeOpacity={0.55}
              strokeWidth={1.5}
              fill={`url(#${gidB})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--sd-surface))" }}
              animationDuration={420}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="a"
              stroke="hsl(var(--sd-primary))"
              strokeWidth={2.25}
              strokeLinecap="round"
              fill={`url(#${gidA})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--sd-surface))" }}
              animationDuration={420}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
