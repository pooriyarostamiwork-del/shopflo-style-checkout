import type { Status } from "../content/types";
import { CheckCircle2, Wrench, MinusCircle } from "lucide-react";

const cfg: Record<Status, { label: string; cls: string; Icon: any }> = {
  "live": {
    label: "Live",
    cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    Icon: CheckCircle2,
  },
  "to-be-implemented": {
    label: "To be implemented",
    cls: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    Icon: Wrench,
  },
  "not-needed": {
    label: "Not needed",
    cls: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    Icon: MinusCircle,
  },
};

export function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "md" }) {
  const { label, cls, Icon } = cfg[status];
  const sizeCls = size === "md" ? "text-xs px-2.5 py-1" : "text-[10px] px-2 py-0.5";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${cls} ${sizeCls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
