import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingTextProps {
  text: string;
  className?: string;
  /** Per-character delay in seconds */
  delay?: number;
}

/**
 * Typewriter reveal rendered as ONE text node (text.slice), so Persian
 * letters stay joined on every mobile browser.
 */
export const TypingText = ({ text, className, delay = 0.035 }: TypingTextProps) => {
  const chars = Array.from(text);
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= chars.length) window.clearInterval(id);
    }, Math.max(10, delay * 1000));
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay]);
  return (
    <span className={cn("inline-block", className)} aria-label={text}>
      {chars.slice(0, count).join("")}
    </span>
  );
};
