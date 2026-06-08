import { formatToman, type WithdrawalRow, type WithdrawalStatus } from "../data/mockVendor";
import { Inbox } from "lucide-react";

const statusMeta: Record<WithdrawalStatus, { label: string; className: string }> = {
  pending: { label: "در انتظار", className: "bg-[hsl(var(--vd-surface-2))] text-muted-foreground" },
  processing: { label: "در حال پردازش", className: "bg-[hsl(var(--vd-accent-soft))] text-[hsl(var(--vd-accent))]" },
  completed: { label: "تکمیل شد", className: "bg-[hsl(var(--vd-positive-soft))] text-[hsl(var(--vd-positive))]" },
  failed: { label: "ناموفق", className: "bg-[hsl(var(--vd-danger-soft))] text-[hsl(var(--vd-danger))]" },
};

function groupByMonth(rows: WithdrawalRow[]): Record<string, WithdrawalRow[]> {
  return rows.reduce((acc, r) => {
    const month = r.date.slice(0, 7); // e.g. ۱۴۰۵/۰۳
    (acc[month] ||= []).push(r);
    return acc;
  }, {} as Record<string, WithdrawalRow[]>);
}

const MONTH_NAMES: Record<string, string> = {
  "01": "فروردین", "02": "اردیبهشت", "03": "خرداد", "04": "تیر",
  "05": "مرداد", "06": "شهریور", "07": "مهر", "08": "آبان",
  "09": "آذر", "10": "دی", "11": "بهمن", "12": "اسفند",
};

const farsiMonthLabel = (key: string) => {
  const m = key.match(/([\d۰-۹]{4})\/([\d۰-۹]{2})/);
  if (!m) return key;
  const en = "۰۱۲۳۴۵۶۷۸۹";
  const mm = m[2].replace(/[۰-۹]/g, (d) => String(en.indexOf(d)));
  return `${MONTH_NAMES[mm] ?? mm} ${m[1]}`;
};

export const WithdrawalHistoryList = ({ rows }: { rows: WithdrawalRow[] }) => {
  if (rows.length === 0) {
    return (
      <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-3xl p-8 flex flex-col items-center text-center gap-2">
        <Inbox className="w-8 h-8 text-muted-foreground" />
        <div className="text-sm font-medium text-foreground">هنوز برداشتی ثبت نشده</div>
        <div className="text-xs text-muted-foreground">پس از اولین برداشت، تاریخچه اینجا نمایش داده می‌شود.</div>
      </div>
    );
  }
  const groups = groupByMonth(rows);
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([month, list]) => (
        <div key={month}>
          <div className="text-[11px] text-muted-foreground mb-2 px-1" style={{ unicodeBidi: "isolate" }}>
            {farsiMonthLabel(month)}
          </div>
          <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-3xl overflow-hidden">
            {list.map((r, i) => {
              const meta = statusMeta[r.status];
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < list.length - 1 ? "border-b border-[hsl(var(--vd-stroke))]" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-foreground vd-num">
                      {formatToman(r.amount)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 vd-num">
                      {r.date}
                    </div>
                  </div>

                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${meta.className}`}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
