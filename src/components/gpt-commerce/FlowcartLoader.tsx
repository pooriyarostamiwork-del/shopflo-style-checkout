import { useId } from "react";
import { cn } from "@/lib/utils";

export const FlowcartLoader = ({ className }: { className?: string }) => {
  const clipId = `flowcart-loader-${useId().replace(/:/g, "")}`;

  return (
    <span className={cn("flowcart-loader", className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <defs>
          <clipPath id={clipId}>
            <polygon points="50,4 65,36 96,50 65,64 50,96 35,64 4,50 35,36" />
            <polygon points="50,12 60,40 88,50 60,60 50,88 40,60 12,50 40,40" />
            <polygon points="50,20 58,42 80,50 58,58 50,80 42,58 20,50 42,42" />
            <polygon points="16,16 42,29 29,42" />
            <polygon points="84,16 71,42 58,29" />
            <polygon points="84,84 58,71 71,58" />
            <polygon points="16,84 29,58 42,71" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect className="flowcart-loader__fill" width="100" height="100" />
        </g>
      </svg>
    </span>
  );
};