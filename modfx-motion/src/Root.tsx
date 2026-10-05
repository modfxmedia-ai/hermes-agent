import React from "react";
import { Composition } from "remotion";
import {
  LaunchFilm,
  filmDurationInFrames,
  type FilmConfig,
  type FilmScene,
} from "./templates/LaunchFilm";
import { NORTHLINE_BRAND, NORTHLINE_SCENES } from "./films/northline";
import type { Brand } from "./brand/tokens";
import type { FormatName } from "./scenes/Shell";

const FPS = 30;

const FORMAT_SIZE: Record<FormatName, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

const SUFFIX: Record<FormatName, string> = {
  landscape: "",
  vertical: "Vertical",
  square: "Square",
};

/**
 * Register one film in all three delivery formats.
 *
 * Each format is a real composition, not a crop: the scenes read `format`
 * and change type scale, alignment and safe areas accordingly.
 */
const registerFilm = (
  id: string,
  brand: Brand,
  scenes: FilmScene[],
  music?: string,
) =>
  (Object.keys(FORMAT_SIZE) as FormatName[]).map((format) => {
    const props: FilmConfig = { brand, scenes, format, music };
    return (
      <Composition
        key={`${id}-${format}`}
        id={`${id}${SUFFIX[format]}`}
        // Remotion types compositions against a plain prop bag; FilmConfig is
        // the real contract and is enforced on `props` above.
        component={LaunchFilm as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={filmDurationInFrames(scenes, FPS)}
        fps={FPS}
        {...FORMAT_SIZE[format]}
        defaultProps={props as unknown as Record<string, unknown>}
      />
    );
  });

export const Root: React.FC = () => (
  <>{registerFilm("Northline", NORTHLINE_BRAND, NORTHLINE_SCENES)}</>
);
