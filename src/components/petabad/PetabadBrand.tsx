import petabadIcon from "@/assets/petabad-logo.svg";
import petabadFullLogo from "@/assets/petabad-logo-full.svg";
import { cn } from "@/lib/utils";

type MarkSize = "hero" | "brand" | "chat" | "avatar";
type WordmarkSize = "brand" | "chat" | "compact";

const markSizes: Record<MarkSize, string> = {
  hero: "h-20 w-20 rounded-2xl",
  brand: "h-11 w-11 rounded-xl",
  chat: "h-10 w-10 rounded-xl",
  avatar: "h-8 w-8 rounded-full",
};

// Full logo aspect ratio is ~331 x 52 (6.4:1)
const wordmarkSizes: Record<WordmarkSize, string> = {
  brand: "h-[30px] w-[192px]",
  chat: "h-[26px] w-[167px]",
  compact: "h-[23px] w-[147px]",
};

export const PetabadMark = ({
  size = "brand",
  className,
  imageUrl,
  alt = "",
}: {
  size?: MarkSize;
  className?: string;
  imageUrl?: string;
  alt?: string;
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary",
      markSizes[size],
      className,
    )}
  >
    <img
      src={imageUrl || petabadIcon}
      alt={alt}
      className={cn("object-contain", imageUrl ? "h-full w-full" : "h-[78%] w-[78%]")}
      draggable={false}
    />
  </span>
);

export const PetabadWordmark = ({
  size = "brand",
  className,
}: {
  size?: WordmarkSize;
  className?: string;
}) => (
  <img
    src={petabadFullLogo}
    alt="پت آباد"
    className={cn("block shrink-0 object-contain", wordmarkSizes[size], className)}
    draggable={false}
  />
);

export const PetabadBrandLockup = ({
  subtitle,
  compact = false,
  variant = "default",
  className,
}: {
  subtitle?: string;
  imageUrl?: string;
  compact?: boolean;
  variant?: "default" | "chat";
  className?: string;
}) => (
  <div className={cn("flex min-w-0 flex-col items-start gap-1", className)}>
    <PetabadWordmark size={compact ? "compact" : variant === "chat" ? "chat" : "brand"} />
    {subtitle ? <p className="text-xs leading-none text-muted-foreground">{subtitle}</p> : null}
  </div>
);
