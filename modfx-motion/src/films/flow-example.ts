/**
 * Worked example of the `flow` scene.
 *
 * Kept as its own composition so there is always a running reference for how
 * to describe a product interaction as data: an `app` config for the window
 * contents and a `steps` timeline for the pointer. Copy this shape, not the
 * copy — every label here is placeholder text for a generic console.
 */
import { NORTHLINE } from "../brand/brands/northline";
import type { FilmScene } from "../templates/LaunchFilm";

export const FLOW_EXAMPLE: FilmScene[] = [
  {
    kind: "flow",
    seconds: 6.2,
    label: "The platform",
    headline: ["One console for", "the whole clinic."],
    app: {
      title: "Console",
      url: "app.example.com",
      nav: ["Overview", "Patients", "Providers", "Pharmacy", "Reports"],
      activeNav: 1,
      typed: { text: "new intake", at: 0.9, over: 0.8 },
      rows: [
        { label: "Intake received", meta: "2 min ago", at: 2.3, tag: "New" },
        { label: "Provider matched", meta: "TX · licensed", at: 3.0, tag: "Auto" },
        { label: "Script routed to pharmacy", meta: "shipped", at: 3.7, tag: "Done", accent: true },
      ],
      metric: { label: "Time to treat", value: "4m 12s", at: 4.2 },
    },
    steps: [
      { at: 0.6, kind: "move", to: { x: 30, y: 24 } },
      { at: 1.9, kind: "click", to: { x: 30, y: 24 } },
      { at: 3.4, kind: "move", to: { x: 62, y: 58 } },
      { at: 4.0, kind: "click", to: { x: 62, y: 58 } },
    ],
  },
];
export const FLOW_EXAMPLE_BRAND = NORTHLINE;
