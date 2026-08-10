import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { SectionHeader } from "../shared/SectionHeader";
import { Switch } from "../shared/Switch";
import { ProBadge } from "../shared/ProLock";
import { useDashboard } from "../context/DashboardContext";
import { personas, campaignPresets } from "../data/mockDashboard";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const AgentControl = () => {
  const [tab, setTab] = useState("persona");
  const { content, updateContent, guardrails, toggleGuardrail, plan } = useDashboard();
  const isPro = plan === "pro";

  return (
    <div>
      <SectionHeader
        eyebrow="کنترل ایجنت"
        title="شخصیت و رفتار ایجنت"
        subtitle="لحن، محدودیت‌ها، خودکارسازی و کمپین‌ها را از یک‌جا مدیریت کنید"
      />

      <SectionTabs
        tabs={[
          { id: "persona", label: "شخصیت و لحن" },
          { id: "rules", label: "محدودیت‌ها و خودکارسازی" },
          { id: "campaigns", label: "کمپین‌ها" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "persona" && (
        <div className="space-y-4">
          <div className="sd-card p-5">
            <label className="text-[12px] text-[hsl(var(--sd-muted))]">نام ایجنت</label>
            <input className="sd-input mt-2" value={content.agentName} onChange={e => updateContent({ agentName: e.target.value })} />
          </div>
          <div className="sd-card p-5">
            <div className="text-[13px] font-semibold mb-4">شخصیت آماده</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {personas.map(p => {
                const active = content.personaId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => updateContent({ personaId: p.id })}
                    className="text-right p-4 rounded-2xl border transition relative"
                    style={{
                      borderColor: active ? "hsl(var(--sd-ink))" : "hsl(var(--sd-stroke))",
                      background: active ? "hsl(var(--sd-ink))" : "hsl(var(--sd-surface))",
                      color: active ? "white" : "hsl(var(--sd-ink))",
                    }}
                  >
                    <div className="font-semibold text-[13px] flex items-center justify-between">
                      {p.name}
                      {active && <span className="w-5 h-5 rounded-full inline-flex items-center justify-center" style={{ background: "hsl(var(--sd-primary))" }}><Check className="w-3 h-3 text-white" /></span>}
                    </div>
                    <div className="text-[11.5px] mt-1.5" style={{ opacity: .75 }}>{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "rules" && (
        <div className="space-y-4 sd-anim-in">
          <div className="sd-card overflow-hidden">
            <div className="px-4 pt-4 pb-1">
              <div className="text-[13px] font-semibold">محدودیت‌های ایجنت</div>
              <div className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">مرزهایی که ایجنت هرگز از آن‌ها عبور نمی‌کند</div>
            </div>
            {guardrails.map(g => {
              const locked = g.pro && !isPro;
              return (
                <div key={g.id}
                  className={`p-4 flex items-start justify-between gap-4 border-t ${locked ? "opacity-60" : ""}`}
                  style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[13px]">{g.label}</div>
                      {g.pro && <ProBadge />}
                    </div>
                    <div className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">{g.desc}</div>
                  </div>
                  <Switch checked={g.enabled && !locked} onChange={() => toggleGuardrail(g.id)} disabled={locked} />
                </div>
              );
            })}
          </div>

          <div className="sd-card overflow-hidden">
            <div className="px-4 pt-4 pb-1">
              <div className="text-[13px] font-semibold">خودکارسازی</div>
              <div className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">کارهایی که ایجنت بدون دخالت تو انجام می‌دهد</div>
            </div>
            {[
              { title: "اعمال خودکار کد تخفیف", desc: "ایجنت کدهای تخفیف واجد شرایط را در طول خرید اعمال می‌کند", checked: content.autoApplyCoupons && isPro, onChange: () => updateContent({ autoApplyCoupons: !content.autoApplyCoupons }), disabled: !isPro, pro: true },
              { title: "اطلاع‌رسانی خودکار پیشنهادها", desc: "ایجنت به‌طور فعالانه پیشنهادها و تخفیف‌های مرتبط را در گفتگو معرفی کند", checked: content.autoInformOffers, onChange: () => updateContent({ autoInformOffers: !content.autoInformOffers }) },
              { title: "وضعیت ایجنت", desc: "ایجنت را بدون حذف پیکربندی، فعال یا غیرفعال کنید", checked: content.active, onChange: () => updateContent({ active: !content.active }) },
            ].map(row => (
              <div key={row.title}
                className={`p-4 flex items-start justify-between gap-4 border-t ${row.disabled ? "opacity-60" : ""}`}
                style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                <div>
                  <div className="flex items-center gap-2 font-semibold text-[13px]">
                    {row.title}
                    {row.pro && !isPro && <ProBadge />}
                  </div>
                  <div className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">{row.desc}</div>
                </div>
                <Switch checked={row.checked} onChange={row.onChange} disabled={row.disabled} />
              </div>
            ))}
          </div>
        </div>
      )}


      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="sd-card p-5">
            <div className="text-[13px] font-semibold mb-3">محصولات ویژه و پروموشن‌های اولویت‌دار</div>
            <textarea
              rows={4}
              className="sd-input"
              value={content.featuredPromotions}
              onChange={e => updateContent({ featuredPromotions: e.target.value })}
              placeholder="نام محصولات یا کمپین‌هایی که ایجنت باید در پیشنهادها اولویت دهد"
            />
          </div>
          <div className="sd-card p-5">
            <div className="text-[13px] font-semibold mb-3">حالت فصلی</div>
            <div className="flex flex-wrap gap-2">
              {campaignPresets.map(p => (
                <button key={p} onClick={() => toast.success(`حالت «${p}» فعال شد`)}
                  className="rounded-full px-3.5 py-1.5 border text-[12px] transition hover:border-[hsl(var(--sd-stroke-strong))] hover:bg-[hsl(var(--sd-surface-2))]"
                  style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                  {p}
                </button>
              ))}
              <button className="rounded-full px-3.5 py-1.5 text-[12px] sd-btn-ghost">+ کمپین سفارشی</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-start">
        <button className="sd-btn-primary" onClick={() => toast.success("تغییرات ذخیره شد")}>ذخیره تغییرات</button>
      </div>
    </div>
  );
};
