import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResolvedQuickReply } from "@/lib/quickReplies";

interface QuickReplyBarProps {
  replies: ResolvedQuickReply[];
  onPick: (text: string) => void;
  className?: string;
}

/** Horizontal row of conversation movers pinned above the composer. Collapses to nothing when empty. */
export const QuickReplyBar = ({ replies, onPick, className }: QuickReplyBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canStart, setCanStart] = useState(false);
  const [canEnd, setCanEnd] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft); // RTL scrollLeft is negative
    setCanStart(pos > 2);
    setCanEnd(max - pos > 2);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollBy({ left: -e.deltaY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", update);
    };
  }, [replies, update]);

  if (!replies.length) return null;

  const nudge = (dir: 1 | -1) => scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  return (
    <div className={cn("relative", className)} dir="rtl">
      {canStart && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />
          <button
            type="button"
            aria-label="قبلی"
            onClick={() => nudge(1)}
            className="absolute right-0 top-1/2 z-20 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground/70 hover:text-foreground md:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        onScroll={update}
        className="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {replies.map((r) => (
          <button
            key={r.id}
            type="button"
            title={r.text}
            onClick={() => onPick(r.text)}
            className={cn(
              "flex h-8 max-w-[260px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] backdrop-blur-sm transition-colors",
              r.highlight
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border/80 bg-background/80 text-foreground/80 hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {r.executional && <Zap className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{r.text}</span>
          </button>
        ))}
      </div>
      {canEnd && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
          <button
            type="button"
            aria-label="بعدی"
            onClick={() => nudge(-1)}
            className="absolute left-0 top-1/2 z-20 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground/70 hover:text-foreground md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};
