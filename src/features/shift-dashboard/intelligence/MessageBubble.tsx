import { IntelMessage } from "./types";
import { InsightBlock } from "./InsightBlock";

const renderInline = (text: string) => {
  // very small **bold** + `code` inline formatter — safe against arbitrary html
  const parts: Array<string | JSX.Element> = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={idx++}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <code
          key={idx++}
          className="px-1 py-0.5 rounded text-[12px]"
          style={{
            background: "hsl(var(--sd-surface-2))",
            border: "1px solid hsl(var(--sd-stroke))",
          }}
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

const renderContent = (content: string) =>
  content.split(/\n{2,}/).map((para, i) => (
    <p key={i} className="text-[13.5px] leading-[1.85] text-[hsl(var(--sd-ink))]">
      {renderInline(para)}
    </p>
  ));

export const MessageBubble = ({ message }: { message: IntelMessage }) => {
  if (message.role === "user") {
    return (
      <div className="flex justify-start sd-anim-in">
        <div
          className="max-w-[78%] px-4 py-2.5 text-[13.5px] leading-[1.7]"
          style={{
            background: "hsl(var(--sd-ink))",
            color: "hsl(var(--sd-bg))",
            borderRadius: "18px 18px 4px 18px",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start sd-anim-in">
      <div className="max-w-[92%] w-full flex gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
          style={{
            background: "hsl(var(--sd-primary-soft))",
            color: "hsl(var(--sd-primary-ink))",
            border: "1px solid hsl(var(--sd-stroke))",
          }}
        >
          ش
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {renderContent(message.content)}
          {message.insight && <InsightBlock insight={message.insight} />}
        </div>
      </div>
    </div>
  );
};

export const TypingBubble = () => (
  <div className="flex justify-start sd-anim-in">
    <div className="flex gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
        style={{
          background: "hsl(var(--sd-primary-soft))",
          color: "hsl(var(--sd-primary-ink))",
          border: "1px solid hsl(var(--sd-stroke))",
        }}
      >
        ش
      </div>
      <div
        className="flex items-center gap-1.5 px-3 py-2 rounded-full"
        style={{
          background: "hsl(var(--sd-surface-2))",
          border: "1px solid hsl(var(--sd-stroke))",
        }}
      >
        <span className="sd-typing-dot" />
        <span className="sd-typing-dot" style={{ animationDelay: "0.15s" }} />
        <span className="sd-typing-dot" style={{ animationDelay: "0.3s" }} />
        <span className="text-[11.5px] text-[hsl(var(--sd-muted))] mr-1">
          در حال تحلیل…
        </span>
      </div>
    </div>
  </div>
);
