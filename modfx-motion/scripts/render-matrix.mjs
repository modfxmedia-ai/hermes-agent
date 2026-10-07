#!/usr/bin/env node
/**
 * Render one film to every delivery format, then bake its poster.
 *
 * Two things here are not optional in 2026 delivery and are routinely missed:
 *
 *   Vertical is not a crop. 9:16 gets its own composition with its own type
 *   scale and safe areas, because TikTok/Reels/Shorts put UI over the bottom
 *   ~18% and the right ~14% of the frame. Centre-cropping a 16:9 film puts
 *   the headline under the caption and the CTA under the share button.
 *
 *   Frame 0 is the thumbnail. A bare .mp4 carries no poster attribute, and
 *   Slack, X, Discord and LinkedIn all regenerate previews server-side and
 *   ignore embedded cover art. The only reliable way to control the idle
 *   image everywhere is to make frame 0 be the poster — so we overlay the
 *   chosen still onto frame 0 only, leaving duration, frame count and audio
 *   sync untouched.
 *
 * Usage:
 *   node scripts/render-matrix.mjs --id Northline --poster 7.4
 *                                  [--formats landscape,vertical,square]
 *                                  [--out out] [--quality high|draft]
 */
import { spawn } from "node:child_process";
import { mkdir, rename, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };

const baseId = flag("id");
if (!baseId) {
  console.error("usage: node scripts/render-matrix.mjs --id <CompositionBase> --poster <seconds>");
  process.exit(1);
}
const posterAt = Number(flag("poster", 2));
const outDir = resolve(flag("out", "out"));
const quality = flag("quality", "high");
const formats = flag("formats", "landscape,vertical,square").split(",");

const SUFFIX = { landscape: "", vertical: "Vertical", square: "Square" };

const sh = (cmd, a) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: "inherit", env: process.env });
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`))));
  });

const main = async () => {
  await mkdir(outDir, { recursive: true });

  for (const format of formats) {
    const compId = `${baseId}${SUFFIX[format] ?? ""}`;
    const mp4 = resolve(outDir, `${baseId}-${format}.mp4`);
    const jpg = resolve(outDir, `${baseId}-${format}.jpg`);

    console.log(`\n▸ ${compId} → ${mp4}`);
    await sh("npx", [
      "remotion", "render", compId, mp4,
      "--log=error",
      ...(quality === "draft" ? ["--jpeg-quality=70", "--crf=28"] : ["--crf=17"]),
    ]);

    // Pull the poster from a settled beat, full resolution.
    console.log(`  poster @ ${posterAt}s → ${jpg}`);
    await sh("ffmpeg", [
      "-v", "error", "-y", "-ss", String(posterAt), "-i", mp4,
      "-frames:v", "1", "-q:v", "2", jpg,
    ]);

    // Replace frame 0's pixels only, and normalise loudness while we are
    // re-encoding anyway.
    //
    // A cinematic bed masters quiet, and a quiet master sounds weak in a feed
    // next to everything else. -14 LUFS integrated with a -1.5 dBTP ceiling is
    // what the social platforms normalise toward, so hitting it ourselves means
    // the film arrives at the level it was mixed at instead of being pushed
    // around. Video is untouched: same duration, same frame count.
    const tmp = mp4.replace(/\.mp4$/, ".poster.mp4");
    await sh("ffmpeg", [
      "-v", "error", "-y", "-i", mp4, "-i", jpg,
      "-filter_complex", "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]",
      "-map", "[v]", "-map", "0:a?",
      "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
      "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
      "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
      "-movflags", "+faststart", tmp,
    ]);
    await unlink(mp4);
    await rename(tmp, mp4);
    console.log(`  ✓ poster baked as frame 0`);
  }

  console.log(`\n✓ ${formats.length} format(s) in ${outDir}\n`);
};

main().catch((e) => { console.error(e.message); process.exit(1); });
