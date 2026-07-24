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

type NavGroup = { label: string; items: { id: string; label: string; icon: any; component: any }[] };

const NAV: NavGroup[] = [
  {
    label: "داشبورد",
    items: [
      { id: "home", label: "عملکرد و خانه", icon: LayoutDashboard, component: PerformanceHome },
    ],
  },
  {
    label: "مدیریت",
    items: [
      { id: "agent", label: "کنترل ایجنت", icon: Bot, component: AgentControl },
      { id: "visual", label: "شخصی‌سازی بصری", icon: Palette, component: VisualCustomization },
      { id: "settings", label: "تنظیمات", icon: SettingsIcon, component: Settings },
    ],
  },
  {
    label: "حساب",
    items: [
      { id: "billing", label: "پلن‌ها و صورتحساب", icon: CreditCard, component: PlansBilling },
      { id: "support", label: "پشتیبانی", icon: LifeBuoy, component: Support },
    ],
  },
];

const FLAT = NAV.flatMap(g => g.items);

const ShellInner = () => {
  const { activeSection, setActiveSection, plan } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const Section = FLAT.find(n => n.id === activeSection)?.component ?? PerformanceHome;

  const Sidebar = (
    <aside className="w-64 shrink-0 flex flex-col h-full py-4 px-3 sticky top-4">
      <div className="px-3 pb-6">
        <div className="text-[22px] font-bold tracking-tight leading-none">
          Shift<span className="text-[hsl(var(--sd-primary))]">.</span>
        </div>
        <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1.5">داشبورد فروشنده</div>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {NAV.map(group => (
          <div key={group.label}>
            <div className="sd-nav-label">{group.label}</div>
            {group.items.map(n => {
              const Icon = n.icon;
              const active = activeSection === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => { setActiveSection(n.id); setMobileOpen(false); }}
                  className={`sd-nav-item ${active ? "active" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {n.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 px-3 pt-4 border-t flex items-center justify-between gap-2"
        style={{ borderColor: "hsl(var(--sd-stroke))" }}>
        <div className="min-w-0">
          <div className="text-[11px] text-[hsl(var(--sd-muted))]">فروشگاه</div>
          <div className="text-[13px] font-semibold mt-0.5 truncate">پت‌پلی‌گراند</div>
        </div>
        <PlanTag plan={plan} />
      </div>
    </aside>
  );

  return (
    <div className="shift-dash" dir="rtl" lang="fa">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b"
        style={{ background: "hsl(var(--sd-bg) / 0.9)", borderColor: "hsl(var(--sd-stroke))", backdropFilter: "blur(10px)" }}>
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden sd-btn-ghost !p-2" onClick={() => setMobileOpen(true)}><Menu className="w-4 h-4" /></button>
            <AgentStatusToggle />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-[12px] text-[hsl(var(--sd-muted))]">
              خوش آمدید، <span className="text-[hsl(var(--sd-ink))] font-semibold">سارا</span>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold border"
              style={{ background: "hsl(var(--sd-surface))", color: "hsl(var(--sd-ink))", borderColor: "hsl(var(--sd-stroke))" }}>س</div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-6 flex gap-5">
        <div className="hidden lg:block">{Sidebar}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute top-0 right-0 h-full w-72 py-3" style={{ background: "hsl(var(--sd-bg))" }}>
              <button className="mb-2 mx-3 sd-btn-ghost !p-2" onClick={() => setMobileOpen(false)}><X className="w-4 h-4" /></button>
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
