import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { IndexedProductsBar } from "../shared/IndexedProductsBar";
import { ProBadge } from "../shared/ProLock";
import { useDashboard } from "../context/DashboardContext";
import { teamMembers, integrations } from "../data/mockDashboard";
import { toast } from "sonner";
import { Copy, CheckCircle2, AlertTriangle } from "lucide-react";

export const Settings = () => {
  const [tab, setTab] = useState("team");
  const { plan } = useDashboard();
  const isPro = plan === "pro";
  const embed = `<script src="https://cdn.shift.ai/widget.js" data-store="petplayground" async></script>`;
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">تنظیمات</h1>
        <p className="text-sm text-[hsl(var(--sd-muted))]">تیم، اتصال‌ها و نصب</p>
      </div>

      <SectionTabs
        tabs={[
          { id: "team", label: "اعضای تیم" },
          { id: "integrations", label: "اتصال‌ها و کاتالوگ" },
          { id: "install", label: "نصب" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "team" && (
        <div className="sd-card overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">اعضای تیم {!isPro && <ProBadge />}</div>
              <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-0.5">مدیریت دسترسی سطح‌بندی‌شده {!isPro && "(نقش‌های سفارشی فقط در Pro)"}</div>
            </div>
            <button className="sd-btn-primary" onClick={() => toast("دعوت عضو (نمایشی)")}>+ افزودن عضو</button>
          </div>
          <table className="w-full text-[13px]" dir="rtl">
            <thead className="text-[11px] text-[hsl(var(--sd-muted))]" style={{ background: "hsl(var(--sd-surface-2))" }}>
              <tr>
                <th className="text-right p-3 font-normal">نام</th>
                <th className="text-right p-3 font-normal">ایمیل</th>
                <th className="text-right p-3 font-normal">نقش</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(m => (
                <tr key={m.id} className="border-t" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3 text-[hsl(var(--sd-muted))]">{m.email}</td>
                  <td className="p-3">
                    <select disabled={!isPro && m.role !== "owner"} defaultValue={m.role} className="sd-input py-1 text-[12px]" style={{ width: "auto" }}>
                      <option value="owner">مالک</option>
                      <option value="admin">ادمین</option>
                      <option value="editor">ویرایشگر</option>
                      <option value="viewer">مشاهده‌گر</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "integrations" && (
        <div className="space-y-4">
          <div className="sd-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold">وضعیت همگام‌سازی — {integrations.platform}</div>
                <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-0.5">آخرین همگام‌سازی: <span className="sd-num">{integrations.lastSync}</span></div>
              </div>
              <div className="sd-chip sd-chip-up"><CheckCircle2 className="w-3 h-3" /> سالم</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[hsl(var(--sd-muted))]">کلید API</label>
                <input className="sd-input mt-1.5 sd-num" value={integrations.apiKey} readOnly />
              </div>
              <div>
                <label className="text-[11px] text-[hsl(var(--sd-muted))]">دامنه فروشگاه</label>
                <input className="sd-input mt-1.5" defaultValue="petplayground.ir" />
              </div>
            </div>
          </div>

          <div className="sd-card p-4">
            <IndexedProductsBar />
            {integrations.indexed.errors > 0 && (
              <div className="mt-4 p-3 rounded-xl flex items-start gap-2 text-[12px]"
                style={{ background: "hsl(0 80% 97%)", border: "1px solid hsl(0 70% 88%)", color: "hsl(var(--sd-danger))" }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">۲۴ محصول با خطا</div>
                  <div className="mt-1 opacity-80">تصاویر مفقود یا ویژگی‌های ناقص. برای بازبینی و رفع کلیک کنید.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "install" && (
        <div className="sd-card p-5">
          <div className="text-sm font-semibold mb-1">اسکریپت نصب</div>
          <p className="text-[12px] text-[hsl(var(--sd-muted))] mb-3">این قطعه‌کد را قبل از تگ بسته‌شدن <code>&lt;/body&gt;</code> در فروشگاه خود قرار دهید.</p>
          <div className="relative rounded-xl p-4 font-mono text-[12px] overflow-x-auto" dir="ltr" style={{ background: "hsl(var(--sd-ink))", color: "hsl(0 0% 92%)" }}>
            <code>{embed}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(embed); setCopied(true); toast.success("کپی شد"); setTimeout(() => setCopied(false), 1200); }}
              className="absolute top-2 left-2 sd-btn-ghost inline-flex items-center gap-1"
              style={{ background: "hsl(var(--sd-surface))", color: "hsl(var(--sd-ink))" }}
            >
              <Copy className="w-3 h-3" /> {copied ? "کپی شد" : "کپی"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
