import { HEROSHIP } from "../brand/brands/heroship";
import type { FilmScene } from "../templates/LaunchFilm";

/**
 * Heroship launch film — investor cut.
 *
 * GROUNDING NOTE. Every claim on screen traces to Heroship's own published
 * positioning: the title line "The operating system for modern telehealth
 * clinics" and the four pillars it names (a marketing engine, a telehealth
 * platform, a 50-state provider network, and pharmacy supply).
 *
 * There are deliberately NO performance metrics in this cut. Clinics live,
 * scripts routed, time-to-treat and run-rate are exactly the numbers an
 * investor film wants, and exactly the numbers that must come from the
 * company rather than be invented. The `proof` scene is left out until those
 * exist; dropping it in later is a four-line change.
 *
 * The console contents are illustrative of the four pillars, not a claim
 * about specific throughput.
 */
export const HEROSHIP_SCENES: FilmScene[] = [
  {
    kind: "hero",
    seconds: 4.4,
    eyebrow: "Telehealth Infrastructure",
    lines: ["The operating system", "for modern clinics."],
    serifLines: [1],
    italicLines: [1],
    subhead:
      "Marketing, care delivery, providers and pharmacy. One platform underneath all of it.",
  },
  {
    kind: "statement",
    seconds: 2.9,
    lines: ["Four companies.", "One console."],
    accentLines: [1],
  },
  {
    kind: "flow",
    seconds: 6.4,
    label: "The platform",
    headline: ["Everything a clinic", "runs on, in one place."],
    app: {
      title: "Heroship",
      url: "app.heroship.com",
      nav: ["Overview", "Marketing", "Patients", "Providers", "Pharmacy"],
      activeNav: 2,
      typed: { text: "new patient", at: 0.9, over: 0.8 },
      rows: [
        { label: "Campaign delivering", meta: "marketing engine", at: 2.4, tag: "Live" },
        { label: "Provider matched", meta: "licensed in state", at: 3.1, tag: "Network" },
        { label: "Routed to pharmacy", meta: "supply fulfilled", at: 3.8, tag: "Shipped", accent: true },
      ],
    },
    steps: [
      { at: 0.6, kind: "move", to: { x: 28, y: 22 } },
      { at: 1.9, kind: "click", to: { x: 28, y: 22 } },
      { at: 3.5, kind: "move", to: { x: 64, y: 55 } },
      { at: 4.2, kind: "click", to: { x: 64, y: 55 } },
    ],
  },
  {
    kind: "statement",
    seconds: 2.8,
    lines: ["Licensed providers.", "All fifty states."],
    accentLines: [1],
  },
  {
    kind: "marquee",
    seconds: 3.0,
    rows: [
      ["Marketing engine", "Telehealth platform", "Provider network", "Pharmacy supply"],
      ["Patient intake", "Care delivery", "Fulfilment", "Growth"],
      ["Marketing", "Telehealth", "Providers", "Pharmacy"],
      ["50-state coverage", "Licensed network", "One platform"],
      ["Clinics", "Providers", "Patients", "Pharmacy", "Operations"],
    ],
  },
  {
    kind: "endcard",
    seconds: 3.6,
    wordmark: "Heroship",
    tagline: "The operating system for modern telehealth clinics.",
    cta: "heroship.com",
  },
];

export const HEROSHIP_BRAND = HEROSHIP;
