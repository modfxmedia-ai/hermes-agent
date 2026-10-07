import React from "react";
import { Composition } from "remotion";
import {
  LaunchFilm,
  filmDurationInFrames,
  type FilmConfig,
  type FilmScene,
} from "./templates/LaunchFilm";
import { NORTHLINE_BRAND, NORTHLINE_SCENES } from "./films/northline";
import { FLOW_EXAMPLE, FLOW_EXAMPLE_BRAND } from "./films/flow-example";
import { HEROSHIP_BRAND, HEROSHIP_SCENES } from "./films/heroship";
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
  formats: FormatName[] = ["landscape", "vertical", "square"],
) =>
  formats.map((format) => {
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
  <>
    {registerFilm("Heroship", HEROSHIP_BRAND, HEROSHIP_SCENES)}
    {registerFilm("Northline", NORTHLINE_BRAND, NORTHLINE_SCENES)}
    {/* Reference composition for the product-interaction scene. */}
    {registerFilm("FlowExample", FLOW_EXAMPLE_BRAND, FLOW_EXAMPLE, undefined, [
      "landscape",
    ])}
  </>
);
