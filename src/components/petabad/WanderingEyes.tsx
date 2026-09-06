import { cn } from "@/lib/utils";

interface WanderingEyesProps {
  className?: string;
  /** Full look-and-blink cycle, e.g. "3s" */
  duration?: string;
  eyeColor?: string;
  pupilColor?: string;
  eyeScale?: number;
  gapScale?: number;
  pupilScale?: number;
  blinkScale?: number;
  travelScale?: number;
  label?: string;
}

/**
 * Playful pair of animated eyes that look around and blink.
 * CSS-only (see `.wandering-eyes` in src/index.css), respects reduced motion.
 */
export const WanderingEyes = ({
  className,
  duration,
  eyeColor,
  pupilColor,
  eyeScale,
  gapScale,
  pupilScale,
  blinkScale,
  travelScale,
  label = "در حال پردازش",
}: WanderingEyesProps) => {
  const style = {
    ...(duration ? { ["--duration" as string]: duration } : {}),
    ...(eyeColor ? { ["--eye-color" as string]: eyeColor } : {}),
    ...(pupilColor ? { ["--pupil-color" as string]: pupilColor } : {}),
    ...(eyeScale ? { ["--eye-scale" as string]: `${eyeScale}` } : {}),
    ...(gapScale ? { ["--gap-scale" as string]: `${gapScale}` } : {}),
    ...(pupilScale ? { ["--pupil-scale" as string]: `${pupilScale}` } : {}),
    ...(blinkScale ? { ["--blink-scale" as string]: `${blinkScale}` } : {}),
    ...(travelScale ? { ["--travel-scale" as string]: `${travelScale}` } : {}),
  } as React.CSSProperties;

  return (
    <span
      className={cn("wandering-eyes", className)}
      style={style}
      role="img"
      aria-label={label}
    >
      <span className="wandering-eyes__eye">
        <span className="wandering-eyes__socket">
          <span className="wandering-eyes__pupil" />
        </span>
      </span>
      <span className="wandering-eyes__eye" style={{ animationDelay: "0.05s" }}>
        <span className="wandering-eyes__socket">
          <span className="wandering-eyes__pupil" />
        </span>
      </span>
    </span>
  );
};
