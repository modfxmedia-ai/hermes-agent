import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { PRELUDE } from "../core/glsl";
import { type Brand, rgb01 } from "../brand/tokens";
import { ShaderCanvas } from "./ShaderCanvas";

/**
 * Domain-warped noise field — the signature abstract background.
 *
 * Two layers of fbm, the second one displaced by the first, which is what
 * turns generic cloud noise into the folded, liquid, "aurora" structure you
 * see behind OpenAI and Apple product films. A drifting key light adds a
 * sense of a physical light source somewhere off-frame.
 *
 * Everything is a function of `uTime` only, so the field is identical on every
 * re-render and can be scrubbed, re-cut, and re-rendered without drift.
 */
const FRAG = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;

uniform float uTime;
uniform vec2  uResolution;
uniform vec3  uBg;
uniform vec3  uC0;
uniform vec3  uC1;
uniform vec3  uC2;
uniform vec3  uC3;
uniform float uIntensity;
uniform float uSpeed;
uniform float uScale;
uniform float uWarp;
uniform vec2  uFocus;
uniform float uBloom;
uniform float uGrounded;

${PRELUDE}

void main(){
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float t = uTime * uSpeed;

  // Layer 1: the warp field. Large and slow.
  float q = fbm(vec3(p * uScale, t * 0.30));

  // Layer 2: displaced by layer 1 — this is where the folding comes from.
  float r = fbm(vec3(p * uScale * 1.18 + q * uWarp, t * 0.19 + 14.7));

  // Crush the field. Most of the frame must sit at or near page black; the
  // colour only surfaces in one or two plumes. A power curve on a 0..1
  // field is the cheapest way to buy emptiness, and emptiness is the look.
  float n = smoothstep(-0.25, 1.05, r);
  n = pow(n, 2.6);
  float m = smoothstep(-0.5, 0.9, q);

  // Build additively out of the page black rather than mixing across a ramp,
  // so unlit regions stay exactly the brand background.
  vec3 col = uBg;
  col += uC1 * n * 0.85;
  col += uC2 * pow(n, 1.9) * m * 0.9;
  col += uC3 * pow(n, 3.4) * 0.8;

  // Drifting key light. Slow, elliptical, never repeats within a 25s film.
  vec2 lightPos = uFocus + vec2(sin(t * 0.21) * 0.15, cos(t * 0.17) * 0.08);
  float d = length((p - lightPos) * vec2(0.8, 1.3));
  col += uC3 * exp(-d * 2.6) * uBloom * 0.30;
  col += uC2 * exp(-d * 5.4) * uBloom * 0.18;

  // Ground the frame: darken toward the bottom so type has somewhere to sit.
  float ground = mix(1.0, smoothstep(-0.15, 0.9, uv.y), uGrounded);
  col = mix(uBg, col, ground);

  col = mix(uBg, col, uIntensity);
  col = tonemap(col * 1.05);
  col = applyDither(col, gl_FragCoord.xy);

  outColor = vec4(col, 1.0);
}
`;

export interface AuroraFieldProps {
  brand: Brand;
  /** 0..1 — how far the field rises out of the page black. */
  intensity?: number;
  /** Drift rate. 0.15-0.4 reads as "alive but calm". Above 1 it looks nervous. */
  speed?: number;
  /** Feature size. Lower = bigger, softer shapes. */
  scale?: number;
  /** Displacement strength of layer 1 on layer 2. The folding knob. */
  warp?: number;
  /** Key-light centre in aspect-corrected space, roughly -0.9..0.9 x, -0.5..0.5 y. */
  focus?: [number, number];
  /** Darken the lower half so headline type has a clean bed. */
  grounded?: number;
  opacity?: number;
  scaleFactor?: number;
}

export const AuroraField: React.FC<AuroraFieldProps> = ({
  brand,
  intensity = 1,
  speed = 0.26,
  scale = 0.55,
  warp = 0.85,
  focus = [0.08, 0.04],
  grounded = 0.45,
  opacity = 1,
  scaleFactor = 0.5,
}) => {
  const uniforms = useMemo(
    () => ({
      uBg: rgb01(brand.color.bg),
      uC0: rgb01(brand.color.aurora[0]),
      uC1: rgb01(brand.color.aurora[1]),
      uC2: rgb01(brand.color.aurora[2]),
      uC3: rgb01(brand.color.aurora[3]),
      uIntensity: intensity,
      uSpeed: speed,
      uScale: scale,
      uWarp: warp,
      uFocus: focus as number[],
      uBloom: brand.bloom,
      uGrounded: grounded,
    }),
    [brand, intensity, speed, scale, warp, focus, grounded],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: brand.color.bg }}>
      <ShaderCanvas
        frag={FRAG}
        uniforms={uniforms}
        scale={scaleFactor}
        opacity={opacity}
      />
    </AbsoluteFill>
  );
};
