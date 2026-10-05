/**
 * A brand is pure data. Swap this object and the same film renders in a
 * different client's identity — that is the whole point of the system.
 *
 * Add a client under `src/brand/brands/` and register it in `registry.ts`.
 */
export interface Brand {
  id: string;
  name: string;
  /** Shown in the endcard under the wordmark. Keep it under ~40 characters. */
  tagline?: string;
  color: {
    /** Page black. Never #000 — a true black kills the grain and the bloom. */
    bg: string;
    /** Deeper pocket for vignette corners and letterbox bars. */
    bgDeep: string;
    /** Raised surfaces: cards, device chrome, UI panels. */
    surface: string;
    /** Hairlines and dividers. */
    line: string;
    /** Primary text. */
    ink: string;
    /** Secondary text — eyebrows, captions, legal. */
    inkMuted: string;
    /** Barely-there text. Background texture only; never load-bearing copy. */
    inkFaint: string;
    /** The one colour anyone remembers. Used sparingly and always as the payoff. */
    accent: string;
    /** A desaturated companion for gradients and glows. */
    accentSoft: string;
    /** Secondary hue for two-tone gradients and the aurora field. */
    accent2: string;
    /** Four stops driving the shader backgrounds. Order = depth, far to near. */
    aurora: [string, string, string, string];
  };
  type: {
    display: string;
    body: string;
    mono: string;
    /** Tracking at display sizes. Negative. -0.03 to -0.045 is the usable band. */
    displayTracking: number;
    displayWeight: number;
    /** Tracking for small uppercase eyebrows. Positive, generous. */
    eyebrowTracking: number;
  };
  /** Film grain opacity, 0..1. 0.035-0.06 reads as texture; above 0.1 reads as noise. */
  grain: number;
  /** Vignette strength, 0..1. */
  vignette: number;
  /** Bloom / glow intensity around light sources, 0..1. */
  bloom: number;
  motion: {
    /** Base beat of the film in seconds. Reveals are multiples of this. */
    unit: number;
    /** Default per-item stagger in seconds. */
    stagger: number;
  };
}

export const FONTS = {
  inter: '"Inter Variable", "Inter", system-ui, -apple-system, sans-serif',
  instrumentSans:
    '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif',
  instrumentSerif: '"Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
} as const;

/** The ModFX house identity. Used when a client brand isn't supplied. */
export const MODFX: Brand = {
  id: "modfx",
  name: "ModFX Media",
  tagline: "Growth systems for modern practices",
  color: {
    bg: "#07080A",
    bgDeep: "#030406",
    surface: "#101318",
    line: "#1E242C",
    ink: "#F4F6F8",
    inkMuted: "#8C97A6",
    inkFaint: "#3A434F",
    accent: "#4DA3FF",
    accentSoft: "#1E5B9E",
    accent2: "#7C5CFF",
    aurora: ["#0B1B33", "#14407A", "#2F7BD6", "#7C5CFF"],
  },
  type: {
    display: FONTS.inter,
    body: FONTS.instrumentSans,
    mono: FONTS.mono,
    displayTracking: -0.038,
    displayWeight: 600,
    eyebrowTracking: 0.18,
  },
  grain: 0.045,
  vignette: 0.55,
  bloom: 0.6,
  motion: { unit: 0.55, stagger: 0.065 },
};

/** Convenience: hex -> `rgba()` with an alpha applied. */
export const alpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** hex -> [r,g,b] in 0..1, for shader uniforms. */
export const rgb01 = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
