import { Easing } from "remotion";

/**
 * The curve library.
 *
 * Nothing in a ModFX film uses a linear or a default ease. The single biggest
 * tell of amateur motion graphics is `ease-in-out` on everything; the single
 * biggest tell of expensive motion graphics is a long, slow deceleration —
 * the object travels most of its distance in the first third of its time and
 * then settles for the remaining two thirds.
 *
 * `heroOut` is that curve. Reach for it first.
 */
export const CURVES = {
  /** The house curve. Long slow-out. Headlines, hero reveals, camera pushes. */
  heroOut: Easing.bezier(0.16, 1, 0.3, 1),
  /** Slightly less extreme than heroOut. Secondary copy, cards, UI chrome. */
  quintOut: Easing.bezier(0.22, 1, 0.36, 1),
  /** Balanced and quick. Small elements that shouldn't draw attention. */
  smooth: Easing.bezier(0.4, 0, 0.2, 1),
  /** Leaves fast, arrives slow. Good for exits that need to feel decisive. */
  swiftOut: Easing.bezier(0.55, 0, 0.1, 1),
  /** Symmetric and heavy. Camera moves, scroll scrubs, long parallax drifts. */
  cinematic: Easing.bezier(0.65, 0, 0.35, 1),
  /** Very heavy both ends. Whip transitions between scenes. */
  expoInOut: Easing.bezier(0.87, 0, 0.13, 1),
  /** Overshoots ~6% then settles. Use sparingly — once per film, maximum. */
  backOut: Easing.bezier(0.34, 1.4, 0.64, 1),
  /** Pure acceleration. Exits that fly off screen. */
  expoIn: Easing.bezier(0.7, 0, 0.84, 0),
  /** No easing. Only for continuous motion: marquees, rotations, drifts. */
  linear: (n: number) => n,
} as const;

export type CurveName = keyof typeof CURVES;
export type Curve = CurveName | ((n: number) => number);

export const resolveCurve = (c: Curve | undefined): ((n: number) => number) =>
  typeof c === "function" ? c : CURVES[c ?? "heroOut"];

/** Clamp to 0..1. */
export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Linear interpolate. */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Normalised progress through a window, eased.
 * Returns 0 before `start`, 1 after `start + duration`.
 */
export const track = (
  t: number,
  start: number,
  duration: number,
  curve?: Curve,
): number => {
  if (duration <= 0) return t >= start ? 1 : 0;
  return resolveCurve(curve)(clamp01((t - start) / duration));
};
