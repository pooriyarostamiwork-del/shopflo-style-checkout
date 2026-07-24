import { useState, useMemo } from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot,
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

  const { data, peakIdx, troughIdx, headlineValue, headlineDelta, secondaryValue } = useMemo(() => {
    const arrA = t[seriesA.key] as number[];
    const arrB = t[seriesB.key] as number[];
    const data = (t.labels as string[]).map((label, i) => ({ label, a: arrA[i], b: arrB[i] }));
    let peakIdx = 0, troughIdx = 0;
    arrA.forEach((v, i) => {
      if (v > arrA[peakIdx]) peakIdx = i;
      if (v < arrA[troughIdx]) troughIdx = i;
    });
    const headlineValue = seriesA.key === "conversion" ? avg(arrA) : sum(arrA);
    const secondaryValue = seriesB.key === "conversion" ? avg(arrB) : sum(arrB);
    return { data, peakIdx, troughIdx, headlineValue, headlineDelta: pctDelta(arrA), secondaryValue };
  }, [t, seriesA.key, seriesB.key]);

  const gid = `sd-grad-${seriesA.key}-${seriesB.key}`;

  return (
    <div className="sd-card sd-anim-in p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <div className="sd-eyebrow text-[10px]">روند</div>
          <h3 className="text-[15px] font-semibold mt-1 leading-tight">{title}</h3>
        </div>
        <div className="sd-seg" role="tablist" aria-label="بازه زمانی">
          {(["7d", "30d", "1y"] as Tf[]).map(k => (
            <button
              key={k}
              role="tab"
              aria-selected={tf === k}
              className={tf === k ? "active" : ""}
              onClick={() => setTf(k)}
            >
              {tfLabels[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Metric ribbon */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4 pb-4 border-b" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--sd-primary))" }} />
            <span className="text-[11px] text-[hsl(var(--sd-muted))]">{seriesA.name}</span>
          </div>
          <div className="text-[24px] font-bold sd-num leading-none">{formatterA(headlineValue)}</div>
          <DeltaChip value={headlineDelta} />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "hsl(var(--sd-ink-2))" }} />
          <span className="text-[11px] text-[hsl(var(--sd-muted))]">{seriesB.name}</span>
          <span className="text-[13px] sd-num text-[hsl(var(--sd-ink-2))]">{formatterB(secondaryValue)}</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 200, direction: "ltr" }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 14, right: 8, left: 8, bottom: 4 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--sd-primary))" stopOpacity={0.22} />
                <stop offset="100%" stopColor="hsl(var(--sd-primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--sd-stroke))" strokeDasharray="0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              reversed
              tick={{ fontSize: 10 }}
              minTickGap={16}
            />
            <YAxis
              yAxisId="left"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              width={44}
              tickFormatter={(v) => faNum(v)}
            />
            <YAxis yAxisId="right" hide />
            <Tooltip
              cursor={{ stroke: "hsl(var(--sd-primary))", strokeDasharray: "3 3", strokeOpacity: .45 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const pA = payload.find(p => p.dataKey === "a");
                const pB = payload.find(p => p.dataKey === "b");
                return (
                  <div dir="rtl" className="sd-card p-3 text-[12px]" style={{ boxShadow: "0 8px 30px hsl(var(--sd-ink) / .08)" }}>
                    <div className="text-[10px] text-[hsl(var(--sd-muted))] mb-1.5">{fa(String(label))}</div>
                    {pA && (
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--sd-primary))" }} />
                          <span className="text-[hsl(var(--sd-muted))]">{seriesA.name}</span>
                        </div>
                        <span className="sd-num font-semibold">{formatterA(Number(pA.value))}</span>
                      </div>
                    )}
                    {pB && (
                      <div className="flex items-center justify-between gap-6 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full opacity-60" style={{ background: "hsl(var(--sd-ink-2))" }} />
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
              yAxisId="left"
              type="monotone"
              dataKey="a"
              name={seriesA.name}
              stroke="hsl(var(--sd-primary))"
              strokeWidth={2}
              strokeLinecap="round"
              fill={`url(#${gid})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--sd-surface))" }}
              animationDuration={400}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="b"
              name={seriesB.name}
              stroke="hsl(var(--sd-ink-2))"
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--sd-surface))" }}
              animationDuration={400}
            />
            <ReferenceDot yAxisId="left" x={data[peakIdx]?.label} y={data[peakIdx]?.a}
              r={4} fill="hsl(var(--sd-primary))" stroke="hsl(var(--sd-surface))" strokeWidth={2} />
            <ReferenceDot yAxisId="left" x={data[troughIdx]?.label} y={data[troughIdx]?.a}
              r={3.5} fill="hsl(var(--sd-ink))" stroke="hsl(var(--sd-surface))" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
