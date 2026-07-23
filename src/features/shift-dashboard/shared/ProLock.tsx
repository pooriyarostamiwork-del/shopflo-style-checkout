import { ReactNode } from "react";
import { Lock } from "lucide-react";

export const ProLock = ({ children, note = "ویژه Shift Pro" }: { children: ReactNode; note?: string }) => (
  <div className="sd-lock-veil">
    <div className="sd-lock-inner">{children}</div>
    <div className="sd-lock-badge rounded-2xl">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
        style={{ background: "hsl(var(--sd-ink))", color: "white" }}>
        <Lock className="w-3 h-3" /> {note}
      </div>
    </div>
  </div>
);

export const ProBadge = () => (
  <span className="sd-chip" style={{ background: "hsl(var(--sd-primary-soft))", color: "hsl(var(--sd-primary-ink))", borderColor: "hsl(var(--sd-primary)/.3)" }}>
    <Lock className="w-2.5 h-2.5" /> Pro
  </span>
);
