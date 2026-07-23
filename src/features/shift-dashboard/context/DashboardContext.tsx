import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { Plan, guardrails as initialGuardrails, initialContent } from "../data/mockDashboard";

type AgentStatus = "active" | "paused" | "offline";

interface DashboardState {
  plan: Plan;
  agentStatus: AgentStatus;
  setAgentStatus: (s: AgentStatus) => void;
  content: typeof initialContent;
  updateContent: (patch: Partial<typeof initialContent>) => void;
  guardrails: typeof initialGuardrails;
  toggleGuardrail: (id: string) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

const Ctx = createContext<DashboardState | null>(null);

export const DashboardProvider = ({ plan, children }: { plan: Plan; children: ReactNode }) => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("active");
  const [content, setContent] = useState(initialContent);
  const [guardrails, setGuardrails] = useState(initialGuardrails);
  const [activeSection, setActiveSection] = useState("home");

  const value = useMemo<DashboardState>(() => ({
    plan,
    agentStatus,
    setAgentStatus,
    content,
    updateContent: (patch) => setContent(c => ({ ...c, ...patch })),
    guardrails,
    toggleGuardrail: (id) => setGuardrails(gs => gs.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g)),
    activeSection,
    setActiveSection,
  }), [plan, agentStatus, content, guardrails, activeSection]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useDashboard = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be inside DashboardProvider");
  return ctx;
};
