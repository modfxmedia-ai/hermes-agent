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
/**
 * How a scene leaves.
 *
 * One exit for a whole film reads as a template. Varying it by what the scene
 * is doing — type rises away, a product window recedes, a hard statement gets
 * whipped off laterally — is most of what makes a cut feel authored.
 */
export type ExitKind = "rise" | "sink" | "whip" | "recede";

export const SceneBody: React.FC<{
  /** Scene length in seconds. */
  dur: number;
  exitFor?: number;
  exit?: ExitKind;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ dur, exitFor = 0.42, exit = "rise", children, style }) => {
  const t = useSeconds();
  const out = track(t, dur - exitFor, exitFor, "swiftOut");

  const transform =
    exit === "rise"
      ? `translate3d(0, ${out * -54}px, 0)`
      : exit === "sink"
        ? `translate3d(0, ${out * 46}px, 0) scale(${1 - out * 0.03})`
        : exit === "whip"
          ? `translate3d(${out * -160}px, 0, 0) skewX(${out * -4}deg)`
          : `scale(${1 - out * 0.08}) translate3d(0, ${out * 14}px, 0)`;

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        transform,
        filter: out > 0 ? `blur(${out * (exit === "whip" ? 18 : 12)}px)` : undefined,
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
  format === "landscape" ? 1 : format === "vertical" ? 0.8 : 0.82;

export const framePad = (format: FormatName) => SAFE[format];

export const mixv = mix;
