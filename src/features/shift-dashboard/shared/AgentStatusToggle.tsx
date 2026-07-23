import { useDashboard } from "../context/DashboardContext";

const labels = { active: "فعال", paused: "متوقف", offline: "آفلاین" } as const;

export const AgentStatusToggle = () => {
  const { agentStatus, setAgentStatus } = useDashboard();
  const cycle = () => setAgentStatus(agentStatus === "active" ? "paused" : agentStatus === "paused" ? "offline" : "active");
  return (
    <button
      onClick={cycle}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full sd-card sd-card-hover text-[12px]"
      title="کلیک برای تغییر وضعیت"
    >
      <span className={`sd-live-dot ${agentStatus === "active" ? "" : agentStatus}`} />
      <span className="text-[hsl(var(--sd-ink-2))]">{labels[agentStatus]}</span>
    </button>
  );
};
