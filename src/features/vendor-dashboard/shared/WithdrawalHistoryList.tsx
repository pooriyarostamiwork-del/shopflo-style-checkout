import { formatToman, type WithdrawalStatus } from "../data/mockVendor";

interface WithdrawalRow {
  date: string;
  amount: number;
  status: WithdrawalStatus;
}

const statusMeta: Record<WithdrawalStatus, { label: string; className: string }> = {
  pending: { label: "در انتظار", className: "border-border text-muted-foreground bg-secondary" },
  processing: { label: "در حال پردازش", className: "border-primary/30 text-primary bg-primary/5" },
  completed: { label: "تکمیل شد", className: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  failed: { label: "ناموفق", className: "border-destructive/30 text-destructive bg-destructive/5" },
};

export const WithdrawalHistoryList = ({ rows }: { rows: WithdrawalRow[] }) => (
  <ul className="space-y-2">
    {rows.map((r, i) => {
      const meta = statusMeta[r.status];
      return (
        <li
          key={i}
          className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium text-foreground" style={{ unicodeBidi: "isolate" }}>
              {formatToman(r.amount)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5" style={{ unicodeBidi: "isolate" }}>
              {r.date}
            </div>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] border ${meta.className}`}>
            {meta.label}
          </span>
        </li>
      );
    })}
  </ul>
);
