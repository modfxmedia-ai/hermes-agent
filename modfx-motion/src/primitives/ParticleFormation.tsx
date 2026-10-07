import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { type Brand } from "../brand/tokens";
import { track, mix, clamp01 } from "../core/easing";
import { rand } from "../core/timing";

interface Pt {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  delay: number;
  r: number;
}

/**
 * Point cloud that assembles into a word, holds, then disperses.
 *
 * The "intelligence" shot. Text is rasterised to an offscreen canvas once,
 * sampled on a grid, and each surviving pixel becomes a particle with its own
 * entry vector and delay. Nothing is random at render time — every particle's
 * path is derived from its index through a seeded hash, so the shot is
 * byte-identical on every machine and can be re-rendered safely.
 *
 * Cost scales with `density`. At the default grid of 5px a 1920-wide wordmark
 * is roughly 6-9k particles, which software GL handles comfortably.
 */
export const ParticleFormation: React.FC<{
  brand: Brand;
  text: string;
  /** Font size in px. The cloud is laid out at composition resolution. */
  size?: number;
  /** Sampling grid in px. Lower = denser = slower. 4-7 is the usable band. */
  grid?: number;
  start?: number;
  /** Seconds for the cloud to assemble. */
  formFor?: number;
  /** Seconds the formed word holds before dispersing. 0 = never disperse. */
  holdFor?: number;
  disperseFor?: number;
  /** How far particles start from their target, in px. */
  spread?: number;
  dotRadius?: number;
  color?: string;
  accentRatio?: number;
  weight?: number;
  tracking?: number;
}> = ({
  brand,
  text,
  size = 190,
  grid = 5,
  start = 0,
  formFor = 1.6,
  holdFor = 1.4,
  disperseFor = 1.0,
  spread = 420,
  dotRadius = 1.5,
  color,
  accentRatio = 0.14,
  weight = 700,
  tracking,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const trackEm = tracking ?? brand.type.displayTracking;

  // Rasterise once, then reuse for every frame of the shot.
  const points = useMemo<Pt[]>(() => {
    if (typeof document === "undefined") return [];
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${weight} ${size}px ${brand.type.display}`;
    const letterSpacePx = trackEm * size;
    // Canvas has no letter-spacing, so draw glyph by glyph to match the
    // tracking used everywhere else in the system.
    const chars = Array.from(text);
    const widths = chars.map((c) => ctx.measureText(c).width + letterSpacePx);
    const total = widths.reduce((a, b) => a + b, 0) - letterSpacePx;
    let x = width / 2 - total / 2;
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i] ?? 0;
      ctx.fillText(chars[i] ?? "", x + (w - letterSpacePx) / 2, height / 2);
      x += w;
    }

    const data = ctx.getImageData(0, 0, width, height).data;
    const out: Pt[] = [];
    let seed = 1;
    for (let py = 0; py < height; py += grid) {
      for (let px = 0; px < width; px += grid) {
        const a = data[(py * width + px) * 4 + 3] ?? 0;
        if (a < 128) continue;
        const s = seed++;
        const angle = rand(s * 3.1) * Math.PI * 2;
        const dist = spread * (0.35 + rand(s * 7.7) * 0.65);
        const outAngle = rand(s * 11.3) * Math.PI * 2;
        out.push({
          tx: px,
          ty: py,
          sx: px + Math.cos(angle) * dist,
          sy: py + Math.sin(angle) * dist * 0.55,
          ex: px + Math.cos(outAngle) * spread * 0.8,
          ey: py + Math.sin(outAngle) * spread * 0.45,
          delay: rand(s * 5.9) * 0.55,
          r: rand(s * 13.1),
        });
      }
    }
    return out;
  }, [text, size, grid, spread, width, height, brand.type.display, weight, trackEm]);

  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const t = frame / fps;
    ctx.clearRect(0, 0, width, height);

    const ink = color ?? brand.color.ink;
    const disperseStart = start + formFor + holdFor;

    for (const p of points) {
      const form = track(t, start + p.delay, formFor, "heroOut");
      const gone =
        holdFor > 0 ? track(t, disperseStart + p.delay * 0.5, disperseFor, "expoIn") : 0;

      if (form <= 0) continue;

      const x = mix(mix(p.sx, p.tx, form), p.ex, gone);
      const y = mix(mix(p.sy, p.ty, form), p.ey, gone);
      const alpha = clamp01(form * 1.3) * (1 - gone);
      if (alpha <= 0.01) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.r < accentRatio ? brand.color.accent : ink;
      const rad = dotRadius * mix(1.9, 1, form);
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [
    frame, fps, points, width, height, start, formFor, holdFor, disperseFor,
    color, brand.color.ink, brand.color.accent, accentRatio, dotRadius,
  ]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
};
