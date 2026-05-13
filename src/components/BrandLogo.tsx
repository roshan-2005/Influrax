import { useState } from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** Brand display name, used for fallback letter */
  name: string;
  /** Direct logo URL (preferred) */
  logoUrl?: string | null;
  /** Brand website — used to derive a Google favicon as a fallback */
  website?: string | null;
  className?: string;
  /** Pixel size, default 40 */
  size?: number;
}

function deriveFaviconUrl(website?: string | null): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return null;
  }
}

/** Brand logo with three-tier fallback: explicit URL → Google favicon → letter avatar. */
export function BrandLogo({ name, logoUrl, website, className, size = 40 }: BrandLogoProps) {
  const [step, setStep] = useState<0 | 1 | 2>(logoUrl ? 0 : website ? 1 : 2);

  const src =
    step === 0 ? logoUrl : step === 1 ? deriveFaviconUrl(website) : null;

  const letter = (name?.trim()?.[0] ?? "?").toUpperCase();

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full text-primary-foreground font-bold flex-shrink-0",
          className,
        )}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          background: "var(--gradient-primary)",
        }}
        aria-label={name}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      onError={() => setStep((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : 2))}
      className={cn(
        "rounded-full bg-secondary object-contain flex-shrink-0 border border-border/60",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
