import { Config } from "@remotion/cli/config";

/**
 * Container-safe render settings.
 *
 * `swiftshader` gives us a software GL context so WebGL/SVG-filter compositing
 * behaves the same on a laptop and on a headless CI box. Without it, a
 * container with no GPU silently falls back to a different rasteriser and
 * gradients band differently between machines.
 */
Config.setChromiumOpenGlRenderer("swiftshader");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(17);
Config.setChromiumDisableWebSecurity(true);

if (process.env.MODFX_BROWSER) {
  Config.setBrowserExecutable(process.env.MODFX_BROWSER);
}
