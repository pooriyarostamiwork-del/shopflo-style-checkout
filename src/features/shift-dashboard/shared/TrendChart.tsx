import { useState } from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { trends, fa, faNum } from "../data/mockDashboard";

type Tf = "7d" | "30d" | "1y";
const tfLabels: Record<Tf, string> = { "7d": "۷ روز", "30d": "۳۰ روز", "1y": "۱ سال" };

interface Props {
  title: string;
  seriesA: { key: keyof typeof trends["7d"]; name: string };
  seriesB: { key: keyof typeof trends["7d"]; name: string };
  formatterA?: (n: number) => string;
  formatterB?: (n: number) => string;
}

export const TrendChart = ({ title, seriesA, seriesB, formatterA = faNum, formatterB = faNum }: Props) => {
  const [tf, setTf] = useState<Tf>("7d");
  const t = trends[tf];
  const data = (t.labels as string[]).map((label, i) => ({
    label,
    a: (t[seriesA.key] as number[])[i],
    b: (t[seriesB.key] as number[])[i],
  }));
  return (
    <div className="sd-card sd-anim-in p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(var(--sd-surface-2))" }}>
          {(["7d","30d","1y"] as Tf[]).map(k => (
            <button key={k} className={`sd-tab ${tf === k ? "active" : ""}`} onClick={() => setTf(k)}>
              {tfLabels[k]}
            </button>
          ))}
        </div>
      </div>
      <div style={{ width: "100%", height: 220, direction: "ltr" }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 12, left: 12, bottom: 6 }}>
            <defs>
              <linearGradient id={`sd-a-${seriesA.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--sd-primary))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--sd-primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--sd-stroke))" strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} reversed tick={{ fontSize: 10 }} />
            <YAxis hide yAxisId="left" />
            <YAxis hide yAxisId="right" orientation="right" />
            <Tooltip
              cursor={{ stroke: "hsl(var(--sd-primary))", strokeDasharray: "3 3", strokeOpacity: .4 }}
              contentStyle={{ direction: "rtl", borderRadius: 12, border: "1px solid hsl(var(--sd-stroke))", fontSize: 12 }}
              formatter={(v: number, name: string) => {
                if (name === seriesA.name) return [formatterA(v), name];
                return [formatterB(v), name];
              }}
              labelFormatter={(l) => fa(String(l))}
            />
            <Legend
              verticalAlign="top" align="right" height={24} iconType="circle"
              wrapperStyle={{ fontSize: 11, direction: "rtl", paddingBottom: 8 }}
            />
            <Area yAxisId="left" type="monotone" dataKey="a" name={seriesA.name} stroke="hsl(var(--sd-primary))" strokeWidth={2}
              fill={`url(#sd-a-${seriesA.key})`} isAnimationActive={false}
              dot={{ r: 2.5, fill: "hsl(var(--sd-primary))" }} activeDot={{ r: 5 }} />
            <Line yAxisId="right" type="monotone" dataKey="b" name={seriesB.name} stroke="hsl(var(--sd-ink))" strokeWidth={2}
              strokeDasharray="4 3" dot={{ r: 2.5, fill: "hsl(var(--sd-ink))" }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
