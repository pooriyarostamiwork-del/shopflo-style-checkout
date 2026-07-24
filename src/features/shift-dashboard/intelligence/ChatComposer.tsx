import { FormEvent, KeyboardEvent, useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isThinking?: boolean;
  autoFocusKey?: string;
}

export const ChatComposer = ({
  value,
  onChange,
  onSend,
  disabled,
  isThinking,
  autoFocusKey,
}: Props) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [autoFocusKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [value]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled || !value.trim()) return;
    onSend();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className="border-t px-4 sm:px-6 py-4"
      style={{
        borderColor: "hsl(var(--sd-stroke))",
        background: "hsl(var(--sd-bg))",
      }}
    >
      <form
        onSubmit={submit}
        className="max-w-[760px] mx-auto sd-composer"
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="یه سوال درباره مشتری، سگمنت، قیف یا بازار بپرس…"
          className="sd-composer-input"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={isThinking ? "در حال تحلیل" : "ارسال"}
          className="sd-composer-send"
        >
          {isThinking ? (
            <Square className="w-3.5 h-3.5" fill="currentColor" />
          ) : (
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </form>
      <div className="max-w-[760px] mx-auto mt-2 text-center text-[10.5px] text-[hsl(var(--sd-muted))]">
        Enter برای ارسال · Shift+Enter برای خط جدید
      </div>
    </div>
  );
};
