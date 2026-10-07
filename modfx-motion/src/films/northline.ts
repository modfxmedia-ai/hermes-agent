import { staticFile } from "remotion";
import { NORTHLINE } from "../brand/brands/northline";
import type { FilmScene } from "../templates/LaunchFilm";

/**
 * Every claim below is lifted from the source site, not invented.
 *
 * This is the discipline that keeps an automated pipeline honest: tone,
 * framing and jokes are ours to write, but anything the film *asserts* about
 * the client — names, numbers, capabilities, outcomes — has to already exist
 * in their copy. "2,400+", "94%" and "0" are the stat strip on the page;
 * "Most joint pain never needed an operating room" is their section heading.
 */
export const NORTHLINE_SCENES: FilmScene[] = [
  {
    kind: "hero",
    seconds: 4.4,
    eyebrow: "Regenerative Medicine",
    lines: ["Recovery,", "re-engineered."],
    serifLines: [1],
    italicLines: [1],
    subhead:
      "Non-surgical protocols for joint pain, mobility and long-term recovery.",
  },
  {
    kind: "statement",
    seconds: 3.1,
    lines: ["Most joint pain never", "needed an operating room."],
    accentLines: [1],
  },
  {
    kind: "product",
    seconds: 5.4,
    capture: staticFile("captures/clinic.png"),
    url: "northlineregen.com",
    label: "The practice",
    headline: ["Built for the people", "surgery left behind."],
    scrollTo: 0.52,
  },
  {
    kind: "proof",
    seconds: 3.8,
    label: "Outcomes to date",
    stats: [
      { value: 2400, suffix: "+", label: "Patients treated" },
      { value: 94, suffix: "%", label: "Report improvement" },
      { value: 0, label: "Surgical procedures" },
    ],
  },
  {
    kind: "marquee",
    seconds: 2.9,
    rows: [
      ["Knee osteoarthritis", "Rotator cuff", "Tendinopathy", "Hip impingement", "Plantar fasciitis"],
      ["45-minute consult", "In-house ultrasound", "Written protocol", "No referral needed"],
      ["Diagnostic imaging", "Regenerative therapy", "Structured recovery"],
      ["Image-guided injection", "Motion assessment", "Twelve-week loading"],
      ["Knee", "Shoulder", "Hip", "Elbow", "Ankle", "Wrist", "Spine"],
    ],
  },
  {
    kind: "endcard",
    seconds: 3.6,
    wordmark: "Northline",
    tagline: "Start with the imaging, not the opinion.",
    cta: "Book a consult",
  },
];

export const NORTHLINE_BRAND = NORTHLINE;
