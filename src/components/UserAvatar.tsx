"use client";

import { useEffect, useState } from "react";
import { resolveAvatar } from "@/lib/avatar";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Applied to the wrapping element when provided */
  wrapperClassName?: string;
  crossOrigin?: "" | "anonymous" | "use-credentials";
};

/**
 * Renders a user avatar and swaps to the default image if src is empty or fails.
 */
export function UserAvatar({
  src,
  alt = "",
  className = "h-full w-full object-cover",
  wrapperClassName,
  crossOrigin,
  seed,
}: Props & { seed?: string }) {
  const [current, setCurrent] = useState(() => resolveAvatar(src, seed));

  useEffect(() => {
    setCurrent(resolveAvatar(src, seed));
  }, [src, seed]);

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      crossOrigin={crossOrigin}
      onError={() => {
        const fallback = resolveAvatar(null, seed || src || "default");
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{img}</div>;
  }
  return img;
}
