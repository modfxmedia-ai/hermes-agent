#!/usr/bin/env node
/**
 * Synthesise the film's sound-design layer.
 *
 * The expensive feel of a launch film is not the music, it is the sub-bass
 * landing on the cut, the tick as a row arrives and the air moving between
 * scenes. Those are synthetic sounds in the first place — a sub drop is a
 * sine whose pitch falls under an exponential envelope — so generating them
 * here rather than licensing a pack keeps the whole audio bed deterministic,
 * royalty-free, and tunable to the film's key.
 *
 * Everything is written in A minor to sit under the music bed: fundamentals
 * on A (55/110/220 Hz) and E (82.4/164.8 Hz).
 *
 * Usage: node scripts/make-sfx.mjs [--out public/audio/sfx]
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const flagOf = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const OUT = resolve(flagOf("out", "public/audio/sfx"));
const SR = 48000;

const ff = (a) =>
  new Promise((res, rej) => {
    const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a]);
    const err = [];
    p.stderr.on("data", (d) => err.push(d));
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(Buffer.concat(err).toString()))));
  });

/** One synthesised cue. `expr` is an aevalsrc expression in `t` (seconds). */
const tone = (name, expr, dur, post = []) =>
  ff([
    "-f", "lavfi",
    "-i", `aevalsrc='${expr}':s=${SR}:d=${dur}`,
    "-af", ["aformat=sample_fmts=s16:channel_layouts=stereo", ...post].join(","),
    "-c:a", "pcm_s16le",
    resolve(OUT, `${name}.wav`),
  ]);

/** Noise-based cue. Seeded so it regenerates identically. */
const noise = (name, dur, seed, filters) =>
  ff([
    "-f", "lavfi",
    "-i", `anoisesrc=c=pink:r=${SR}:d=${dur}:seed=${seed}:a=0.9`,
    "-af", [...filters, "aformat=sample_fmts=s16:channel_layouts=stereo"].join(","),
    "-c:a", "pcm_s16le",
    resolve(OUT, `${name}.wav`),
  ]);

const main = async () => {
  await mkdir(OUT, { recursive: true });

  // Sub impact. Pitch falls 110 -> 40 Hz under a fast exponential decay: the
  // sound of weight arriving. Lands on hard cuts and the logo.
  await tone(
    "impact-sub",
    "0.92*sin(2*PI*t*(70*exp(-t*7)+40))*exp(-t*3.2)",
    1.6,
    ["lowpass=f=180", "volume=1.0"],
  );

  // Lighter version for mid-film beats, pitched to E.
  await tone(
    "impact-soft",
    "0.7*sin(2*PI*t*(60*exp(-t*9)+55))*exp(-t*5.5)",
    1.0,
    ["lowpass=f=220"],
  );

  // UI tick. Two cycles of a high sine inside a 12 ms envelope — short enough
  // to read as a click rather than a note.
  await tone("ui-tick", "0.5*sin(2*PI*t*2100)*exp(-t*260)", 0.09, ["highpass=f=900"]);

  // Softer tick for repeated row arrivals, so a sequence does not fatigue.
  await tone("ui-tick-soft", "0.34*sin(2*PI*t*1500)*exp(-t*190)", 0.1, ["highpass=f=700"]);

  // Keyboard-ish tap for the typed query.
  await tone("ui-key", "0.3*sin(2*PI*t*900)*exp(-t*320)", 0.06, ["highpass=f=500"]);

  // Bell. Three partials on A, long decay. The endcard payoff.
  await tone(
    "bell-a",
    "0.32*sin(2*PI*t*440)*exp(-t*1.6)+0.17*sin(2*PI*t*880)*exp(-t*2.4)+0.09*sin(2*PI*t*1320)*exp(-t*3.6)",
    3.2,
  );

  // Riser into a reveal: band-passed noise sweeping upward with the level.
  await noise("riser", 1.8, 1337, [
    "highpass=f=300",
    "bandpass=f=1200:width_type=o:w=2",
    "volume='0.06+0.5*pow(t/1.8,2.2)':eval=frame",
    "afade=t=out:st=1.65:d=0.15",
  ]);

  // Transition air. Short filtered noise that moves past rather than hits.
  await noise("air-pass", 0.75, 4242, [
    "bandpass=f=900:width_type=o:w=2.4",
    "volume='0.42*sin(PI*min(t/0.75,1))':eval=frame",
  ]);

  // Wide, very soft room tone under the whole film. Stops the quiet passages
  // sounding like the audio dropped out.
  await noise("bed-air", 26, 909, [
    "lowpass=f=1400",
    "highpass=f=120",
    "volume=0.035",
    "afade=t=in:st=0:d=1.5",
    "afade=t=out:st=24.5:d=1.5",
  ]);

  console.log(`✓ sound design written to ${OUT}`);
};

main().catch((e) => { console.error(e.message); process.exit(1); });
