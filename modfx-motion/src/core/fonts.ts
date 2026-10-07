/**
 * Typeface loading.
 *
 * Fonts come from npm (@fontsource) rather than a CDN so renders are
 * hermetic: no network at render time, identical metrics on a laptop and in
 * CI, and no risk of a film silently falling back to DejaVu on a build box.
 *
 * Inter stands in for SF Pro Display. At display sizes with tracking around
 * -0.038em it is very close, and it is licensed for this.
 */
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource-variable/jetbrains-mono/wght.css";

import { continueRender, delayRender } from "remotion";

/**
 * Block the first frame until the browser reports webfonts are ready.
 * Without this the opening frames of a render can ship with fallback metrics,
 * which shows up as a one-frame reflow right at the hook.
 */
export const useFontsReady = (): void => {
  if (typeof document === "undefined") return;
  const handle = delayRender("fonts");
  document.fonts.ready.then(() => continueRender(handle)).catch(() => continueRender(handle));
};
