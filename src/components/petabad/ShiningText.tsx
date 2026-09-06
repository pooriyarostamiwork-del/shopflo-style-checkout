import { motion } from "motion/react";

/** Text with a light sweep travelling across it — used while the assistant thinks. */
export const ShiningText = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => (
  <motion.span
    className={`inline-block bg-clip-text text-transparent ${className}`}
    style={{
      backgroundImage:
        "linear-gradient(110deg, hsl(var(--muted-foreground)), 35%, hsl(var(--foreground)), 50%, hsl(var(--muted-foreground)), 75%, hsl(var(--muted-foreground)))",
      backgroundSize: "200% 100%",
    }}
    initial={{ backgroundPosition: "200% 0" }}
    animate={{ backgroundPosition: "-200% 0" }}
    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
  >
    {text}
  </motion.span>
);
