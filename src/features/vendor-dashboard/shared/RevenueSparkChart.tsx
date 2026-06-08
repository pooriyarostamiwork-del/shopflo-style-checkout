import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatToman } from "../data/mockVendor";

interface Props {
  data: number[];
  labels?: string[];
  height?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      dir="rtl"
      className="rounded-xl bg-[hsl(var(--vd-surface-ink))] text-white border border-white/10 shadow-md px-3 py-2 text-xs"
      style={{ minWidth: 120 }}
    >
      <div className="flex items-center gap-1.5 text-white/70 text-[11px]">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: "hsl(var(--vd-accent))" }}
        />
        {p.payload.label}
      </div>
      <div className="mt-1 font-semibold vd-num text-white">
        {formatToman(p.value * 1000)}
      </div>
    </div>
  );
};

export const RevenueSparkChart = ({ data, labels, height = 140 }: Props) => {
  const series = data.map((v, i) => ({
    label: labels?.[i] ?? `${i + 1}`,
    v,
  }));
  return (
    <div style={{ width: "100%", height, direction: "ltr" }}>
      <ResponsiveContainer>
        <ComposedChart data={series} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="vd-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--vd-accent))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--vd-accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--vd-stroke))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={8}
            reversed
          />
          <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
          <Tooltip
            cursor={{
              stroke: "hsl(var(--vd-accent))",
              strokeWidth: 1,
              strokeDasharray: "4 4",
              strokeOpacity: 0.5,
            }}
            content={<CustomTooltip />}
            isAnimationActive={false}
          />
          <Area type="monotone" dataKey="v" stroke="none" fill="url(#vd-spark)" isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="v"
            stroke="hsl(var(--vd-accent))"
            strokeWidth={2}
            dot={{
              r: 3,
              fill: "hsl(var(--vd-accent))",
              stroke: "hsl(var(--vd-surface))",
              strokeWidth: 1.5,
            }}
            activeDot={{ r: 6, fill: "hsl(var(--vd-accent))", stroke: "#fff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
