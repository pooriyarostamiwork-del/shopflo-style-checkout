import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TypingTextProps {
  text: string;
  className?: string;
  /** Per-character stagger in seconds */
  delay?: number;
}

/**
 * Character-by-character typewriter reveal. RTL safe (uses inline spans).
 */
export const TypingText = ({ text, className, delay = 0.035 }: TypingTextProps) => (
  <motion.span
    key={text}
    className={cn("inline-block", className)}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: delay } },
    }}
    aria-label={text}
  >
    {Array.from(text).map((char, i) => (
      <motion.span
        key={`${char}-${i}`}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.01 } },
        }}
        aria-hidden="true"
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </motion.span>
);
