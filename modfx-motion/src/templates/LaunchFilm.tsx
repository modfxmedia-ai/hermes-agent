import React from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { type Brand } from "../brand/tokens";
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

export interface FilmConfig {
  brand: Brand;
  format?: FormatName;
  scenes: FilmScene[];
  /** Path from staticFile(). Optional — the films are designed to read muted. */
  music?: string;
  musicVolume?: number;
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
const Backdrop: React.FC<{ brand: Brand; total: number }> = ({ brand, total }) => {
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
      <AuroraField brand={brand} intensity={intensity} focus={[fx, fy]} speed={0.24} />
      <Motes brand={brand} count={38} opacity={0.3} />
    </AbsoluteFill>
  );
};

export const LaunchFilm: React.FC<FilmConfig> = ({
  brand,
  format = "landscape",
  scenes,
  music,
  musicVolume = 0.34,
  letterbox,
}) => {
  useFontsReady();
  const { fps } = useVideoConfig();
  const placed = layoutOverlapped(filmSlots(scenes), fps, SCENE_OVERLAP);
  const totalSeconds =
    filmDurationInFrames(scenes, fps) / fps;

  return (
    <FilmGrade brand={brand} letterbox={letterbox}>
      <Backdrop brand={brand} total={totalSeconds} />

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

      {music ? <Audio src={music} volume={musicVolume} /> : null}
    </FilmGrade>
  );
};
