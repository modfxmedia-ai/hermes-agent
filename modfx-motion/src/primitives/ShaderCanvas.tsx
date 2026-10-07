import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export type Uniform = number | number[];

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

interface GLState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  locations: Map<string, WebGLUniformLocation | null>;
}

const compile = (
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader => {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "unknown";
    throw new Error(`Shader compile failed:\n${log}`);
  }
  return sh;
};

/**
 * A full-bleed fragment shader, driven deterministically by the Remotion frame.
 *
 * The shader renders at `scale` of the composition size and is stretched back
 * up by CSS. For the soft, low-frequency fields we use as backgrounds this is
 * visually identical at 0.5 and four times cheaper — which matters a lot when
 * the renderer is a software GL context.
 *
 * Drawing happens in `useLayoutEffect`, i.e. synchronously during React's
 * commit and before the browser paints, so the canvas is guaranteed to hold
 * the right pixels when Remotion screenshots the frame.
 */
export const ShaderCanvas: React.FC<{
  frag: string;
  uniforms?: Record<string, Uniform>;
  /** Internal render scale. 0.5 is the default and is almost always enough. */
  scale?: number;
  opacity?: number;
  blendMode?: React.CSSProperties["mixBlendMode"];
  style?: React.CSSProperties;
}> = ({ frag, uniforms, scale = 0.5, opacity = 1, blendMode, style }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GLState | null>(null);

  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(height * scale));

  // Re-key the GL program when the shader source changes.
  const fragKey = useMemo(() => frag, [frag]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!stateRef.current) {
      const gl = canvas.getContext("webgl2", {
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
      if (!gl) {
        // No GL available: leave the canvas transparent rather than throwing.
        // Callers stack these under a CSS gradient, so the film still renders.
        return;
      }
      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragKey));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Link failed: ${gl.getProgramInfoLog(program)}`);
      }
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      // One oversized triangle covers the viewport with no index buffer.
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      stateRef.current = { gl, program, locations: new Map() };
    }

    const state = stateRef.current;
    if (!state) return;
    const { gl, program, locations } = state;

    const uniformLoc = (name: string) => {
      if (!locations.has(name)) {
        locations.set(name, gl.getUniformLocation(program, name));
      }
      return locations.get(name) ?? null;
    };

    gl.useProgram(program);
    gl.viewport(0, 0, w, h);

    gl.uniform1f(uniformLoc("uTime"), frame / fps);
    gl.uniform2f(uniformLoc("uResolution"), w, h);

    for (const [name, value] of Object.entries(uniforms ?? {})) {
      const l = uniformLoc(name);
      if (l === null) continue;
      if (typeof value === "number") gl.uniform1f(l, value);
      else if (value.length === 2) gl.uniform2fv(l, value);
      else if (value.length === 3) gl.uniform3fv(l, value);
      else if (value.length === 4) gl.uniform4fv(l, value);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }, [frame, fps, w, h, fragKey, uniforms]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        mixBlendMode: blendMode,
        ...style,
      }}
    />
  );
};
