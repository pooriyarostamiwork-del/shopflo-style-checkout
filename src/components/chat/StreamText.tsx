import { useEffect, useRef, useState } from "react";

/**
 * Tracks which assistant message should stream. Messages present on first
 * render (history) never stream; only a newly arrived assistant reply does.
 */
export const useStreamingMessage = (messages: { id: string; role: string; content?: string }[]) => {
  const seen = useRef<Set<string> | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  if (seen.current === null) seen.current = new Set(messages.map((m) => m.id));

  useEffect(() => {
    const s = seen.current!;
    let fresh: string | null = null;
    for (const m of messages) {
      if (!s.has(m.id)) {
        s.add(m.id);
        if (m.role === "assistant" && m.content?.trim()) fresh = m.id;
      }
    }
    if (fresh) setStreamingId(fresh);
  }, [messages]);

  return { streamingId, onDone: () => setStreamingId(null) };
};

/**
 * Smooth word-by-word reveal. Words are appended to a single text node so
 * Persian letters stay joined; the newest chunk fades in.
 */
export const StreamText = ({ text, active, onDone }: { text: string; active: boolean; onDone?: () => void }) => {
  const words = useRef<string[]>([]);
  words.current = text.split(/(\s+)/);
  const [count, setCount] = useState(active ? 0 : words.current.length);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!active) { setCount(words.current.length); return; }
    let i = 0;
    const total = words.current.length;
    const step = Math.max(2, Math.ceil(total / 120));
    const id = window.setInterval(() => {
      i = Math.min(total, i + step);
      setCount(i);
      if (i >= total) { window.clearInterval(id); doneRef.current?.(); }
    }, 32);
    return () => window.clearInterval(id);
  }, [active, text]);

  if (!active || count >= words.current.length) return <>{text}</>;
  const shown = words.current.slice(0, Math.max(0, count - 2)).join("");
  const tail = words.current.slice(Math.max(0, count - 2), count).join("");
  return (
    <>
      {shown}
      <span key={count} className="stream-tail">{tail}</span>
    </>
  );
};
