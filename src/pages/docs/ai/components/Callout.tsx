import { Info, AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";

type Tone = "info" | "warning" | "idea" | "danger";

const cfg: Record<Tone, { cls: string; Icon: any }> = {
  info: { cls: "border-sky-500/30 bg-sky-500/5 text-sky-100", Icon: Info },
  warning: { cls: "border-amber-500/30 bg-amber-500/5 text-amber-100", Icon: AlertTriangle },
  idea: { cls: "border-indigo-500/30 bg-indigo-500/5 text-indigo-100", Icon: Lightbulb },
  danger: { cls: "border-red-500/30 bg-red-500/5 text-red-100", Icon: ShieldAlert },
};

export function Callout({
  tone,
  title,
  children,
  html,
}: {
  tone: Tone;
  title?: string;
  children?: React.ReactNode;
  html?: string;
}) {
  const { cls, Icon } = cfg[tone];
  return (
    <div className={`my-5 rounded-lg border px-4 py-3 ${cls}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 mt-0.5 flex-none opacity-80" />
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm mb-1">{title}</div>}
          {html ? (
            <div className="text-sm leading-relaxed [&_code]:bg-black/30 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="text-sm leading-relaxed">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
