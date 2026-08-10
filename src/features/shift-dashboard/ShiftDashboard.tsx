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
import { CustomerIntelligence } from "./sections/CustomerIntelligence";
import { Toaster } from "@/components/ui/sonner";
import "./styles/dashboard.css";
import {
  LayoutDashboard, Bot, Palette, Settings as SettingsIcon, CreditCard,
  LifeBuoy, Menu, X, Sparkles,
} from "lucide-react";

type NavItem = { id: string; label: string; icon: any; component: any };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "داشبورد", items: [
    { id: "home", label: "عملکرد و خانه", icon: LayoutDashboard, component: PerformanceHome },
  ]},
  { label: "مدیریت", items: [
    { id: "agent", label: "کنترل ایجنت", icon: Bot, component: AgentControl },
    { id: "intelligence", label: "هوش مشتری و بازار", icon: Sparkles, component: CustomerIntelligence },
    { id: "visual", label: "شخصی‌سازی بصری", icon: Palette, component: VisualCustomization },
    { id: "settings", label: "تنظیمات", icon: SettingsIcon, component: Settings },
  ]},
  { label: "حساب", items: [
    { id: "billing", label: "پلن‌ها و صورتحساب", icon: CreditCard, component: PlansBilling },
  ]},
];

const FOOTER_ITEMS: NavItem[] = [
  { id: "support", label: "پشتیبانی", icon: LifeBuoy, component: Support },
];

const FLAT = [...NAV.flatMap(g => g.items), ...FOOTER_ITEMS];

const RailButton = ({
  item, isActive, onClick,
}: { item: NavItem; isActive: boolean; onClick: () => void }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`sd-rail-btn ${isActive ? "active" : ""}`}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
      <span className="sd-rail-tip">{item.label}</span>
    </button>
  );
};

const ShellInner = () => {
  const { activeSection, setActiveSection, plan } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = FLAT.find(n => n.id === activeSection);
  const Section = active?.component ?? PerformanceHome;

  const go = (id: string) => { setActiveSection(id); setMobileOpen(false); };

  const Rail = (
    <aside className="sd-rail" aria-label="ناوبری اصلی">
      <div className="sd-rail-brand" aria-label="Shift">
        <span className="sd-rail-mark">S<span className="sd-rail-dot">.</span></span>
      </div>

      <nav className="sd-rail-nav">
        {NAV.map((group, gi) => (
          <div key={group.label} className="sd-rail-group">
            {gi > 0 && <div className="sd-rail-sep" aria-hidden />}
            {group.items.map(item => (
              <RailButton
                key={item.id}
                item={item}
                isActive={activeSection === item.id}
                onClick={() => go(item.id)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="sd-rail-footer">
        <div className="sd-rail-sep" aria-hidden />
        {FOOTER_ITEMS.map(item => (
          <RailButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => go(item.id)}
          />
        ))}
      </div>
    </aside>
  );

  return (
    <div className="shift-dash" dir="rtl" lang="fa">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b"
        style={{ background: "hsl(var(--sd-bg) / 0.9)", borderColor: "hsl(var(--sd-stroke))", backdropFilter: "blur(14px)" }}>
        <div className="max-w-[1400px] mx-auto pr-[76px] pl-3 sm:pl-5 h-14 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: mobile menu + agent toggle */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              className="lg:hidden sd-btn-ghost !p-0 !min-h-[40px] !w-10 flex items-center justify-center"
              onClick={() => setMobileOpen(true)}
              aria-label="باز کردن منو"
            >
              <Menu className="w-4 h-4" />
            </button>
            <AgentStatusToggle />
          </div>

          {/* Right: plan chip */}
          <div className="flex items-center shrink-0">
            <PlanTag plan={plan} />
          </div>

        </div>
      </div>

      {/* Desktop slim rail (right side in RTL) */}
      <div className="hidden lg:block sd-rail-fixed">{Rail}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 sd-anim-in" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute top-0 right-0 h-full shadow-xl flex"
            style={{ background: "hsl(var(--sd-bg))", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {Rail}
            <div className="p-3">
              <button
                className="sd-btn-ghost !p-0 !min-h-[40px] !w-10 flex items-center justify-center"
                onClick={() => setMobileOpen(false)}
                aria-label="بستن منو"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto pr-[76px] pl-3 sm:pl-5 py-4 sm:py-6">
        <main className="min-w-0 pb-16">
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
