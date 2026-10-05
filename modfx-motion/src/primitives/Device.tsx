import React from "react";
import { type Brand, alpha } from "../brand/tokens";
import { track, mix } from "../core/easing";
import { useSeconds } from "../core/timing";

/**
 * Browser chrome for real site captures.
 *
 * Deliberately minimal and unbranded: a convincing frame makes the capture
 * read as "a real website", an over-detailed one makes it read as a mockup
 * of a website. No OS buttons, no bookmarks bar, no fake favicon.
 */
export const BrowserFrame: React.FC<{
  brand: Brand;
  url?: string;
  width?: number | string;
  height?: number | string;
  radius?: number;
  start?: number;
  duration?: number;
  /** Entry: rise + scale + blur, like every other object in the system. */
  animate?: boolean;
  glow?: boolean;
  tilt?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  brand,
  url,
  width = "72%",
  height = "74%",
  radius = 14,
  start = 0,
  duration = 1.2,
  animate = true,
  glow = true,
  tilt = 0,
  children,
  style,
}) => {
  const t = useSeconds();
  const p = animate ? track(t, start, duration, "heroOut") : 1;
  const bar = 38;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: radius,
        overflow: "hidden",
        background: brand.color.surface,
        border: `1px solid ${brand.color.line}`,
        boxShadow: glow
          ? `0 60px 140px -40px ${alpha(brand.color.accent, 0.3 * p)}, 0 30px 90px -30px rgba(0,0,0,0.85)`
          : "0 30px 90px -30px rgba(0,0,0,0.85)",
        opacity: mix(0, 1, Math.min(1, p * 1.5)),
        transform: `perspective(2400px) rotateY(${tilt}deg) translate3d(0, ${(1 - p) * 56}px, 0) scale(${mix(0.965, 1, p)})`,
        filter: p < 1 ? `blur(${mix(14, 0, p)}px)` : undefined,
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 14px",
          background: brand.color.bgDeep,
          borderBottom: `1px solid ${brand.color.line}`,
          flexShrink: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: brand.color.line,
            }}
          />
        ))}
        {url ? (
          <span
            style={{
              marginLeft: 14,
              fontFamily: brand.type.mono,
              fontSize: 12,
              letterSpacing: "0.02em",
              color: brand.color.inkMuted,
            }}
          >
            {url}
          </span>
        ) : null}
      </div>
      <div style={{ position: "absolute", inset: `${bar}px 0 0 0`, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

/** Phone frame for vertical captures and app shots. */
export const PhoneFrame: React.FC<{
  brand: Brand;
  height?: number;
  start?: number;
  duration?: number;
  animate?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  brand,
  height = 760,
  start = 0,
  duration = 1.2,
  animate = true,
  children,
  style,
}) => {
  const t = useSeconds();
  const p = animate ? track(t, start, duration, "heroOut") : 1;
  const width = height * (9 / 19.5);
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: height * 0.055,
        padding: 9,
        background: "#15181D",
        border: `1px solid ${brand.color.line}`,
        boxShadow: `0 60px 130px -40px ${alpha(brand.color.accent, 0.28 * p)}, 0 40px 100px -30px rgba(0,0,0,0.9)`,
        opacity: Math.min(1, p * 1.5),
        transform: `translate3d(0, ${(1 - p) * 60}px, 0) scale(${mix(0.96, 1, p)})`,
        filter: p < 1 ? `blur(${mix(14, 0, p)}px)` : undefined,
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: height * 0.047,
          overflow: "hidden",
          background: brand.color.bg,
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.26,
            height: 7,
            borderRadius: 4,
            background: "#000",
          }}
        />
      </div>
    </div>
  );
};

/**
 * Clip-path wipe. Reveals children from an edge without moving them.
 *
 * Use this for images and UI: sliding a photograph in from the side looks
 * cheap, uncovering it in place looks designed.
 */
export const Wipe: React.FC<{
  start?: number;
  duration?: number;
  from?: "bottom" | "top" | "left" | "right";
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ start = 0, duration = 1, from = "bottom", children, style }) => {
  const t = useSeconds();
  const p = track(t, start, duration, "heroOut");
  const hidden = (1 - p) * 100;
  const inset =
    from === "bottom"
      ? `${hidden}% 0 0 0`
      : from === "top"
        ? `0 0 ${hidden}% 0`
        : from === "left"
          ? `0 ${hidden}% 0 0`
          : `0 0 0 ${hidden}%`;
  return (
    <div style={{ clipPath: `inset(${inset})`, ...style }}>{children}</div>
  );
};

/** Thin accent rule that draws itself. Good section divider. */
export const Rule: React.FC<{
  brand: Brand;
  start?: number;
  duration?: number;
  width?: number | string;
  thickness?: number;
  color?: string;
}> = ({ brand, start = 0, duration = 0.9, width = 120, thickness = 2, color }) => {
  const t = useSeconds();
  const p = track(t, start, duration, "quintOut");
  return (
    <div
      style={{
        width,
        height: thickness,
        background: `linear-gradient(90deg, ${color ?? brand.color.accent}, ${alpha(
          color ?? brand.color.accent,
          0,
        )})`,
        transform: `scaleX(${p})`,
        transformOrigin: "left center",
      }}
    />
  );
};

/**
 * Odometer-style number that counts up.
 *
 * Counts on a decelerating curve so the last few digits crawl — the same
 * reason a slot machine slows before it stops. A linear count feels like a
 * progress bar; this feels like an achievement.
 */
export const Counter: React.FC<{
  brand: Brand;
  to: number;
  from?: number;
  start?: number;
  duration?: number;
  size?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({
  brand,
  to,
  from = 0,
  start = 0,
  duration = 1.6,
  size = 96,
  prefix = "",
  suffix = "",
  decimals = 0,
  color,
  style,
}) => {
  const t = useSeconds();
  const p = track(t, start, duration, "quintOut");
  const value = mix(from, to, p);
  return (
    <span
      style={{
        fontFamily: brand.type.display,
        fontSize: size,
        fontWeight: brand.type.displayWeight,
        letterSpacing: `${brand.type.displayTracking}em`,
        color: color ?? brand.color.ink,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};
