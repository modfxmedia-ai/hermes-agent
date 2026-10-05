import { type Brand, FONTS } from "../tokens";

/**
 * Example client brand.
 *
 * Note how little is here: colours, two typefaces, four grade numbers. That
 * is the entire difference between this film and the house one. Pull the
 * accent and the aurora stops from the client's real site CSS — the film
 * should feel like the brand before a single word is read.
 */
export const NORTHLINE: Brand = {
  id: "northline",
  name: "Northline Regenerative",
  tagline: "Start with the imaging, not the opinion.",
  color: {
    bg: "#05090D",
    bgDeep: "#010407",
    surface: "#0D151D",
    line: "#1B2733",
    ink: "#F2F7FB",
    inkMuted: "#8198AE",
    inkFaint: "#33424F",
    accent: "#2E9BE6",
    accentSoft: "#17537F",
    accent2: "#5FD8E8",
    aurora: ["#04121E", "#0B3A5C", "#1C7ED6", "#5FD8E8"],
  },
  type: {
    display: FONTS.inter,
    body: FONTS.instrumentSans,
    mono: FONTS.mono,
    displayTracking: -0.04,
    displayWeight: 650,
    eyebrowTracking: 0.17,
  },
  grain: 0.042,
  vignette: 0.6,
  bloom: 0.62,
  motion: { unit: 0.55, stagger: 0.062 },
};
