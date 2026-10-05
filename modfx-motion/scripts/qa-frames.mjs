#!/usr/bin/env node
/**
 * Automated frame QA.
 *
 * Renders are cheap to make and expensive to watch. This samples the finished
 * mp4 and flags the four failures that actually ship in automated video:
 *
 *   DEAD  — a frame that is essentially empty. Usually the opening beat, and
 *           usually what a platform then picks as the thumbnail.
 *   FLAT  — almost no tonal range. The scene is technically present but reads
 *           as a grey card at thumbnail size.
 *   SOFT  — edge energy well below the film's own median, i.e. everything is
 *           mid-transition. One or two is a cut; a run of them is mud.
 *   BLOWN — clipped highlights over a large area, which is where cheap bloom
 *           turns into a white blob.
 *
 * It also writes a contact sheet so a human can scan every beat in one look.
 *
 * Pixels come straight from ffmpeg as rgb24, so there is no image library and
 * nothing to install.
 *
 * Usage: node scripts/qa-frames.mjs out/film.mp4 [--fps 2] [--sheet out/qa.jpg]
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const input = args[0];
if (!input) {
  console.error("usage: node scripts/qa-frames.mjs <video.mp4> [--fps 2] [--sheet path.jpg]");
  process.exit(1);
}
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };

const SAMPLE_FPS = Number(flag("fps", 2));
const W = 320, H = 180;
const sheet = resolve(flag("sheet", input.replace(/\.mp4$/, "") + ".qa.jpg"));

const run = (cmd, a, opts = {}) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, a, { ...opts });
    const chunks = [];
    const errs = [];
    p.stdout?.on("data", (d) => chunks.push(d));
    p.stderr?.on("data", (d) => errs.push(d));
    p.on("close", (code) =>
      code === 0
        ? res(Buffer.concat(chunks))
        : rej(new Error(Buffer.concat(errs).toString().slice(-2000))),
    );
  });

const analyse = (buf) => {
  const n = W * H;
  let sum = 0;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = buf[i * 3] / 255, g = buf[i * 3 + 1] / 255, b = buf[i * 3 + 2] / 255;
    // Rec.709 luma — matches how the eye weights the channels.
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum[i] = l;
    sum += l;
  }
  const mean = sum / n;

  let varSum = 0, blown = 0, edge = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const l = lum[i];
      varSum += (l - mean) ** 2;
      if (l > 0.97) blown++;
      if (x < W - 1) edge += Math.abs(l - lum[i + 1]);
      if (y < H - 1) edge += Math.abs(l - lum[i + W]);
    }
  }
  return {
    mean,
    std: Math.sqrt(varSum / n),
    blown: blown / n,
    edge: edge / (n * 2),
  };
};

const main = async () => {
  const raw = await run("ffmpeg", [
    "-v", "error", "-i", input,
    "-vf", `fps=${SAMPLE_FPS},scale=${W}:${H}`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
  ]);

  const frameBytes = W * H * 3;
  const count = Math.floor(raw.length / frameBytes);
  if (count === 0) {
    console.error("No frames decoded — is the path right?");
    process.exit(1);
  }

  const stats = [];
  for (let i = 0; i < count; i++) {
    stats.push(analyse(raw.subarray(i * frameBytes, (i + 1) * frameBytes)));
  }

  const edges = stats.map((s) => s.edge).slice().sort((a, b) => a - b);
  const medianEdge = edges[Math.floor(edges.length / 2)] ?? 0;

  const issues = [];
  stats.forEach((s, i) => {
    const t = (i / SAMPLE_FPS).toFixed(2);
    const flags = [];
    if (s.mean < 0.035 && s.std < 0.035) flags.push("DEAD");
    else if (s.std < 0.05) flags.push("FLAT");
    if (medianEdge > 0 && s.edge < medianEdge * 0.42) flags.push("SOFT");
    if (s.blown > 0.14) flags.push("BLOWN");
    if (flags.length) issues.push({ t, i, flags, ...s });
  });

  console.log(`\n  ${count} frames sampled at ${SAMPLE_FPS}fps · median edge ${medianEdge.toFixed(4)}\n`);

  // Frame 0 is the thumbnail on every platform that regenerates previews.
  const first = stats[0];
  if (first && first.mean < 0.05 && first.std < 0.05) {
    console.log("  ✗ POSTER  frame 0 is near-empty — every platform will use it as the thumbnail.");
    console.log("            Bake a settled frame in as frame 0 (scripts/render-matrix.mjs does this).\n");
  } else {
    console.log("  ✓ POSTER  frame 0 has content\n");
  }

  if (issues.length === 0) {
    console.log("  ✓ no frame-level issues found\n");
  } else {
    // Collapse runs of the same flag set into one line; a 6-frame SOFT run is
    // one problem, not six. Frames must be *adjacent* in the sample index to
    // merge — otherwise two isolated blips thirteen seconds apart get
    // reported as one long failure, which is worse than not reporting.
    const runs = [];
    let cur = null;
    for (const issue of issues) {
      const key = issue.flags.join("+");
      if (cur && cur.key === key && issue.i === cur.lastIndex + 1) {
        cur.until = issue.t;
        cur.lastIndex = issue.i;
        cur.n++;
      } else {
        if (cur) runs.push(cur);
        cur = { ...issue, key, until: issue.t, lastIndex: issue.i, n: 1 };
      }
    }
    if (cur) runs.push(cur);

    for (const r of runs) {
      const span =
        r.n === 1 ? `${r.t}s` : `${r.t}s–${r.until}s (${r.n} frames)`;
      console.log(
        `  ! ${r.flags.join("+").padEnd(11)} ${span.padEnd(16)} ` +
          `mean ${r.mean.toFixed(3)}  std ${r.std.toFixed(3)}  edge ${r.edge.toFixed(4)}`,
      );
    }
    console.log("");
  }

  await mkdir(dirname(sheet), { recursive: true });
  const cols = 6;
  const rows = Math.ceil(count / cols);
  await run("ffmpeg", [
    "-v", "error", "-y", "-i", input,
    "-vf", `fps=${SAMPLE_FPS},scale=400:-1,tile=${cols}x${rows}:padding=6:margin=6:color=0x111317`,
    "-frames:v", "1", "-q:v", "4", sheet,
  ]);
  console.log(`  contact sheet → ${sheet}\n`);

  process.exit(issues.some((i) => i.flags.includes("DEAD")) ? 1 : 0);
};

main().catch((e) => { console.error(e.message); process.exit(1); });
