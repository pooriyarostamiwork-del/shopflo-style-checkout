import { useState } from "react";
import { Check, Copy, RotateCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageFeedback = "up" | "down";
export type DeliveryStatus = "failed" | "stopped";

const iconBtn =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing to do */
    }
  };
  return (
    <button type="button" onClick={copy} className={iconBtn} aria-label={copied ? "کپی شد" : "کپی پیام"} title={copied ? "کپی شد" : "کپی"}>
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

/** Under a user bubble: copy, plus a resend control when the turn got no reply. */
export const UserMessageActions = ({
  text,
  status,
  onResend,
  disabled,
  className,
}: {
  text: string;
  status?: DeliveryStatus;
  onResend?: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <div dir="rtl" className={cn("flex items-center gap-1", className)}>
    {status && onResend && (
      <>
        <span className="text-[11px] text-destructive">
          {status === "stopped" ? "متوقف شد" : "پاسخی دریافت نشد"}
        </span>
        <button type="button" onClick={onResend} disabled={disabled} className={iconBtn} aria-label="ارسال دوباره" title="ارسال دوباره">
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </>
    )}
    <CopyButton text={text} />
  </div>
);

/** Under an agent reply: like / dislike (toggle). */
export const AgentMessageActions = ({
  feedback,
  onFeedback,
  className,
}: {
  feedback?: MessageFeedback;
  onFeedback: (value: MessageFeedback | null) => void;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-1", className)}>
    <button
      type="button"
      onClick={() => onFeedback(feedback === "up" ? null : "up")}
      className={cn(iconBtn, feedback === "up" && "text-primary")}
      aria-label="پاسخ مفید بود"
      aria-pressed={feedback === "up"}
    >
      <ThumbsUp className="h-3.5 w-3.5" fill={feedback === "up" ? "currentColor" : "none"} />
    </button>
    <button
      type="button"
      onClick={() => onFeedback(feedback === "down" ? null : "down")}
      className={cn(iconBtn, feedback === "down" && "text-destructive")}
      aria-label="پاسخ مفید نبود"
      aria-pressed={feedback === "down"}
    >
      <ThumbsDown className="h-3.5 w-3.5" fill={feedback === "down" ? "currentColor" : "none"} />
    </button>
  </div>
);
