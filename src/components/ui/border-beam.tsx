"use client";

import React, { CSSProperties, useEffect, useRef } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  lightWidth?: number;
  duration?: number;
  lightColor?: string;
  borderWidth?: number;
  className?: string;
  [key: string]: unknown;
}

type BeamStyle = CSSProperties & {
  "--path"?: string;
  "--beam-color"?: string;
  "--beam-width"?: string;
};

export function BorderBeam({
  lightWidth = 120,
  duration = 5,
  lightColor = "hsl(var(--primary))",
  borderWidth = 1,
  className,
  ...props
}: BorderBeamProps) {
  const pathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = pathRef.current;
    if (!div) return;

    const updatePath = () => {
      div.style.setProperty(
        "--path",
        `path("M 0 0 H ${div.offsetWidth} V ${div.offsetHeight} H 0 V 0")`,
      );
    };

    updatePath();
    const observer = new ResizeObserver(updatePath);
    observer.observe(div);
    window.addEventListener("resize", updatePath);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePath);
    };
  }, []);

  const style: BeamStyle = {
    padding: borderWidth,
    "--beam-color": lightColor,
    "--beam-width": `${lightWidth}px`,
  };

  return (
    <div
      ref={pathRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-200",
        "[mask:linear-gradient(transparent_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:intersect]",
        className,
      )}
      style={style}
      {...props}
    >
      <motion.span
        className="absolute left-0 top-0 h-3 [offset-path:var(--path)]"
        style={{
          width: "var(--beam-width)",
          background:
            "linear-gradient(90deg, transparent, var(--beam-color), transparent)",
        }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}