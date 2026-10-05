import React from "react";
import { AbsoluteFill } from "remotion";
import { track, mix } from "../core/easing";
import { useSeconds } from "../core/timing";

/**
 * Every scene's foreground lives inside one of these.
 *
 * Scenes do not cross-dissolve. A crossfade between two populated layouts
 * produces a double exposure — two headlines legible at once, both unreadable
 * — which is the single most common failure in automated video. Instead the
 * outgoing content leaves first (rise + blur + fade, ~0.4s) and the incoming
 * content arrives after, against a background that never cuts at all.
 */
export const SceneBody: React.FC<{
  /** Scene length in seconds. */
  dur: number;
  exitFor?: number;
  /** Distance the group travels on exit, px. */
  exitTravel?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ dur, exitFor = 0.42, exitTravel = -54, children, style }) => {
  const t = useSeconds();
  const out = track(t, dur - exitFor, exitFor, "swiftOut");
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        transform: `translate3d(0, ${out * exitTravel}px, 0)`,
        filter: out > 0 ? `blur(${out * 12}px)` : undefined,
        willChange: "transform, opacity, filter",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Standard safe-area padding so nothing lands under a platform's UI. */
export const SAFE = {
  landscape: { x: 148, y: 110 },
  vertical: { x: 86, y: 300 },
  square: { x: 96, y: 120 },
} as const;

export type FormatName = keyof typeof SAFE;

/**
 * Scale factor for type between formats, so one film definition reads
 * correctly at 1920x1080, 1080x1920 and 1080x1080 without three sets of
 * hand-tuned sizes.
 */
export const typeScale = (format: FormatName): number =>
  format === "landscape" ? 1 : format === "vertical" ? 0.72 : 0.78;

export const framePad = (format: FormatName) => SAFE[format];

export const mixv = mix;
