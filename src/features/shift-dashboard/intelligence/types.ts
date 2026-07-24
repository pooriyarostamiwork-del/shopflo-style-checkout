export type IntelKpi = {
  label: string;
  value: string;
  delta?: string;
};

export type IntelInsight = {
  title: string;
  kpis: IntelKpi[];
  bullets?: string[];
};

export type IntelMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  insight?: IntelInsight;
};

export type IntelThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: IntelMessage[];
};

export type ChatStatus = "idle" | "thinking";
