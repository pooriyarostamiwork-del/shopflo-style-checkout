import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { SectionHeader } from "../shared/SectionHeader";
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
      <SectionHeader
        eyebrow="تنظیمات"
        title="تیم، اتصال‌ها و نصب"
        subtitle="دسترسی اعضا، وضعیت کاتالوگ و کد نصب ویجت"
      />

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
        <div className="sd-card overflow-hidden sd-form-col">
          <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
            <div>
              <div className="text-[14px] font-semibold flex items-center gap-2">اعضای تیم {!isPro && <ProBadge />}</div>
              <div className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">مدیریت دسترسی سطح‌بندی‌شده {!isPro && "(نقش‌های سفارشی فقط در Pro)"}</div>
            </div>
            <button className="sd-btn-ghost" onClick={() => toast("دعوت عضو (نمایشی)")}>+ افزودن عضو</button>
          </div>
          <table className="sd-table" dir="rtl">
            <thead>
              <tr>
                <th>نام</th>
                <th>ایمیل</th>
                <th>نقش</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(m => (
                <tr key={m.id}>
                  <td className="font-medium">{m.name}</td>
                  <td className="text-[hsl(var(--sd-muted))]">{m.email}</td>
                  <td>
                    <select disabled={!isPro && m.role !== "owner"} defaultValue={m.role} className="sd-input py-1.5 text-[12px]" style={{ width: "auto" }}>
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
        <div className="space-y-4 sd-form-col">
          <div className="sd-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[14px] font-semibold">وضعیت همگام‌سازی — {integrations.platform}</div>
                <div className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">آخرین همگام‌سازی: <span className="sd-num">{integrations.lastSync}</span></div>
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

          <div className="sd-card p-5">
            <IndexedProductsBar />
            {integrations.indexed.errors > 0 && (
              <div className="mt-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-[12px]"
                style={{ background: "hsl(0 80% 97%)", border: "1px solid hsl(0 70% 90%)", color: "hsl(var(--sd-danger))" }}>
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
        <div className="sd-card p-6 sd-form-col">
          <div className="text-[14px] font-semibold mb-1">اسکریپت نصب</div>
          <p className="text-[12px] text-[hsl(var(--sd-muted))] mb-4">این قطعه‌کد را قبل از تگ بسته‌شدن <code>&lt;/body&gt;</code> در فروشگاه خود قرار دهید.</p>
          <div className="relative rounded-2xl p-4 font-mono text-[12px] overflow-x-auto" dir="ltr" style={{ background: "hsl(var(--sd-ink))", color: "hsl(0 0% 92%)" }}>
            <code>{embed}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(embed); setCopied(true); toast.success("کپی شد"); setTimeout(() => setCopied(false), 1200); }}
              className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px]"
              style={{ background: "hsl(0 0% 15%)", color: "white", border: "1px solid hsl(0 0% 22%)" }}
            >
              <Copy className="w-3 h-3" /> {copied ? "کپی شد" : "کپی"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
