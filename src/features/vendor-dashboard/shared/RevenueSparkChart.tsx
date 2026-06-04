import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatToman } from "../data/mockVendor";

interface Props {
  data: number[];
  height?: number;
}

export const RevenueSparkChart = ({ data, height = 80 }: Props) => {
  const series = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width: "100%", height, direction: "ltr" }}>
      <ResponsiveContainer>
        <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vd-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--vd-accent))" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(var(--vd-accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: "hsl(var(--vd-accent))", strokeWidth: 1, strokeOpacity: 0.4 }}
            contentStyle={{
              background: "hsl(var(--vd-surface))",
              border: "1px solid hsl(var(--vd-stroke))",
              borderRadius: 12,
              fontSize: 11,
              padding: "4px 8px",
            }}
            labelFormatter={() => ""}
            formatter={(v: number) => [formatToman(v * 1000), ""]}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="hsl(var(--vd-accent))"
            strokeWidth={2}
            fill="url(#vd-spark)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
