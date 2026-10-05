import { useCurrentFrame, useVideoConfig } from "remotion";
import { type Curve, mix, track } from "./easing";

/** Seconds elapsed inside the nearest <Sequence>. Everything is authored in seconds. */
export const useSeconds = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export interface AnimSpec {
  /** Seconds into the current sequence when the move begins. Default 0. */
  start?: number;
  /** How long the move takes, in seconds. Default 1. */
  duration?: number;
  /** Value at rest before the move. Default 0. */
  from?: number;
  /** Value after the move completes. Default 1. */
  to?: number;
  /** Named curve or a custom 0..1 function. Default `heroOut`. */
  curve?: Curve;
}

/**
 * The workhorse. One eased value, authored in seconds.
 *
 *   const y = useAnim({ start: 0.2, duration: 1.1, from: 72, to: 0 });
 */
export const useAnim = (spec: AnimSpec = {}): number => {
  const t = useSeconds();
  const { start = 0, duration = 1, from = 0, to = 1, curve } = spec;
  return mix(from, to, track(t, start, duration, curve));
};

/**
 * Staggered variant: item `index` starts `each` seconds after the one before.
 *
 * Stagger is what makes a group of things feel composed rather than dumped on
 * screen. 50-70ms reads as one gesture; above ~140ms the items read as
 * separate events, which is occasionally what you want.
 */
export const useStagger = (
  index: number,
  spec: AnimSpec & { each?: number } = {},
): number => {
  const { each = 0.06, start = 0, ...rest } = spec;
  return useAnim({ ...rest, start: start + index * each });
};

/**
 * In-and-out in one value: rises to 1, holds, falls back to 0.
 * `total` is the length of the sequence in seconds.
 */
export const useInOut = (
  total: number,
  opts: { inAt?: number; inFor?: number; outFor?: number; curve?: Curve } = {},
): number => {
  const t = useSeconds();
  const { inAt = 0, inFor = 0.7, outFor = 0.5, curve } = opts;
  const rise = track(t, inAt, inFor, curve);
  const fall = track(t, total - outFor, outFor, curve);
  return rise * (1 - fall);
};

/** 0..1 across the whole sequence. Useful for continuous drifts and parallax. */
export const useSceneProgress = (totalSeconds: number): number => {
  const t = useSeconds();
  return totalSeconds > 0 ? Math.min(1, Math.max(0, t / totalSeconds)) : 0;
};

/** Seconds -> frames, for <Sequence from={} durationInFrames={}>. */
export const useFrames = (seconds: number): number => {
  const { fps } = useVideoConfig();
  return Math.round(seconds * fps);
};

/**
 * Lay scenes end-to-end and get absolute frame offsets back.
 * Keeps a film's structure declarative instead of a pile of magic numbers.
 */
export interface SceneSlot {
  id: string;
  seconds: number;
}
export interface PlacedScene extends SceneSlot {
  fromFrame: number;
  durationInFrames: number;
}
export const layout = (scenes: SceneSlot[], fps: number): PlacedScene[] => {
  let cursor = 0;
  return scenes.map((s) => {
    const durationInFrames = Math.round(s.seconds * fps);
    const placed = { ...s, fromFrame: cursor, durationInFrames };
    cursor += durationInFrames;
    return placed;
  });
};

export const totalFrames = (scenes: SceneSlot[], fps: number): number =>
  scenes.reduce((n, s) => n + Math.round(s.seconds * fps), 0);

/**
 * Deterministic pseudo-random in 0..1 from an integer seed.
 * Every particle, grain offset and jitter in the system goes through this, so
 * frame 300 looks identical on every machine and every re-render.
 */
export const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

/** Deterministic value in [min, max). */
export const randRange = (seed: number, min: number, max: number): number =>
  min + rand(seed) * (max - min);

/**
 * Multi-point keyframes on an absolute timeline.
 *
 * Used for values that must move continuously across scene boundaries — the
 * background's brightness, the key light's position, a slow camera push. If
 * these were animated per-scene the cuts would be visible as jumps in the
 * background, which is the fastest way to make a film look assembled rather
 * than shot.
 */
export const keys = (
  t: number,
  points: Array<[time: number, value: number]>,
  curve?: Curve,
): number => {
  if (points.length === 0) return 0;
  const first = points[0]!;
  if (t <= first[0]) return first[1];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (t >= a[0] && t <= b[0]) {
      return mix(a[1], b[1], track(t, a[0], b[0] - a[0], curve ?? "smooth"));
    }
  }
  return points[points.length - 1]![1];
};

export const useKeys = (
  points: Array<[number, number]>,
  curve?: Curve,
): number => keys(useSeconds(), points, curve);

/**
 * Lay scenes out with a deliberate overlap.
 *
 * Butt-joining scenes leaves a hole: the outgoing content finishes its exit
 * before the incoming content has started its entrance, so for ~0.4s the
 * frame is just background. Overlapping by the length of the exit means the
 * old content is leaving while the new content arrives — both moving the same
 * direction, the old already faded — which reads as a cut rather than a gap.
 */
export const layoutOverlapped = (
  scenes: SceneSlot[],
  fps: number,
  overlapSeconds: number,
): PlacedScene[] => {
  const overlap = Math.round(overlapSeconds * fps);
  let cursor = 0;
  return scenes.map((s) => {
    const durationInFrames = Math.round(s.seconds * fps);
    const placed = { ...s, fromFrame: cursor, durationInFrames };
    cursor += durationInFrames - overlap;
    return placed;
  });
};

export const totalFramesOverlapped = (
  scenes: SceneSlot[],
  fps: number,
  overlapSeconds: number,
): number => {
  const overlap = Math.round(overlapSeconds * fps);
  return scenes.reduce(
    (n, s, i) => n + Math.round(s.seconds * fps) - (i > 0 ? overlap : 0),
    0,
  );
};
