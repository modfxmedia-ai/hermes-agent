# modfx-motion — agent guide

You are authoring a launch film. Read this before writing any scene.

## What you write, and what you must not

**Write data, not motion.** A new film is two files:

- `src/brand/brands/<client>.ts` — colours and typefaces, copied from the
  client's real site CSS.
- `src/films/<client>.ts` — a `FilmScene[]`.

Then register both (`src/brand/registry.ts`, `src/Root.tsx`).

**Do not** hand-write transforms, easings, durations or keyframes inside a
film file. If a film needs motion the scene library does not have, add a scene
to `src/scenes/` built from existing primitives — do not inline it. The point
of the system is that every film shares one motion language.

## Hard rules

1. **Grounding.** Anything the film *asserts* about the client — names,
   numbers, capabilities, outcomes, quotes — must already exist in their site,
   docs or product. Tone, hooks and connective copy are yours to invent;
   claims are not. Nothing in the pipeline checks this. You do.
2. **No secrets on screen.** Never put API keys, internal hostnames, real
   patient or customer names, emails, or anything from a `.env` into a film,
   a capture, or a committed fixture. Captures of logged-in states are
   especially dangerous — use public pages or fabricated stand-ins, and say
   in the PR which you did.
3. **Length.** 18–24 seconds. Scene defaults in `LaunchFilm.tsx` already sum
   to roughly that; if you exceed it, cut a scene rather than speeding
   everything up.
4. **Readable.** Any line the viewer is meant to read needs ~0.3s per word of
   settled time, counted from when the whole line has arrived. A 3.1s
   statement scene carries one short line, not three.
5. **Masked type cannot wrap.** `KineticType` takes pre-split `lines`. Never
   pass one long string and hope — it will overflow its container silently.
   This has already shipped a clipped headline once.

## Required workflow

```bash
npx tsc --noEmit                                   # must be clean
node scripts/capture.mjs <url> --out public/captures/<client>.png
npx remotion render <Id> out/<client>.mp4
node scripts/qa-frames.mjs out/<client>.mp4        # must exit 0
```

**Always run `qa-frames.mjs` and always look at the contact sheet it writes.**
It is not a formality — on the first render of the reference film it caught an
empty gap at every scene cut, a clipped headline, and a marquee that was
invisible at thumbnail size. Read the flags:

- `DEAD` — a frame with nothing in it. Fails the build. Usually means scene
  timing has a hole.
- `SOFT` run — several seconds below the film's median edge energy. Either a
  genuinely soft passage or content that never arrived.
- `FLAT` — no tonal range; reads as a grey card at thumbnail size.
- `BLOWN` — clipped highlights. A white page in a dark film needs the
  brightness pullback `ProductScene` applies.

For delivery, `scripts/render-matrix.mjs` renders all three formats and bakes
the poster into frame 0. Do not skip the poster step: a bare mp4 has no poster
attribute and every platform will pick frame 0 itself.

## Taste notes that are easy to get wrong

- Display type is tracked `-0.038em` to `-0.04em`. Default tracking at 120px
  looks amateur immediately.
- The background should be *mostly empty*. If a still of your scene has colour
  across the whole frame, lower `intensity` or raise the power curve — the
  emptiness is the look, not a lack of effort.
- Use `CURVES.backOut` at most once in a film.
- One accent colour, used for the payoff. Two accents is a startup template.
