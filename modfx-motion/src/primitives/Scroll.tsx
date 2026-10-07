import React from "react";
import { Img } from "remotion";
import { type Brand, alpha } from "../brand/tokens";
import { type Curve, track, mix } from "../core/easing";
import { useSeconds, rand } from "../core/timing";

/**
 * Seamless infinite ticker.
 *
 * The content is rendered twice and translated by exactly one copy's width,
 * so the wrap is invisible and the loop never pops. Speed is in viewport
 * widths per second; 0.06-0.12 reads as "ambient", above 0.3 reads as urgent.
 */
export const Marquee: React.FC<{
  items: string[];
  speed?: number;
  direction?: "left" | "right";
  size?: number;
  gap?: number;
  color?: string;
  separator?: string;
  fontFamily?: string;
  weight?: number;
  tracking?: number;
  opacity?: number;
  /** Fade the ends into the background so the strip has no hard edges. */
  fadeEdges?: string;
  style?: React.CSSProperties;
}> = ({
  items,
  speed = 0.08,
  direction = "left",
  size = 54,
  gap = 64,
  color,
  separator = "—",
  fontFamily,
  weight = 500,
  tracking = -0.02,
  opacity = 1,
  fadeEdges,
  style,
}) => {
  const t = useSeconds();
  const shift = ((t * speed * 100) % 50) * (direction === "left" ? -1 : 1);
  const row = [...items, ...items, ...items, ...items];

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        opacity,
        maskImage: fadeEdges
          ? "linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)"
          : undefined,
        WebkitMaskImage: fadeEdges
          ? "linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)"
          : undefined,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap,
          width: "max-content",
          transform: `translate3d(${shift}%, 0, 0)`,
          whiteSpace: "nowrap",
          fontFamily,
          fontSize: size,
          fontWeight: weight,
          letterSpacing: `${tracking}em`,
          color,
        }}
      >
        {row.map((item, i) => (
          <React.Fragment key={i}>
            <span>{item}</span>
            {separator ? (
              <span style={{ opacity: 0.32 }}>{separator}</span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/**
 * Vertical columns drifting at different speeds — the "wall of work" shot.
 *
 * Differential speed between adjacent columns is what sells depth. Keep the
 * spread tight (0.7x to 1.4x of base) or it stops reading as one surface and
 * starts reading as three unrelated animations.
 */
export const ParallaxRail: React.FC<{
  brand: Brand;
  columns: React.ReactNode[][];
  speed?: number;
  /** Per-column speed multipliers. Defaults to a gentle alternating spread. */
  multipliers?: number[];
  gap?: number;
  tilt?: number;
  scale?: number;
  style?: React.CSSProperties;
}> = ({
  brand,
  columns,
  speed = 90,
  multipliers,
  gap = 28,
  tilt = 0,
  scale = 1,
  style,
}) => {
  const t = useSeconds();
  return (
    <div
      style={{
        position: "absolute",
        inset: "-20%",
        display: "flex",
        gap,
        justifyContent: "center",
        transform: `rotate(${tilt}deg) scale(${scale})`,
        transformOrigin: "center",
        ...style,
      }}
    >
      {columns.map((col, ci) => {
        const mult = multipliers?.[ci] ?? (ci % 2 === 0 ? 1 : 0.74) + ci * 0.05;
        const dir = ci % 2 === 0 ? -1 : 1;
        const y = ((t * speed * mult * dir) % 2000) - (dir < 0 ? 0 : 2000);
        return (
          <div
            key={ci}
            style={{
              display: "flex",
              flexDirection: "column",
              gap,
              transform: `translate3d(0, ${y}px, 0)`,
            }}
          >
            {[...col, ...col, ...col].map((node, i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                {node}
              </div>
            ))}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${brand.color.bg} 0%, transparent 22%, transparent 78%, ${brand.color.bg} 100%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/**
 * Eased scroll-scrub over a tall capture.
 *
 * This is how a real website gets into the film: capture the page as one tall
 * image, then move it behind a fixed window. Scrubbing with `cinematic` (slow
 * in, slow out) is what separates a designed camera move from a CSS
 * `scroll-behavior: smooth` recording.
 */
export const ScrollScrub: React.FC<{
  src: string;
  /** 0..1 of the image's own height, start and end of the move. */
  from?: number;
  to?: number;
  start?: number;
  duration?: number;
  curve?: Curve;
  /** Subtle push-in across the move. 1.0 = none. */
  zoom?: [number, number];
  style?: React.CSSProperties;
}> = ({
  src,
  from = 0,
  to = 0.6,
  start = 0,
  duration = 3,
  curve = "cinematic",
  zoom = [1, 1.04],
  style,
}) => {
  const t = useSeconds();
  const p = track(t, start, duration, curve);
  const y = mix(from, to, p);
  const z = mix(zoom[0], zoom[1], p);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>
      <Img
        src={src}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "auto",
          transform: `translate3d(0, ${-y * 100}%, 0) scale(${z})`,
          transformOrigin: "center top",
        }}
      />
    </div>
  );
};

/** Faint animated grid. Depth cue behind UI shots; never the subject. */
export const GridField: React.FC<{
  brand: Brand;
  cell?: number;
  speed?: number;
  opacity?: number;
  perspective?: boolean;
}> = ({ brand, cell = 72, speed = 6, opacity = 0.5, perspective = false }) => {
  const t = useSeconds();
  const off = (t * speed) % cell;
  const line = alpha(brand.color.inkFaint, 0.5);
  return (
    <div
      style={{
        position: "absolute",
        inset: perspective ? "-40%" : 0,
        opacity,
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: `${cell}px ${cell}px`,
        backgroundPosition: `${off}px ${off}px`,
        transform: perspective ? "rotateX(62deg) scale(1.6)" : undefined,
        transformOrigin: "center 60%",
        maskImage:
          "radial-gradient(ellipse 65% 60% at 50% 45%, #000 20%, transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 65% 60% at 50% 45%, #000 20%, transparent 78%)",
        pointerEvents: "none",
      }}
    />
  );
};

/** Drifting specks. Atmosphere between heavier shots. Deterministic. */
export const Motes: React.FC<{
  brand: Brand;
  count?: number;
  speed?: number;
  opacity?: number;
}> = ({ brand, count = 42, speed = 14, opacity = 0.45 }) => {
  const t = useSeconds();
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = rand(i * 2.7) * 100;
        const baseY = rand(i * 5.3) * 120 - 10;
        const drift = (t * speed * (0.4 + rand(i * 9.1))) % 130;
        const y = (baseY + drift) % 130 - 10;
        const s = 1 + rand(i * 3.3) * 2.2;
        const tw = 0.3 + Math.sin(t * (0.7 + rand(i * 7.1)) + i) * 0.35;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: s,
              height: s,
              borderRadius: "50%",
              background: i % 5 === 0 ? brand.color.accent : brand.color.ink,
              opacity: Math.max(0, tw),
              filter: `blur(${s > 2 ? 0.6 : 0}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
