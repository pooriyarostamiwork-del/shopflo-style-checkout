import { useState } from "react";
import { supportTickets, fa } from "../data/mockDashboard";
import { toast } from "sonner";

const statusColors: Record<string, { bg: string; fg: string; label: string }> = {
  open: { bg: "hsl(0 80% 96%)", fg: "hsl(var(--sd-danger))", label: "باز" },
  "in-progress": { bg: "hsl(32 92% 94%)", fg: "hsl(var(--sd-warning))", label: "در حال بررسی" },
  resolved: { bg: "hsl(152 70% 94%)", fg: "hsl(var(--sd-success))", label: "بسته‌شده" },
};

export const Support = () => {
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">پشتیبانی</h1>
        <p className="text-sm text-[hsl(var(--sd-muted))]">تیکت‌های شما و ثبت درخواست جدید</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 sd-card overflow-hidden">
          <div className="p-4 border-b text-sm font-semibold" style={{ borderColor: "hsl(var(--sd-stroke))" }}>تیکت‌های اخیر</div>
          <ul>
            {supportTickets.map(t => {
              const s = statusColors[t.status];
              return (
                <li key={t.id} className="p-4 border-b last:border-b-0 flex items-center justify-between gap-3"
                  style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                  <div>
                    <div className="font-semibold text-[13px]">{t.title}</div>
                    <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-0.5 sd-num">{t.id} · {t.updated}</div>
                  </div>
                  <span className="sd-chip" style={{ background: s.bg, color: s.fg, borderColor: s.fg }}>{s.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sd-card p-4">
          <div className="text-sm font-semibold mb-3">درخواست جدید</div>
          <div className="space-y-3">
            <input className="sd-input" placeholder="عنوان مشکل" value={title} onChange={e => setTitle(e.target.value)} />
            <textarea className="sd-input" rows={5} placeholder="جزئیات را بنویسید…" value={msg} onChange={e => setMsg(e.target.value)} />
            <button className="sd-btn-primary w-full" onClick={() => { if(title.trim()) { toast.success("تیکت ثبت شد"); setTitle(""); setMsg(""); } }}>ارسال تیکت</button>
          </div>
        </div>
      </div>
    </div>
  );
};
