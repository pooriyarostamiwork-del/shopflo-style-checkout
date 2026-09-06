import petabadIcon from "@/assets/petabad-logo.svg";
import petabadLogotype from "@/assets/petabad-logotype.svg";
import { cn } from "@/lib/utils";

type MarkSize = "hero" | "brand" | "chat" | "avatar";
type WordmarkSize = "brand" | "chat" | "compact";

const markSizes: Record<MarkSize, string> = {
  hero: "h-20 w-20 rounded-2xl",
  brand: "h-11 w-11 rounded-xl",
  chat: "h-10 w-10 rounded-xl",
  avatar: "h-8 w-8 rounded-full",
};

const wordmarkSizes: Record<WordmarkSize, string> = {
  brand: "h-[35px] w-[115px]",
  chat: "h-[31px] w-[101px]",
  compact: "h-[25px] w-[81px]",
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
  <span className={cn("relative inline-block shrink-0 overflow-hidden", wordmarkSizes[size], className)}>
    <img
      src={petabadLogotype}
      alt="PetAbad"
      className="absolute left-1/2 top-1/2 h-[190px] w-[190px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
      draggable={false}
    />
  </span>
);

export const PetabadBrandLockup = ({
  subtitle,
  imageUrl,
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
  <div className={cn("flex items-center gap-2.5", className)}>
    <PetabadMark
      size={compact ? "avatar" : variant === "chat" ? "chat" : "brand"}
      imageUrl={imageUrl}
      alt="پت آباد"
    />
    <div className="flex min-w-0 flex-col items-start gap-0.5">
      <PetabadWordmark size={compact ? "compact" : variant === "chat" ? "chat" : "brand"} />
      {subtitle ? <p className="text-xs leading-none text-muted-foreground">{subtitle}</p> : null}
    </div>
  </div>
);
