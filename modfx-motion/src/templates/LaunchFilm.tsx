import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { alpha, type Brand } from "../brand/tokens";
import { AuroraField } from "../primitives/AuroraField";
import { FilmGrade } from "../primitives/Film";
import { Motes } from "../primitives/Scroll";
import { useFontsReady } from "../core/fonts";
import {
  layoutOverlapped,
  totalFramesOverlapped,
  useKeys,
  type SceneSlot,
} from "../core/timing";
import { type FormatName } from "../scenes/Shell";
import {
  EndcardScene,
  HeroScene,
  MarqueeScene,
  ParticleScene,
  ProductScene,
  ProofScene,
  RailScene,
  StatementScene,
  UIFlowScene,
  type AppWindowConfig,
} from "../scenes";
import type { FlowStep } from "../primitives/AppUI";

/**
 * A film is data.
 *
 * Everything that differs between two clients lives in this object; the
 * motion, grade, pacing and typography are shared. That is what makes a set
 * of these read as one studio's work rather than as twelve separate videos.
 */
export type FilmScene =
  | { kind: "hero"; seconds?: number; eyebrow: string; lines: string[]; serifLines?: number[]; italicLines?: number[]; subhead?: string }
  | { kind: "statement"; seconds?: number; lines: string[]; serifLines?: number[]; accentLines?: number[] }
  | { kind: "particle"; seconds?: number; word: string; caption?: string }
  | { kind: "product"; seconds?: number; capture: string; url?: string; label?: string; headline?: string[]; scrollTo?: number }
  | { kind: "proof"; seconds?: number; label?: string; stats: Array<{ value: number; prefix?: string; suffix?: string; decimals?: number; label: string }> }
  | { kind: "marquee"; seconds?: number; rows: string[][]; headline?: string }
  | { kind: "rail"; seconds?: number; cards: Array<{ title: string; meta?: string }>; headline?: string[] }
  | { kind: "flow"; seconds?: number; label?: string; headline?: string[]; app: AppWindowConfig; steps: FlowStep[] }
  | { kind: "endcard"; seconds?: number; wordmark: string; tagline?: string; cta?: string; logo?: string };

/** Per-frame audio analysis, baked offline by scripts/extract-audio.mjs. */
export interface AudioEnvelope {
  fps: number;
  frames: number;
  level: number[];
  bass: number[];
}

export interface SfxCue {
  /** staticFile() path. */
  src: string;
  /** Seconds from the start of the film. */
  at: number;
  volume?: number;
}

export interface FilmConfig {
  brand: Brand;
  format?: FormatName;
  scenes: FilmScene[];
  /** Path from staticFile(). Optional — the films are designed to read muted. */
  music?: string;
  musicVolume?: number;
  /** Bass/level envelope of `music`, so motion can breathe with the track. */
  envelope?: AudioEnvelope;
  /** Continuous room tone. Stops quiet passages sounding like dropped audio. */
  bed?: string;
  bedVolume?: number;
  /**
   * Placed automatically on every scene cut. The engine already knows where
   * the cuts are, so the sound design does not have to restate them by hand
   * and cannot drift when a scene length changes.
   */
  cutSound?: string;
  cutVolume?: number;
  /** Extra one-off cues, timed from the start of the film. */
  sfx?: SfxCue[];
  /** Flash intensity on each cut, 0 disables. */
  cutFlash?: number;
  /** 2.39 for scope bars, or omit for full frame. */
  letterbox?: number;
}

const DEFAULT_SECONDS: Record<FilmScene["kind"], number> = {
  hero: 4.2,
  statement: 3.2,
  particle: 4.0,
  product: 5.0,
  proof: 3.8,
  marquee: 3.2,
  rail: 3.6,
  flow: 6.2,
  endcard: 3.6,
};

export const filmSlots = (scenes: FilmScene[]): SceneSlot[] =>
  scenes.map((s, i) => ({
    id: `${s.kind}-${i}`,
    seconds: s.seconds ?? DEFAULT_SECONDS[s.kind],
  }));

/**
 * Scenes overlap by the length of a scene exit, so there is never a frame
 * where the previous scene has left and the next has not arrived.
 */
export const SCENE_OVERLAP = 0.42;

export const filmDurationInFrames = (scenes: FilmScene[], fps: number): number =>
  totalFramesOverlapped(filmSlots(scenes), fps, SCENE_OVERLAP);

/**
 * The continuous background.
 *
 * Lives outside every <Sequence>, so its noise field, key light and grain
 * run unbroken for the whole film. Scene cuts therefore only ever affect the
 * foreground — there is no moment where two backgrounds are both visible,
 * which is the usual source of muddy transitions.
 */
const Backdrop: React.FC<{
  brand: Brand;
  total: number;
  envelope?: AudioEnvelope;
}> = ({ brand, total, envelope }) => {
  const frame = useCurrentFrame();
  // Bass, not full-spectrum level: bass tracks the swells and the pulse, which
  // is what the eye expects a glow to breathe with. Wideband level follows air
  // and hats and reads as jitter.
  const bass = envelope?.bass[Math.min(frame, envelope.bass.length - 1)] ?? 0;
  // Brightness breathes across the film: dim under the opening, lifting into
  // the middle, settling back for the endcard so the wordmark reads cleanly.
  const intensity = useKeys([
    [0, 0.72],
    [total * 0.18, 1.0],
    [total * 0.62, 1.05],
    [total * 0.86, 0.78],
    [total, 0.66],
  ]);
  // The key light drifts right-to-left over the film, a slow camera-ish move
  // that nothing else in the frame depends on.
  const fx = useKeys([
    [0, 0.26],
    [total * 0.5, -0.1],
    [total, 0.14],
  ]);
  const fy = useKeys([
    [0, 0.1],
    [total * 0.5, -0.06],
    [total, 0.08],
  ]);

  return (
    <AbsoluteFill>
      <AuroraField
        brand={brand}
        // A light touch on purpose. Audio-reactivity that is obvious reads as
        // a visualiser; at this depth the viewer only registers that the image
        // is alive.
        intensity={intensity * (1 + bass * 0.1)}
        bloom={brand.bloom * (1 + bass * 0.45)}
        focus={[fx, fy]}
        speed={0.24}
      />
      <Motes brand={brand} count={38} opacity={0.3 + bass * 0.22} />
    </AbsoluteFill>
  );
};

/**
 * A short bloom of light on each cut.
 *
 * Paired with the sub impact on the same frame, this is the single cheapest
 * way to make a cut feel deliberate rather than accidental. Kept under 0.2s
 * and well below white — a full-frame white flash is a cliche and hurts at
 * phone brightness.
 */
const CutFlash: React.FC<{
  brand: Brand;
  cuts: number[];
  strength: number;
}> = ({ brand, cuts, strength }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let peak = 0;
  for (const c of cuts) {
    const d = t - c;
    if (d >= 0 && d < 0.2) peak = Math.max(peak, (1 - d / 0.2) ** 2);
  }
  if (peak <= 0.001) return null;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: peak * strength,
        background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${alpha(
          brand.color.accent2,
          0.32,
        )} 0%, ${alpha(brand.color.accent, 0.16)} 45%, transparent 78%)`,
      }}
    />
  );
};

export const LaunchFilm: React.FC<FilmConfig> = ({
  brand,
  format = "landscape",
  scenes,
  music,
  musicVolume = 0.34,
  envelope,
  bed,
  bedVolume = 0.5,
  cutSound,
  cutVolume = 0.5,
  sfx,
  cutFlash = 0.8,
  letterbox,
}) => {
  useFontsReady();
  const { fps } = useVideoConfig();
  const placed = layoutOverlapped(filmSlots(scenes), fps, SCENE_OVERLAP);
  const totalSeconds = filmDurationInFrames(scenes, fps) / fps;
  // Every scene boundary after the first. Drives both the cut flash and the
  // cut impacts, so picture and sound cannot drift apart.
  const cutTimes = placed.slice(1).map((p) => p.fromFrame / fps);

  return (
    <FilmGrade brand={brand} letterbox={letterbox}>
      <Backdrop brand={brand} total={totalSeconds} envelope={envelope} />

      {scenes.map((scene, i) => {
        const slot = placed[i]!;
        const ctx = { brand, format, dur: slot.seconds };
        return (
          <Sequence
            key={slot.id}
            from={slot.fromFrame}
            durationInFrames={slot.durationInFrames}
            name={slot.id}
          >
            {scene.kind === "hero" ? (
              <HeroScene {...ctx} {...scene} />
            ) : scene.kind === "statement" ? (
              <StatementScene {...ctx} {...scene} />
            ) : scene.kind === "particle" ? (
              <ParticleScene {...ctx} {...scene} />
            ) : scene.kind === "product" ? (
              <ProductScene {...ctx} {...scene} />
            ) : scene.kind === "proof" ? (
              <ProofScene {...ctx} {...scene} />
            ) : scene.kind === "marquee" ? (
              <MarqueeScene {...ctx} {...scene} />
            ) : scene.kind === "rail" ? (
              <RailScene {...ctx} {...scene} />
            ) : scene.kind === "flow" ? (
              <UIFlowScene {...ctx} {...scene} />
            ) : (
              <EndcardScene {...ctx} {...scene} />
            )}
          </Sequence>
        );
      })}

      {cutFlash > 0 ? (
        <CutFlash brand={brand} cuts={cutTimes} strength={cutFlash} />
      ) : null}

      {bed ? <Audio src={bed} volume={bedVolume} /> : null}
      {music ? <Audio src={music} volume={musicVolume} /> : null}

      {/* Cut impacts, placed from the layout rather than restated by hand. */}
      {cutSound
        ? cutTimes.map((at, i) => (
            <Sequence
              key={`cut-${i}`}
              from={Math.max(0, Math.round((at - 0.04) * fps))}
              durationInFrames={Math.round(2 * fps)}
              name={`sfx-cut-${i}`}
            >
              <Audio src={cutSound} volume={cutVolume} />
            </Sequence>
          ))
        : null}

      {sfx?.map((cue, i) => (
        <Sequence
          key={`sfx-${i}`}
          from={Math.max(0, Math.round(cue.at * fps))}
          durationInFrames={Math.round(4 * fps)}
          name={`sfx-${i}`}
        >
          <Audio src={cue.src} volume={cue.volume ?? 0.6} />
        </Sequence>
      ))}
    </FilmGrade>
  );
};
