import { useState } from "react";
import { Plan } from "./data/mockDashboard";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import { PlanTag } from "./shared/PlanTag";
import { AgentStatusToggle } from "./shared/AgentStatusToggle";
import { PerformanceHome } from "./sections/PerformanceHome";
import { AgentControl } from "./sections/AgentControl";
import { VisualCustomization } from "./sections/VisualCustomization";
import { Settings } from "./sections/Settings";
import { PlansBilling } from "./sections/PlansBilling";
import { Support } from "./sections/Support";
import { Toaster } from "@/components/ui/sonner";
import "./styles/dashboard.css";
import { LayoutDashboard, Bot, Palette, Settings as SettingsIcon, CreditCard, LifeBuoy, Menu, X } from "lucide-react";

const NAV = [
  { id: "home", label: "عملکرد و خانه", icon: LayoutDashboard, component: PerformanceHome },
  { id: "agent", label: "کنترل ایجنت", icon: Bot, component: AgentControl },
  { id: "visual", label: "شخصی‌سازی بصری", icon: Palette, component: VisualCustomization },
  { id: "settings", label: "تنظیمات", icon: SettingsIcon, component: Settings },
  { id: "billing", label: "پلن‌ها و صورتحساب", icon: CreditCard, component: PlansBilling },
  { id: "support", label: "پشتیبانی", icon: LifeBuoy, component: Support },
];

const ShellInner = () => {
  const { activeSection, setActiveSection, plan } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const Section = NAV.find(n => n.id === activeSection)?.component ?? PerformanceHome;

  const Sidebar = (
    <aside className="w-64 shrink-0 sd-card p-3 flex flex-col gap-1 h-full sticky top-4"
      style={{ borderRadius: 20 }}>
      <div className="px-3 pt-2 pb-4">
        <div className="text-lg font-bold" style={{ letterSpacing: "-0.02em" }}>
          Shift
          <span className="text-[hsl(var(--sd-primary))]">.</span>
        </div>
        <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-0.5">داشبورد فروشنده</div>
      </div>
      {NAV.map(n => {
        const Icon = n.icon;
        const active = activeSection === n.id;
        return (
          <button
            key={n.id}
            onClick={() => { setActiveSection(n.id); setMobileOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-right transition"
            style={{
              background: active ? "hsl(var(--sd-primary-soft))" : "transparent",
              color: active ? "hsl(var(--sd-primary-ink))" : "hsl(var(--sd-ink-2))",
              fontWeight: active ? 600 : 500,
            }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {n.label}
          </button>
        );
      })}
      <div className="mt-auto p-3 rounded-xl" style={{ background: "hsl(var(--sd-surface-2))" }}>
        <div className="text-[11px] text-[hsl(var(--sd-muted))]">فروشگاه</div>
        <div className="text-[13px] font-semibold mt-0.5">پت‌پلی‌گراند</div>
        <div className="mt-2 flex items-center gap-2">
          <PlanTag plan={plan} />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="shift-dash" dir="rtl" lang="fa">
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{ background: "hsl(var(--sd-bg) / 0.85)", borderColor: "hsl(var(--sd-stroke))" }}>
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden sd-btn-ghost !p-2" onClick={() => setMobileOpen(true)}><Menu className="w-4 h-4" /></button>
            <PlanTag plan={plan} />
            <AgentStatusToggle />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-[12px] text-[hsl(var(--sd-muted))]">
              خوش آمدید، <span className="text-[hsl(var(--sd-ink))] font-semibold">سارا</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
              style={{ background: "hsl(var(--sd-primary-soft))", color: "hsl(var(--sd-primary))" }}>س</div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-5 flex gap-5">
        <div className="hidden lg:block">{Sidebar}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute top-0 right-0 h-full w-72 p-3" style={{ background: "hsl(var(--sd-bg))" }}>
              <button className="mb-2 sd-btn-ghost !p-2" onClick={() => setMobileOpen(false)}><X className="w-4 h-4" /></button>
              {Sidebar}
            </div>
          </div>
        )}
        <main className="flex-1 min-w-0 pb-16">
          <Section />
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
};

export const ShiftDashboard = ({ plan }: { plan: Plan }) => (
  <DashboardProvider plan={plan}>
    <ShellInner />
  </DashboardProvider>
);
