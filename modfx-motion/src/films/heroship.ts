import { staticFile } from "remotion";
import { HEROSHIP } from "../brand/brands/heroship";
import envelope from "../audio/heroship-bed.json";
import type { AudioEnvelope, FilmScene, SfxCue } from "../templates/LaunchFilm";

/**
 * Heroship launch film — investor cut.
 *
 * GROUNDING NOTE. Everything asserted on screen traces to Heroship/ModFX's
 * own published language: the line "The operating system for modern telehealth
 * clinics" and its four pillars (marketing engine, telehealth platform,
 * 50-state provider network, pharmacy supply), plus the ModBot AI voice and
 * Mod-Chat AI chat products and their stated promise that an operator "won't
 * ever miss a call or have to get stuck in the back and forth" of chasing
 * leads, included with any plan.
 *
 * Still deliberately NO performance metrics. Clinics live, scripts routed and
 * time-to-treat are what an investor cut wants and what must come from the
 * company. Adding a `proof` scene once those exist is a four-line change.
 */

const sfxFile = (n: string) => staticFile(`audio/sfx/${n}.wav`);

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
    seconds: 2.8,
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
        // Ambient rows, present from the first frame, so the board reads as a
        // working product rather than a prototype with one item on it.
        { label: "Intake queue", meta: "marketing engine", at: 0 },
        { label: "Consult scheduled", meta: "telehealth platform", at: 0 },
        { label: "Provider roster", meta: "50-state network", at: 0 },
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
    lines: ["Never miss a call.", "Never chase a lead."],
    accentLines: [1],
  },
  {
    kind: "rail",
    seconds: 3.6,
    headline: ["Included.", "Not bolted on."],
    cards: [
      { title: "ModBot AI", meta: "Voice" },
      { title: "Mod-Chat AI", meta: "Chat" },
      { title: "Telehealth platform", meta: "Care delivery" },
      { title: "Programmatic SEO", meta: "Demand" },
      { title: "50-state provider network", meta: "Licensed" },
      { title: "Pharmacy supply", meta: "Fulfilment" },
      { title: "Site builds", meta: "Launch" },
      { title: "Lead follow-up", meta: "Automatic" },
      { title: "Scheduling", meta: "Hands off" },
    ],
  },
  {
    kind: "statement",
    seconds: 2.6,
    lines: ["Licensed providers.", "All fifty states."],
    accentLines: [1],
  },
  {
    kind: "endcard",
    seconds: 3.8,
    wordmark: "Heroship",
    tagline: "The operating system for modern telehealth clinics.",
    cta: "heroship.com",
  },
];

/**
 * Cue sheet, in absolute seconds.
 *
 * Cut impacts are NOT listed here — the engine places one on every scene
 * boundary from the layout it already computed, so sound and picture cannot
 * drift when a scene length changes. These are the cues tied to events inside
 * a scene, which the engine cannot know about.
 */
export const HEROSHIP_SFX: SfxCue[] = [
  // Keystrokes under the typed query (flow scene opens at 6.33s; the window
  // starts 0.55s later and types from 0.9s into that).
  { src: sfxFile("ui-key"), at: 7.85, volume: 0.3 },
  { src: sfxFile("ui-key"), at: 7.99, volume: 0.26 },
  { src: sfxFile("ui-key"), at: 8.12, volume: 0.3 },
  { src: sfxFile("ui-key"), at: 8.27, volume: 0.24 },
  // Pointer clicks.
  { src: sfxFile("ui-tick"), at: 8.78, volume: 0.45 },
  { src: sfxFile("ui-tick"), at: 11.08, volume: 0.45 },
  // Each result row arriving. Softer than the clicks so a run of three does
  // not fatigue.
  { src: sfxFile("ui-tick-soft"), at: 9.28, volume: 0.38 },
  { src: sfxFile("ui-tick-soft"), at: 9.98, volume: 0.34 },
  { src: sfxFile("ui-tick-soft"), at: 10.68, volume: 0.42 },
  // Air moving through the two whip cuts off the statement scenes.
  { src: sfxFile("air-pass"), at: 6.1, volume: 0.3 },
  { src: sfxFile("air-pass"), at: 14.4, volume: 0.3 },
  // Riser into the endcard, peaking exactly as the wordmark lands at 20.0s.
  { src: sfxFile("riser"), at: 18.35, volume: 0.5 },
  { src: sfxFile("impact-sub"), at: 20.0, volume: 0.8 },
  { src: sfxFile("bell-a"), at: 20.12, volume: 0.42 },
];

export const HEROSHIP_MUSIC = staticFile("audio/music/heroship-bed.wav");
export const HEROSHIP_BED = sfxFile("bed-air");
export const HEROSHIP_CUT = sfxFile("impact-soft");
/**
 * Per-frame bass/level envelope of the bed, baked by scripts/extract-audio.mjs.
 * Exactly as many entries as the film has frames, so motion driven from it is
 * frame-exact and survives a re-render anywhere.
 */
export const HEROSHIP_ENVELOPE = envelope as AudioEnvelope;

export const HEROSHIP_BRAND = HEROSHIP;
