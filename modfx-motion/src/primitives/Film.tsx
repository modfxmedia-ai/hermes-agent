import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { type Brand, alpha } from "../brand/tokens";
import { rand } from "../core/timing";

/**
 * Animated film grain.
 *
 * One static noise tile, re-offset every frame by a deterministic amount.
 * Generating fresh noise per frame is both slower and worse — real grain has
 * consistent structure, it just moves. The tile is an inline SVG turbulence
 * so there is no asset to ship.
 */
export const Grain: React.FC<{ amount: number; size?: number }> = ({
  amount,
  size = 160,
}) => {
  const frame = useCurrentFrame();
  // Hold each grain position for 2 frames: 30fps grain that changes every
  // frame reads as digital noise, 15fps grain reads as film.
  const step = Math.floor(frame / 2);
  const x = Math.round(rand(step * 2 + 1) * size);
  const y = Math.round(rand(step * 2 + 2) * size);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
        backgroundPosition: `${-x}px ${-y}px`,
        opacity: amount,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

/** Corner falloff. Pulls the eye to centre and hides shader edge artefacts. */
export const Vignette: React.FC<{ strength: number; color?: string }> = ({
  strength,
  color = "#000000",
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 68% at 50% 46%, transparent 32%, ${alpha(
        color,
        strength * 0.5,
      )} 72%, ${alpha(color, strength)} 100%)`,
      pointerEvents: "none",
    }}
  />
);

/**
 * Chromatic aberration, faked with two offset copies of the frame.
 *
 * Real aberration needs a per-channel shader pass over the composited frame,
 * which Remotion can't do cheaply. This approximation — a red-shifted and a
 * cyan-shifted ghost at very low opacity, strongest at the edges — reads
 * identically at 1-2px and costs nothing.
 */
export const EdgeAberration: React.FC<{ amount?: number }> = ({
  amount = 1,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 55%, rgba(255,40,40,${
          0.028 * amount
        }) 100%)`,
        transform: `translateX(${-1.2 * amount}px)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 55%, rgba(40,180,255,${
          0.028 * amount
        }) 100%)`,
        transform: `translateX(${1.2 * amount}px)`,
      }}
    />
  </AbsoluteFill>
);

/** Cinematic bars. `ratio` is the target aspect, e.g. 2.39 for scope. */
export const Letterbox: React.FC<{
  ratio?: number;
  color?: string;
  progress?: number;
}> = ({ ratio = 2.39, color = "#000000", progress = 1 }) => {
  const barPct = Math.max(0, (1 - 16 / 9 / ratio) / 2) * 100 * progress;
  if (barPct <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${barPct}%`,
          background: color,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${barPct}%`,
          background: color,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * The grade. Wrap a whole film in this once, at the top level.
 *
 * Order matters: aberration sits under grain, grain sits under the vignette,
 * and all three sit above every scene. Applying the grade per-scene makes
 * cuts visible as a grain jump.
 */
export const FilmGrade: React.FC<{
  brand: Brand;
  aberration?: number;
  letterbox?: number;
  children?: React.ReactNode;
}> = ({ brand, aberration = 1, letterbox, children }) => (
  <AbsoluteFill style={{ backgroundColor: brand.color.bg }}>
    {children}
    <EdgeAberration amount={aberration} />
    <Grain amount={brand.grain} />
    <Vignette strength={brand.vignette} color={brand.color.bgDeep} />
    {letterbox ? <Letterbox ratio={letterbox} color={brand.color.bgDeep} /> : null}
  </AbsoluteFill>
);
