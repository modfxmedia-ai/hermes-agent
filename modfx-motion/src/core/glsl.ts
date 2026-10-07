/**
 * Shared GLSL. Kept as strings so shaders compose by concatenation and the
 * whole pipeline stays dependency-free.
 */

/** Ashima / Stefan Gustavson simplex noise (3D). Public domain. */
export const SIMPLEX3 = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/**
 * Fractal brownian motion over simplex, in two flavours.
 *
 * Octave count is the single most important aesthetic dial in the whole
 * system. Five octaves gives you marble — a busy, high-frequency texture that
 * reads as a stock wallpaper. Expensive-looking abstract backgrounds are the
 * opposite: two or three octaves at a large feature size, so the frame holds
 * one or two enormous soft shapes and a lot of calm.
 *
 * `fbm` (2 octaves) is the default for backgrounds. `fbmDetail` (4) is for
 * the rare case where you actually want visible structure.
 */
export const FBM = /* glsl */ `
float fbm(vec3 p){
  float v = 0.0;
  float a = 0.62;
  for (int i = 0; i < 2; i++) {
    v += a * snoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}
float fbmDetail(vec3 p){
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}
`;

/**
 * Ordered-dither in the shader. Smooth dark gradients band horribly in 8-bit
 * h264; a sub-LSB dither costs nothing and removes the banding entirely.
 * This is the difference between "cheap gradient" and "expensive gradient".
 */
export const DITHER = /* glsl */ `
float ditherValue(vec2 fragCoord){
  return fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
}
vec3 applyDither(vec3 c, vec2 fragCoord){
  return c + (ditherValue(fragCoord) - 0.5) / 255.0;
}
`;

/** ACES-ish filmic tonemap. Keeps bright accents from clipping to flat white. */
export const TONEMAP = /* glsl */ `
vec3 tonemap(vec3 x){
  const float a = 2.51; const float b = 0.03;
  const float c = 2.43; const float d = 0.59; const float e = 0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}
`;

export const PRELUDE = SIMPLEX3 + FBM + DITHER + TONEMAP;
