import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Aspect ratio class, defaults to 16:9 */
  aspectClass?: string;
}

/**
 * Resilient image that:
 * - Shows a shimmer skeleton while loading
 * - Fades in on success
 * - Falls back to a branded gradient with the first letter of `alt` on error or no src
 */
export function ProductImage({
  src,
  alt,
  className,
  aspectClass = "aspect-video",
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;
  const letter = (alt?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-secondary/40",
        aspectClass,
        className,
      )}
    >
      {/* Shimmer skeleton */}
      {!showFallback && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60" />
      )}

      {/* Real image */}
      {!showFallback && (
        // eslint-disable-next-line jsx-a11y/img-redundant-alt
        <img
          src={src ?? undefined}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {/* Branded fallback */}
      {showFallback && (
        <div
          className="absolute inset-0 flex items-center justify-center text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
          aria-label={alt}
        >
          <span className="font-bold text-4xl tracking-tight opacity-90 select-none">
            {letter}
          </span>
        </div>
      )}
    </div>
  );
}
