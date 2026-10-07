#!/usr/bin/env node
/**
 * Deterministic site capture.
 *
 * Produces the tall full-page PNG that ProductScene scroll-scrubs, plus
 * optional viewport stills. Three things make it deterministic, and all three
 * matter — a capture that shifts between runs makes every re-render of the
 * film subtly different:
 *
 *   1. Animations and transitions are frozen via injected CSS.
 *   2. Cookie banners and fixed overlays are removed before the shot.
 *   3. The page is scrolled to the bottom and back first, so lazy images and
 *      scroll-triggered reveals have fired. Without this, half a modern
 *      marketing page captures as empty boxes.
 *
 * Usage:
 *   node scripts/capture.mjs <url> [--out public/captures/name.png]
 *                                  [--width 1440] [--scale 2] [--viewport]
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const url = args[0];
if (!url || url.startsWith("--")) {
  console.error("usage: node scripts/capture.mjs <url> [--out path.png] [--width n] [--scale n] [--viewport]");
  process.exit(1);
}
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const width = Number(flag("width", 1440));
const scale = Number(flag("scale", 2));
const host = new URL(url).hostname.replace(/^www\./, "").replace(/\./g, "-");
const out = resolve(flag("out", `public/captures/${host}.png`));

const EXECUTABLE =
  process.env.MODFX_BROWSER_FULL ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
  }
  /* Scroll-reveal libraries leave content at opacity:0 until observed. */
  [data-aos], .aos-init, .reveal, .fade-in, [class*="animate-"] {
    opacity: 1 !important;
    transform: none !important;
    visibility: visible !important;
  }
`;

const KILL_OVERLAYS = `
  (() => {
    const patterns = /cookie|consent|gdpr|banner|newsletter|popup|modal|chat|intercom|drift|beacon/i;
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const id = (el.id || "") + " " + (el.className?.toString?.() || "");
      const style = getComputedStyle(el);
      const fixed = style.position === "fixed" || style.position === "sticky";
      if (patterns.test(id) && fixed) el.remove();
    }
    // Un-stick remaining fixed headers so they don't repeat down the capture.
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const style = getComputedStyle(el);
      if (style.position === "fixed") el.style.position = "absolute";
    }
  })();
`;

const run = async () => {
  await mkdir(dirname(out), { recursive: true });
  // Honour a corporate/agent HTTP proxy if one is configured. Chromium does
  // not read the *_PROXY environment variables on its own.
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch({
    executablePath: EXECUTABLE,
    args: ["--force-color-profile=srgb"],
    ...(proxyUrl
      ? { proxy: { server: proxyUrl, bypass: process.env.NO_PROXY ?? "" } }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: scale,
    colorScheme: "dark",
    reducedMotion: "reduce",
  });

  console.log(`→ ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch(async () => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  });

  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(KILL_OVERLAYS);

  // Walk the page so lazy content and scroll reveals fire, then return to top.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    const height = document.body.scrollHeight;
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });

  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(600);

  await page.screenshot({ path: out, fullPage: !has("viewport") });

  const meta = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent?.trim() ?? null,
    description:
      document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
    height: document.body.scrollHeight,
  }));

  await browser.close();
  console.log(`✓ ${out}`);
  console.log(`  ${meta.height}px tall · "${meta.title}"`);
  if (meta.h1) console.log(`  h1: ${meta.h1}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
