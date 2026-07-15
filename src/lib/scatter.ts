import type React from "react";

/** Deterministic scatter tilt/offset — shared with Explore. */
export function scatterStyle(id: string, index: number): React.CSSProperties {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  hash = (hash + index * 97) >>> 0;
  const tilt = ((hash % 13) - 6) * 0.9;
  const shiftX = ((hash >> 4) % 17) - 8;
  const shiftY = ((hash >> 8) % 9) - 4;
  return {
    transform: `rotate(${tilt.toFixed(2)}deg) translate(${shiftX}px, ${shiftY}px)`,
  };
}
