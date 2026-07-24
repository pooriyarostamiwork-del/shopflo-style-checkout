import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";

export const ProLock = ({ children, note = "ویژه Shift Pro", reason }: { children: ReactNode; note?: string; reason?: string }) => (
  <div className="sd-pro-veil">
    <div className="sd-pro-inner">{children}</div>
    <div className="sd-pro-badge-inline">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ background: "hsl(var(--sd-ink))", color: "white" }}>
          <Sparkles className="w-3 h-3" /> {note}
        </div>
        {reason && (
          <div className="text-[11px] px-3 py-1 rounded-full max-w-[220px]"
            style={{ background: "hsl(var(--sd-surface))", color: "hsl(var(--sd-ink-2))", border: "1px solid hsl(var(--sd-stroke))" }}>
            {reason}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const ProBadge = () => (
  <span className="sd-chip" style={{ background: "hsl(var(--sd-ink))", color: "white", borderColor: "hsl(var(--sd-ink))" }}>
    <Lock className="w-2.5 h-2.5" /> Pro
  </span>
);
