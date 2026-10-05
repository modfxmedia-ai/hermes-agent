import React from "react";
import { type Brand } from "../brand/tokens";
import { type Curve } from "../core/easing";
import { useSeconds } from "../core/timing";
import { track, mix } from "../core/easing";

export type RevealMode = "line" | "word" | "char";

/**
 * Masked type reveal — the single most load-bearing effect in the system.
 *
 * Each unit sits inside an `overflow: hidden` window and slides up from below
 * its own baseline. Nothing fades in from nowhere; everything arrives from
 * somewhere, which is why it reads as physical rather than as a PowerPoint
 * build. Three details carry it:
 *
 *   1. The slide is 100%+ of the line box, so the glyph is genuinely offscreen
 *      at t=0 and the mask edge is invisible.
 *   2. A 10px -> 0 blur runs alongside, giving a focus-pull.
 *   3. Units stagger by ~60ms, so a three-line headline reads as one gesture.
 */
export const KineticType: React.FC<{
  brand: Brand;
  lines: string[];
  /** Font size in px at 1080p. Scale it yourself for other formats. */
  size: number;
  start?: number;
  duration?: number;
  stagger?: number;
  mode?: RevealMode;
  align?: "left" | "center" | "right";
  weight?: number;
  tracking?: number;
  lineHeight?: number;
  color?: string;
  /** Render these line indices in the serif face, for a mixed-voice headline. */
  serifLines?: number[];
  italicLines?: number[];
  accentLines?: number[];
  curve?: Curve;
  /** Slide distance as a fraction of the line box. 1.1 clears descenders. */
  travel?: number;
  blur?: number;
  style?: React.CSSProperties;
}> = ({
  brand,
  lines,
  size,
  start = 0,
  duration = 1.05,
  stagger,
  mode = "line",
  align = "left",
  weight,
  tracking,
  lineHeight = 0.96,
  color,
  serifLines = [],
  italicLines = [],
  accentLines = [],
  curve = "heroOut",
  travel = 1.12,
  blur = 10,
  style,
}) => {
  const t = useSeconds();
  const step = stagger ?? brand.motion.stagger;
  const trackEm = tracking ?? brand.type.displayTracking;
  const w = weight ?? brand.type.displayWeight;

  let unitIndex = 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, li) => {
        const isSerif = serifLines.includes(li);
        const units =
          mode === "line"
            ? [line]
            : mode === "word"
              ? line.split(" ")
              : Array.from(line);

        return (
          <div
            key={li}
            style={{
              // The mask window. Extra bottom padding + matching negative
              // margin keeps descenders from being clipped by the overflow.
              overflow: "hidden",
              paddingBottom: size * 0.22,
              marginBottom: -size * 0.22,
              display: "flex",
              flexWrap: "nowrap",
              justifyContent:
                align === "center"
                  ? "center"
                  : align === "right"
                    ? "flex-end"
                    : "flex-start",
            }}
          >
            {units.map((unit, ui) => {
              const i = unitIndex++;
              const p = track(t, start + i * step, duration, curve);
              return (
                <span
                  key={ui}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    transform: `translate3d(0, ${(1 - p) * travel * 100}%, 0)`,
                    filter: p < 1 ? `blur(${mix(blur, 0, p)}px)` : undefined,
                    opacity: mix(0, 1, Math.min(1, p * 1.6)),
                    fontFamily: isSerif
                      ? brand.type.body.includes("Serif")
                        ? brand.type.body
                        : '"Instrument Serif", Georgia, serif'
                      : brand.type.display,
                    fontStyle: italicLines.includes(li) ? "italic" : "normal",
                    fontWeight: isSerif ? 400 : w,
                    fontSize: size,
                    lineHeight,
                    letterSpacing: `${isSerif ? trackEm * 0.45 : trackEm}em`,
                    color: accentLines.includes(li)
                      ? brand.color.accent
                      : (color ?? brand.color.ink),
                    willChange: "transform, filter",
                  }}
                >
                  {unit}
                  {mode === "word" && ui < units.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** Small, uppercase, widely tracked. The label above a headline. */
export const Eyebrow: React.FC<{
  brand: Brand;
  children: string;
  size?: number;
  start?: number;
  duration?: number;
  color?: string;
  dot?: boolean;
  style?: React.CSSProperties;
}> = ({
  brand,
  children,
  size = 15,
  start = 0,
  duration = 0.8,
  color,
  dot = true,
  style,
}) => {
  const t = useSeconds();
  const p = track(t, start, duration, "quintOut");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.75,
        opacity: p,
        transform: `translate3d(0, ${(1 - p) * 10}px, 0)`,
        fontFamily: brand.type.mono,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: `${brand.type.eyebrowTracking}em`,
        textTransform: "uppercase",
        color: color ?? brand.color.inkMuted,
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: "50%",
            background: brand.color.accent,
            boxShadow: `0 0 ${size}px ${brand.color.accent}`,
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </div>
  );
};

/** Supporting paragraph. Fades and rises a short distance — never masked. */
export const BodyCopy: React.FC<{
  brand: Brand;
  children: React.ReactNode;
  size?: number;
  start?: number;
  duration?: number;
  maxWidth?: number;
  color?: string;
  align?: "left" | "center";
  style?: React.CSSProperties;
}> = ({
  brand,
  children,
  size = 26,
  start = 0,
  duration = 0.9,
  maxWidth = 640,
  color,
  align = "left",
  style,
}) => {
  const t = useSeconds();
  const p = track(t, start, duration, "quintOut");
  return (
    <p
      style={{
        margin: 0,
        maxWidth,
        textAlign: align,
        opacity: p,
        transform: `translate3d(0, ${(1 - p) * 18}px, 0)`,
        fontFamily: brand.type.body,
        fontSize: size,
        fontWeight: 400,
        lineHeight: 1.45,
        letterSpacing: "-0.011em",
        color: color ?? brand.color.inkMuted,
        ...style,
      }}
    >
      {children}
    </p>
  );
};

/**
 * Specular sweep across an element. Pass it as a child of a `position:
 * relative` wrapper with the same clip as the content.
 *
 * This is the "polished metal" cue — a narrow, skewed highlight that crosses
 * the type once, well after it has settled. Used more than once per film it
 * stops reading as light and starts reading as a slideshow transition.
 */
export const LightSweep: React.FC<{
  start: number;
  duration?: number;
  width?: number;
  angle?: number;
  color?: string;
  intensity?: number;
}> = ({
  start,
  duration = 1.1,
  width = 22,
  angle = -18,
  color = "#FFFFFF",
  intensity = 0.5,
}) => {
  const t = useSeconds();
  const p = track(t, start, duration, "cinematic");
  if (p <= 0 || p >= 1) return null;
  const x = mix(-40, 140, p);
  return (
    <div
      style={{
        position: "absolute",
        inset: `-20% -40%`,
        pointerEvents: "none",
        mixBlendMode: "screen",
        background: `linear-gradient(${90 + angle}deg, transparent ${x - width}%, ${color}${Math.round(
          intensity * 255,
        )
          .toString(16)
          .padStart(2, "0")} ${x}%, transparent ${x + width}%)`,
      }}
    />
  );
};
