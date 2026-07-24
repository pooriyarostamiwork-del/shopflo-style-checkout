import { useDashboard } from "../context/DashboardContext";

const options: { id: "active" | "paused" | "offline"; label: string }[] = [
  { id: "active", label: "فعال" },
  { id: "paused", label: "متوقف" },
  { id: "offline", label: "آفلاین" },
];

export const AgentStatusToggle = () => {
  const { agentStatus, setAgentStatus } = useDashboard();
  return (
    <div className="sd-seg" role="tablist" aria-label="وضعیت ایجنت">
      {options.map(o => (
        <button
          key={o.id}
          className={agentStatus === o.id ? "active" : ""}
          onClick={() => setAgentStatus(o.id)}
          role="tab"
          aria-selected={agentStatus === o.id}
        >
          <span className={`sd-live-dot ${o.id === "active" ? "" : o.id}`} />
          {o.label}
        </button>
      ))}
    </div>
  );
};
