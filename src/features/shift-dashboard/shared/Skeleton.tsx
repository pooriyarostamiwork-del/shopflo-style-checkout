import { CSSProperties } from "react";

interface SkelProps { className?: string; style?: CSSProperties; }

export const Skeleton = ({ className = "", style }: SkelProps) => (
  <div className={`sd-skel ${className}`} style={style} aria-hidden="true" />
);

export const KpiCardSkeleton = ({ hero }: { hero?: boolean }) => (
  <div className={`${hero ? "sd-card-hero" : "sd-card"} p-5 min-h-[130px] flex flex-col justify-between`}>
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-3 w-24" style={hero ? { background: "rgba(255,255,255,.25)" } : undefined} />
      <Skeleton className="h-4 w-10 rounded-full" style={hero ? { background: "rgba(255,255,255,.25)" } : undefined} />
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton className="h-7 w-32" style={hero ? { background: "rgba(255,255,255,.28)" } : undefined} />
      <Skeleton className="h-3 w-40" style={hero ? { background: "rgba(255,255,255,.22)" } : undefined} />
    </div>
  </div>
);

export const TrendChartSkeleton = () => (
  <div className="sd-card p-4">
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-7 w-32 rounded-xl" />
    </div>
    <div className="flex items-end gap-2 mb-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-4 w-14 rounded-full" />
    </div>
    <div className="flex items-end gap-2 h-[180px]" dir="ltr">
      {[42, 68, 55, 82, 60, 90, 72, 88, 66, 78, 52, 84].map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%`, opacity: 0.55 }} />
      ))}
    </div>
  </div>
);

export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <ul>
    {Array.from({ length: rows }).map((_, i) => (
      <li key={i} className="flex items-center justify-between py-3 border-b last:border-b-0"
        style={{ borderColor: "hsl(var(--sd-stroke))" }}>
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </li>
    ))}
  </ul>
);

export const MeterListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i}>
        <div className="flex items-center justify-between mb-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
    ))}
  </div>
);

export const IntentCloudSkeleton = () => (
  <div className="flex flex-wrap gap-2">
    {[80, 110, 60, 95, 130, 70, 100, 85, 120, 75].map((w, i) => (
      <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `1.5fr repeat(${cols - 1}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-4" />
        ))}
      </div>
    ))}
  </div>
);
