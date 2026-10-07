import { useEffect, useRef, useState } from "react";
import { Check, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { recordWav, transcribeFile, type Recording } from "@/lib/voiceRecorder";
import { toast } from "@/hooks/use-toast";

const fa = (n: number) => n.toString().padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/** Flat AI orb: breathes with the live mic level, orbits while transcribing. */
export const VoiceOrb = ({ level, processing, size }: { level: number; processing: boolean; size: number }) => (
  <div className="voice-orb relative shrink-0" style={{ width: size, height: size }} aria-hidden>
    <span className="absolute inset-0 rounded-full border border-primary/25 transition-transform duration-150" style={{ transform: `scale(${processing ? 1 : 1 + level * 0.35})` }} />
    <span className="absolute inset-[14%] rounded-full border border-primary/40 transition-transform duration-100" style={{ transform: `scale(${processing ? 1 : 1 + level * 0.2})` }} />
    <span className={cn("voice-orb-core absolute inset-[24%] rounded-full", processing ? "voice-orb-spin" : "voice-orb-breathe")} />
  </div>
);

type Props = {
  variant: "desktop" | "mobile";
  disabled?: boolean;
  onTranscript: (text: string) => void;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
};

/**
 * Mic button + recording panel. The panel overlays the nearest `relative`
 * composer box; desktop is a compact inline bar, mobile a thumb-friendly card.
 */
export const VoiceInput = ({ variant, disabled, onTranscript, buttonClassName, buttonStyle }: Props) => {
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [level, setLevel] = useState(0);
  const [secs, setSecs] = useState(0);
  const rec = useRef<Recording | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (state !== "recording") return;
    setSecs(0);
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  useEffect(() => () => { rec.current?.cancel(); abort.current?.abort(); }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: "مرورگر شما ضبط صدا را پشتیبانی نمی‌کند" });
      return;
    }
    try {
      (document.activeElement as HTMLElement | null)?.blur?.();
      rec.current = await recordWav((l) => setLevel((p) => p * 0.6 + l * 0.4));
      setState("recording");
    } catch {
      toast({ title: "دسترسی به میکروفون داده نشد" });
    }
  };

  const cancel = () => {
    rec.current?.cancel(); rec.current = null;
    abort.current?.abort(); abort.current = null;
    setLevel(0); setState("idle");
  };

  const finish = async () => {
    const r = rec.current; rec.current = null;
    if (!r) return;
    setState("processing"); setLevel(0);
    try {
      const file = await r.stop();
      abort.current = new AbortController();
      const text = await transcribeFile(file, abort.current.signal);
      if (text) onTranscript(text);
      else toast({ title: "صدایی تشخیص داده نشد، دوباره امتحان کنید" });
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        toast({ title: (e as Error)?.message === "empty" ? "ضبط خیلی کوتاه بود" : "تبدیل صدا انجام نشد، دوباره امتحان کنید" });
      }
    } finally {
      abort.current = null;
      setState("idle");
    }
  };

  useEffect(() => {
    if (state === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
      if (e.key === "Enter" && state === "recording") { e.preventDefault(); void finish(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const label = state === "processing" ? "در حال تبدیل صدا…" : "در حال شنیدن…";
  const active = state !== "idle";
  const mobile = variant === "mobile";

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={disabled || active}
        aria-label="پیام صوتی"
        title="پیام صوتی"
        className={buttonClassName}
        style={buttonStyle}
      >
        <Mic className="w-4 h-4 text-muted-foreground" />
      </button>

      {active && (
        <div
          dir="rtl"
          role="dialog"
          aria-label="ضبط پیام صوتی"
          className={cn(
            "absolute inset-0 z-20 flex items-center bg-card animate-fade-in",
            mobile ? "rounded-[inherit] gap-3 px-3" : "rounded-xl gap-4 px-4",
          )}
        >
          <VoiceOrb level={level} processing={state === "processing"} size={mobile ? 44 : 40} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm text-foreground">{label}</span>
            {state === "recording" && (
              <span className="text-xs text-muted-foreground tabular-nums">
                <bdi>{fa(Math.floor(secs / 60))}:{fa(secs % 60)}</bdi>
              </span>
            )}
          </div>
          {!mobile && state === "recording" && (
            <div className="hidden sm:flex h-6 items-center gap-[3px]" aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="w-[3px] rounded-full bg-primary/50 transition-[height] duration-100"
                  style={{ height: `${Math.max(3, level * 24 * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + secs))))}px` }} />
              ))}
            </div>
          )}
          <button type="button" onClick={cancel} aria-label="لغو"
            className={cn("flex items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-destructive", mobile ? "h-10 w-10" : "h-9 w-9")}>
            <X className="h-4 w-4" />
          </button>
          <button type="button" onClick={finish} disabled={state !== "recording"} aria-label="پایان ضبط"
            className={cn("flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50", mobile ? "h-11 w-11" : "h-10 w-10")}>
            <Check className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
};
