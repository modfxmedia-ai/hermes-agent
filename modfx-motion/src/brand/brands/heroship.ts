import { type Brand, FONTS } from "../tokens";

/**
 * Heroship.
 *
 * Derived from the documented Heroship/ModFX palette (NAVY #0F2A47,
 * BLUE #2E75B6, LIGHT #D5E8F0, GREEN #1E7A46). Those are specified for
 * letter-size proposal documents on white, so they are re-seated here for a
 * dark screen: the navy becomes the deepest aurora stop rather than the page,
 * the blue stays exactly as-is and carries the accent, and the light blue
 * becomes the highlight the key light resolves to.
 *
 * Arial is the proposal typeface and is not used here — document body type
 * and 120px display type are different problems. Inter at -0.04em tracking is
 * the closest widely-licensed match to what this tier of film wants.
 *
 * Swap any of this the moment the real app brand is available; it is the only
 * file that needs to change.
 */
export const HEROSHIP: Brand = {
  id: "heroship",
  name: "Heroship",
  tagline: "The operating system for modern telehealth clinics.",
  color: {
    bg: "#060B12",
    bgDeep: "#02060A",
    surface: "#0D1724",
    line: "#1C2A3C",
    ink: "#F2F6FA",
    inkMuted: "#8098B2",
    inkFaint: "#33465C",
    accent: "#2E75B6",
    accentSoft: "#17456E",
    accent2: "#4FB286",
    aurora: ["#050E1A", "#0F2A47", "#2E75B6", "#8FCBEF"],
  },
  type: {
    display: FONTS.inter,
    body: FONTS.instrumentSans,
    mono: FONTS.mono,
    displayTracking: -0.04,
    displayWeight: 650,
    eyebrowTracking: 0.17,
  },
  grain: 0.04,
  vignette: 0.62,
  bloom: 0.66,
  motion: { unit: 0.55, stagger: 0.062 },
};
