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
import { formatToman, toPersianDigits } from "../data/mockVendor";

interface Props {
  data: number[];
  labels?: string[];
  height?: number;
}

export const RevenueSparkChart = ({ data, labels, height = 140 }: Props) => {
  const series = data.map((v, i) => ({
    label: labels?.[i] ?? toPersianDigits(i + 1),
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
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--vd-stroke))"
          />
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
            cursor={{ stroke: "hsl(var(--vd-accent))", strokeWidth: 1, strokeOpacity: 0.4 }}
            contentStyle={{
              background: "hsl(var(--vd-surface))",
              border: "1px solid hsl(var(--vd-stroke))",
              borderRadius: 12,
              fontSize: 11,
              padding: "6px 10px",
              direction: "rtl",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}
            formatter={(v: number) => [formatToman(v * 1000), ""]}
            labelFormatter={(l: string) => l}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="none"
            fill="url(#vd-spark)"
            isAnimationActive={false}
          />
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
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
