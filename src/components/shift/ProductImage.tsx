import { useState, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import shiftLogo from "@/features/shift/assets/shift-logo.svg";

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onError"> {
  src?: string | null;
  alt: string;
  className?: string;
  /** Optional extra classes applied to the fallback wrapper */
  fallbackClassName?: string;
  /** Show a faint label (defaults to first 2 chars of alt) inside the placeholder */
  showLabel?: boolean;
}

/**
 * Universal product image with graceful onError fallback.
 * Used across desktop and mobile product surfaces.
 */
export const ProductImage = ({
  src,
  alt,
  className,
  fallbackClassName,
  showLabel = true,
  loading = "lazy",
  decoding = "async",
  ...rest
}: ProductImageProps) => {
  const initialError = !src || src.trim() === "";
  const [errored, setErrored] = useState(initialError);

  useEffect(() => {
    setErrored(!src || src.trim() === "");
  }, [src]);

  if (errored) {
    const label = showLabel && alt ? alt.trim().slice(0, 2) : null;
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          "bg-gradient-to-br from-muted/60 via-muted/40 to-muted/20",
          className,
          fallbackClassName
        )}
        role="img"
        aria-label={alt}
      >
        <img
          src={shiftLogo}
          alt=""
          aria-hidden
          draggable={false}
          className="w-1/3 h-1/3 max-w-[40px] max-h-[40px] opacity-40"
          style={{ filter: "grayscale(1) brightness(0.6)" }}
        />
        {label && (
          <span className="absolute bottom-1 right-1 text-[9px] font-medium text-muted-foreground/40 uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src as string}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
};
