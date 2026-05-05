export type Status = "live" | "to-be-implemented" | "not-needed";

export type Block =
  | { kind: "prose"; html: string }
  | { kind: "heading"; level: 2 | 3 | 4; text: string; id?: string }
  | { kind: "code"; lang: string; code: string; title?: string }
  | { kind: "mermaid"; code: string; caption?: string }
  | { kind: "callout"; tone: "info" | "warning" | "idea" | "danger"; title?: string; html: string }
  | { kind: "status"; status: Status; title: string; html: string }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "list"; ordered?: boolean; items: string[] };

export interface Section {
  id: string;
  title: string;
  status?: Status;
  blocks: Block[];
}

export interface Part {
  id: string;
  number: string;
  title: string;
  intro?: string;
  sections: Section[];
}
