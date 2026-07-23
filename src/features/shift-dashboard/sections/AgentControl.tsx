import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { Switch } from "../shared/Switch";
import { ProBadge } from "../shared/ProLock";
import { useDashboard } from "../context/DashboardContext";
import { personas, campaignPresets } from "../data/mockDashboard";
import { toast } from "sonner";

export const AgentControl = () => {
  const [tab, setTab] = useState("persona");
  const { content, updateContent, guardrails, toggleGuardrail, plan } = useDashboard();
  const isPro = plan === "pro";

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">کنترل ایجنت</h1>
        <p className="text-sm text-[hsl(var(--sd-muted))]">شخصیت، محدودیت‌ها، خودکارسازی و کمپین‌های ایجنت</p>
      </div>

      <SectionTabs
        tabs={[
          { id: "persona", label: "شخصیت و لحن" },
          { id: "guardrails", label: "محدودیت‌ها" },
          { id: "auto", label: "خودکارسازی" },
          { id: "campaigns", label: "کمپین‌ها" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "persona" && (
        <div className="space-y-4">
          <div className="sd-card p-4">
            <label className="text-[12px] text-[hsl(var(--sd-muted))]">نام ایجنت</label>
            <input className="sd-input mt-1.5" value={content.agentName} onChange={e => updateContent({ agentName: e.target.value })} />
          </div>
          <div className="sd-card p-4">
            <div className="text-sm font-semibold mb-3">شخصیت آماده</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => updateContent({ personaId: p.id })}
                  className={`text-right p-3 rounded-xl border transition ${content.personaId === p.id ? "" : "hover:border-[hsl(var(--sd-stroke-strong))]"}`}
                  style={{
                    borderColor: content.personaId === p.id ? "hsl(var(--sd-primary))" : "hsl(var(--sd-stroke))",
                    background: content.personaId === p.id ? "hsl(var(--sd-primary-soft))" : "hsl(var(--sd-surface))",
                  }}
                >
                  <div className="font-semibold text-[13px]">{p.name}</div>
                  <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "guardrails" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guardrails.map(g => {
            const locked = g.pro && !isPro;
            return (
              <div key={g.id} className={`sd-card p-4 flex items-start justify-between gap-3 ${locked ? "opacity-70" : ""}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-[13px]">{g.label}</div>
                    {g.pro && <ProBadge />}
                  </div>
                  <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1">{g.desc}</div>
                </div>
                <Switch checked={g.enabled && !locked} onChange={() => toggleGuardrail(g.id)} disabled={locked} />
              </div>
            );
          })}
        </div>
      )}

      {tab === "auto" && (
        <div className="space-y-3">
          <div className={`sd-card p-4 flex items-center justify-between ${!isPro ? "opacity-70" : ""}`}>
            <div>
              <div className="flex items-center gap-2 font-semibold text-[13px]">
                اعمال خودکار کد تخفیف
                {!isPro && <ProBadge />}
              </div>
              <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1">
                ایجنت کدهای تخفیف واجد شرایط را در طول خرید اعمال می‌کند
              </div>
            </div>
            <Switch checked={content.autoApplyCoupons && isPro} onChange={() => updateContent({ autoApplyCoupons: !content.autoApplyCoupons })} disabled={!isPro} />
          </div>
          <div className="sd-card p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-[13px]">اطلاع‌رسانی خودکار پیشنهادها</div>
              <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1">
                ایجنت به‌طور فعالانه پیشنهادها و تخفیف‌های مرتبط را در گفتگو معرفی کند
              </div>
            </div>
            <Switch checked={content.autoInformOffers} onChange={() => updateContent({ autoInformOffers: !content.autoInformOffers })} />
          </div>
          <div className="sd-card p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-[13px]">وضعیت ایجنت</div>
              <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1">
                ایجنت را بدون حذف پیکربندی، فعال یا غیرفعال کنید
              </div>
            </div>
            <Switch checked={content.active} onChange={() => updateContent({ active: !content.active })} />
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="sd-card p-4">
            <div className="text-sm font-semibold mb-2">محصولات ویژه و پروموشن‌های اولویت‌دار</div>
            <textarea
              rows={4}
              className="sd-input"
              value={content.featuredPromotions}
              onChange={e => updateContent({ featuredPromotions: e.target.value })}
              placeholder="نام محصولات یا کمپین‌هایی که ایجنت باید در پیشنهادها اولویت دهد"
            />
          </div>
          <div className="sd-card p-4">
            <div className="text-sm font-semibold mb-3">حالت فصلی</div>
            <div className="flex flex-wrap gap-2">
              {campaignPresets.map(p => (
                <button key={p} onClick={() => toast.success(`حالت «${p}» فعال شد`)}
                  className="rounded-full px-3 py-1.5 border text-[12px] sd-card-hover"
                  style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                  {p}
                </button>
              ))}
              <button className="rounded-full px-3 py-1.5 text-[12px] sd-btn-ghost">+ کمپین سفارشی</button>
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
