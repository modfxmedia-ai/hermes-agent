# modfx-motion

Launch-film engine. High-end abstract motion graphics, rendered deterministically from code.

One film definition → a 16:9, a 9:16 and a 1:1 cut, each with a baked poster frame,
each in a client's identity, each reproducible byte-for-byte on any machine.

---

## Why this exists

Agent-driven video tools (`/brag` and friends) are good at *story* — angle, hook,
what to show — and weak at *delivery*: they re-create your UI in throwaway HTML,
crossfade busy layouts into mud, ship one aspect ratio, and bundle music whose
licence nobody verified.

This repo is the delivery half. The story half is still a prompt; this is the
thing the prompt writes **into**, so that every film an agent or a human produces
lands in the same visual language.

## Quickstart

```bash
npm install
npm run studio                       # live editor at localhost:3000
npm run render -- Northline out/f.mp4   # single composition
```

Full delivery set for one film:

```bash
node scripts/capture.mjs https://client.com --out public/captures/client.png
node scripts/render-matrix.mjs --id Northline --poster 7.4
node scripts/qa-frames.mjs out/Northline-landscape.mp4
```

### Headless environments

Remotion downloads its own Chromium on first render. If that host is blocked,
point it at an existing one:

```bash
export MODFX_BROWSER=/path/to/headless_shell          # for rendering
export MODFX_BROWSER_FULL=/path/to/chrome             # for capture.mjs
```

---

## The look, and how it is produced

Five decisions do most of the work. They are worth understanding before
changing anything, because each one is the difference between "expensive" and
"a template".

**1. Long slow-out easing, never `ease-in-out`.**
`CURVES.heroOut` is `cubic-bezier(0.16, 1, 0.3, 1)`: the object covers most of
its distance in the first third of its time and settles for the rest. This one
curve is most of the perceived production value. See `src/core/easing.ts`.

**2. Masked reveals, not fades.**
Type slides up out of an `overflow: hidden` window with a 10px→0 blur
alongside. Nothing appears from nowhere; everything arrives from somewhere.
See `KineticType` in `src/primitives/KineticType.tsx`.

**3. Two-octave noise, not five.**
Octave count is the main aesthetic dial on the background. Five octaves is
marble — a busy stock wallpaper. Two octaves at a large feature size, crushed
with a power curve so ~80% of the frame sits at page black, is the abstract
field that Apple and OpenAI films actually use. The emptiness *is* the look.
See `FBM` in `src/core/glsl.ts` and `AuroraField`.

**4. One continuous background for the entire film.**
Scenes never cross-dissolve. The noise field, key light and grain run unbroken
from frame 0 to the end; cuts only ever swap *foreground* content, and the
outgoing content leaves (rise + blur + fade, ~0.4s) before the incoming
content arrives. This structurally eliminates the double-exposure mud that
automated editors produce. See `Backdrop` in `src/templates/LaunchFilm.tsx`
and `SceneBody` in `src/scenes/Shell.tsx`.

**5. The grade is applied once, over everything.**
Grain (held for 2 frames so it reads as film, not digital noise), edge
chromatic aberration, vignette, optional scope bars — all at the top level.
Per-scene grading makes every cut visible as a grain jump.
See `FilmGrade` in `src/primitives/Film.tsx`.

Supporting detail that matters more than it sounds: display type is tracked at
**-0.038em to -0.04em**. Default tracking at 120px reads as amateur instantly.

---

## Architecture

```
src/
  core/
    easing.ts      curve library — heroOut is the house curve
    timing.ts      seconds-based animation, stagger, keyframes, seeded rand
    glsl.ts        simplex noise, fbm, dither, filmic tonemap
    fonts.ts       hermetic @fontsource loading (no CDN at render time)
  brand/
    tokens.ts      the Brand interface + ModFX house identity
    brands/*.ts    one file per client
    registry.ts
  primitives/      the look, composable
    ShaderCanvas   fullscreen GLSL, deterministic from the frame number
    AuroraField    domain-warped noise background
    KineticType    masked type reveal, Eyebrow, BodyCopy, LightSweep
    ParticleFormation  point cloud that assembles into a word
    Scroll         Marquee, ParallaxRail, ScrollScrub, GridField, Motes
    Device         BrowserFrame, PhoneFrame, Wipe, Rule, Counter
    Film           Grain, Vignette, EdgeAberration, Letterbox, FilmGrade
  scenes/          hero, statement, particle, product, proof, marquee, rail, endcard
  templates/
    LaunchFilm     takes a FilmConfig, lays scenes out, renders
  films/*.ts       one file per film — pure data
scripts/
  capture.mjs      deterministic Playwright site capture
  render-matrix.mjs  all formats + baked poster frame 0
  qa-frames.mjs    automated frame QA + contact sheet
```

Determinism is enforced, not hoped for: every random value goes through
`rand(seed)` in `src/core/timing.ts`, and every animated value is a pure
function of the frame. Re-rendering a film next year produces the same bytes.

---

## Adding a client

1. `src/brand/brands/<client>.ts` — copy `northline.ts`, replace the colours
   and the two typefaces. Pull the accent and the four `aurora` stops from the
   client's real site CSS.
2. Register it in `src/brand/registry.ts`.
3. `src/films/<client>.ts` — the scene list. This is pure data.
4. Register the film in `src/Root.tsx` with `registerFilm(...)`, which creates
   all three format compositions.

A new client film is two small data files. That is the point.

### Grounding rule

Tone, framing and connective copy are yours to write. Anything the film
**asserts** about the client — names, numbers, capabilities, outcomes, quotes
— must already exist in their site, docs or product. If a stat is on screen,
it is on their page. Nothing in the render pipeline can check this for you;
it is a review step, and it is the one that matters most.

---

## Scripts

### `capture.mjs`
Deterministic full-page capture. Freezes animations, strips cookie banners and
fixed overlays, pre-scrolls the page so lazy content and scroll-reveals fire,
then shoots. Without the pre-scroll, half a modern marketing page captures as
empty boxes. Honours `HTTPS_PROXY`.

### `render-matrix.mjs`
Renders every format, then **bakes the poster as frame 0**. A bare `.mp4` has
no poster attribute, and Slack, X, Discord and LinkedIn all regenerate
previews server-side and ignore embedded cover art — overlaying the chosen
still onto frame 0 only is the sole reliable way to control the idle thumbnail
everywhere. Duration, frame count and audio sync are untouched.

Vertical is a separate composition, not a crop: TikTok/Reels/Shorts put UI
over the bottom ~18% and right ~14% of the frame. Safe areas live in
`src/scenes/Shell.tsx`.

### `qa-frames.mjs`
Samples the finished mp4 and flags `DEAD` (empty frame — usually what becomes
the thumbnail), `FLAT`, `SOFT` (mid-transition mud) and `BLOWN` (clipped
bloom), collapses runs, checks frame 0 specifically, and writes a contact
sheet. Pixels come straight from ffmpeg as rgb24, so there is no image
library. Exits non-zero on a `DEAD` frame, so it can gate CI.

---

## Not done yet

- **Music.** No audio ships here. `LaunchFilm` takes a `music` prop and ducks
  nothing yet. Licence a library (Epidemic Sound / Artlist) before any
  client-facing film — do not reuse bundled tracks from other skills whose
  terms are unverified.
- **Captions.** Most social video is watched muted. Whisper → styled burn-in
  is the next highest-value addition.
- **Audio-reactive motion.** The hooks are there (`useKeys`, shader uniforms);
  nothing is wired to an audio envelope.
- **Screen-capture polish.** Real cursor-zoom recordings (Screen Studio / Cap)
  composited into `BrowserFrame` would beat scroll-scrubbing a still.

## Repo placement

This currently lives inside a **public fork**. Before adding real client brand
kits, licensed music, or unreleased product captures, move it to a private
repo (e.g. `modfxmedia-ai/hermes-studio`). It is self-contained — the whole
directory lifts out unchanged.
