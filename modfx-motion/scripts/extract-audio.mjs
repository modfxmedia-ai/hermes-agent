#!/usr/bin/env node
/**
 * Bake a music track down to a per-frame envelope the composition can sample.
 *
 * Audio-reactive motion has to be a pure function of the frame like everything
 * else, so the analysis happens once, offline, and ships as JSON. Sampling the
 * audio at render time would be non-deterministic and would not survive a
 * re-render on another machine.
 *
 * Two bands come out: overall level, and bass alone. Bass is the useful one
 * for motion — it tracks the kick and the sub swells, which is what the eye
 * expects a glow or a scale to breathe with. Full-spectrum level follows
 * hi-hats and air, which produces jitter rather than feel.
 *
 * Usage: node scripts/extract-audio.mjs <track.wav> --fps 30 --out src/audio/<name>.json
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const input = args[0];
if (!input) {
  console.error("usage: node scripts/extract-audio.mjs <track> [--fps 30] [--out path.json]");
  process.exit(1);
}
const flagOf = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const FPS = Number(flagOf("fps", 30));
const OUT = resolve(flagOf("out", input.replace(/\.[^.]+$/, "") + ".json"));
const SR = 48000;

const pcm = (filters) =>
  new Promise((res, rej) => {
    const a = ["-hide_banner", "-loglevel", "error", "-i", input];
    if (filters) a.push("-af", filters);
    a.push("-ac", "1", "-ar", String(SR), "-f", "s16le", "-");
    const p = spawn("ffmpeg", a);
    const out = [];
    const err = [];
    p.stdout.on("data", (d) => out.push(d));
    p.stderr.on("data", (d) => err.push(d));
    p.on("close", (c) =>
      c === 0 ? res(Buffer.concat(out)) : rej(new Error(Buffer.concat(err).toString())),
    );
  });

/** RMS per frame window, normalised to its own peak. */
const envelope = (buf, samplesPerFrame) => {
  const frames = Math.floor(buf.length / 2 / samplesPerFrame);
  const out = new Array(frames);
  let peak = 0;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = 0; i < samplesPerFrame; i++) {
      const s = buf.readInt16LE((f * samplesPerFrame + i) * 2) / 32768;
      sum += s * s;
    }
    const rms = Math.sqrt(sum / samplesPerFrame);
    out[f] = rms;
    if (rms > peak) peak = rms;
  }
  return peak > 0 ? out.map((v) => Number((v / peak).toFixed(4))) : out;
};

/**
 * One-pole smoothing with a fast attack and a slow release, which is how a
 * compressor's envelope follower behaves and why it reads as musical rather
 * than twitchy.
 */
const smooth = (arr, attack = 0.5, release = 0.08) => {
  let v = 0;
  return arr.map((x) => {
    v = x > v ? v + (x - v) * attack : v + (x - v) * release;
    return Number(v.toFixed(4));
  });
};

const main = async () => {
  const samplesPerFrame = Math.round(SR / FPS);
  const level = smooth(envelope(await pcm(null), samplesPerFrame));
  const bass = smooth(envelope(await pcm("lowpass=f=170"), samplesPerFrame), 0.55, 0.07);

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify({ fps: FPS, frames: level.length, level, bass }),
  );
  console.log(`✓ ${level.length} frames (${(level.length / FPS).toFixed(2)}s) -> ${OUT}`);
};

main().catch((e) => { console.error(e.message); process.exit(1); });
