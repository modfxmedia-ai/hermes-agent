import React from "react";
import { type Brand, alpha } from "../brand/tokens";
import { track, mix, clamp01 } from "../core/easing";
import { useSeconds } from "../core/timing";

/**
 * Simulated product UI.
 *
 * A scroll-scrubbed screenshot shows that a product exists. Showing it being
 * *used* — a cursor travelling, a click landing, a result arriving — is what
 * makes a viewer believe it works. For an app launch that difference is the
 * whole film, so the UI here is rebuilt as live DOM rather than captured, and
 * driven by a declarative step timeline.
 *
 * Everything is a pure function of time, so the interaction is frame-exact and
 * re-renders identically.
 */

export interface Anchor {
  /** Position as a percentage of the window, so it is resolution independent. */
  x: number;
  y: number;
}

export type FlowStep =
  | { at: number; kind: "move"; to: Anchor }
  | { at: number; kind: "click"; to: Anchor }
  | { at: number; kind: "type"; to: Anchor; text: string; over?: number };

/**
 * Pointer that travels between anchors and pulses on click.
 *
 * Real cursors do not move linearly and they do not stop dead. The travel uses
 * the house slow-out curve and the click fires a ring that expands and fades
 * over 0.45s — the same affordance a real UI gives, which is why it reads as
 * genuine rather than as an arrow sliding across a mockup.
 */
export const Cursor: React.FC<{
  brand: Brand;
  steps: FlowStep[];
  start?: number;
  size?: number;
}> = ({ brand, steps, start = 0, size = 22 }) => {
  const t = useSeconds() - start;

  const moves = steps.filter(
    (s): s is Extract<FlowStep, { to: Anchor }> => "to" in s,
  );
  if (moves.length === 0) return null;

  // Resolve the cursor position: travel toward each successive anchor.
  let pos: Anchor = moves[0]!.to;
  for (let i = 0; i < moves.length; i++) {
    const step = moves[i]!;
    const prev = i === 0 ? moves[0]!.to : moves[i - 1]!.to;
    const travel = 0.55;
    const p = track(t, step.at - travel, travel, "heroOut");
    if (p > 0) pos = { x: mix(prev.x, step.to.x, p), y: mix(prev.y, step.to.y, p) };
  }

  const visible = track(t, Math.max(0, (moves[0]?.at ?? 0) - 0.8), 0.4, "quintOut");

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {steps
        .filter((s) => s.kind === "click")
        .map((s, i) => {
          const p = track(t, s.at, 0.45, "quintOut");
          if (p <= 0 || p >= 1) return null;
          const a = "to" in s ? s.to : { x: 50, y: 50 };
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${a.x}%`,
                top: `${a.y}%`,
                width: mix(10, 72, p),
                height: mix(10, 72, p),
                marginLeft: mix(-5, -36, p),
                marginTop: mix(-5, -36, p),
                borderRadius: "50%",
                border: `2px solid ${brand.color.accent}`,
                opacity: (1 - p) * 0.75,
              }}
            />
          );
        })}

      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 16 20"
        style={{
          position: "absolute",
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          opacity: visible,
          filter: "drop-shadow(0 3px 7px rgba(0,0,0,0.65))",
        }}
      >
        <path
          d="M1 1 L1 15.2 L4.9 11.6 L7.4 17.6 L10.1 16.4 L7.7 10.7 L13 10.4 Z"
          fill="#FFFFFF"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/** Text that types itself in, driven by a `type` step. */
export const TypedText: React.FC<{
  text: string;
  at: number;
  over?: number;
  start?: number;
  caret?: string;
}> = ({ text, at, over = 0.9, start = 0, caret }) => {
  const t = useSeconds() - start;
  const p = clamp01((t - at) / over);
  const shown = text.slice(0, Math.round(p * text.length));
  const caretOn = p > 0 && p < 1 ? true : Math.floor(t * 2) % 2 === 0 && p >= 1;
  return (
    <>
      {shown}
      {caret && caretOn ? (
        <span style={{ color: caret, marginLeft: 1 }}>|</span>
      ) : null}
    </>
  );
};

export interface AppRow {
  label: string;
  meta?: string;
  /** Seconds (relative to the scene) when this row arrives. */
  at?: number;
  /** Pill text shown on the right, e.g. a status. */
  tag?: string;
  accent?: boolean;
}

/**
 * Premium dashboard chrome: rail, top bar, search, content.
 *
 * Deliberately generic in structure and specific in styling — the layout is
 * what every operations product looks like, the colour and type come entirely
 * from the brand, so one component serves every client without reading as a
 * template.
 */
export const AppWindow: React.FC<{
  brand: Brand;
  title: string;
  nav: string[];
  activeNav?: number;
  searchPlaceholder?: string;
  typed?: { text: string; at: number; over?: number };
  rows: AppRow[];
  metric?: { label: string; value: string; at?: number };
  start?: number;
  width?: number | string;
  height?: number | string;
  scale?: number;
}> = ({
  brand,
  title,
  nav,
  activeNav = 0,
  searchPlaceholder = "Search",
  typed,
  rows,
  metric,
  start = 0,
  width = "100%",
  height = "100%",
  scale = 1,
}) => {
  const t = useSeconds() - start;
  const s = scale;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        display: "flex",
        background: brand.color.bgDeep,
        color: brand.color.ink,
        fontFamily: brand.type.body,
        overflow: "hidden",
      }}
    >
      {/* Rail */}
      <div
        style={{
          width: 188 * s,
          flexShrink: 0,
          borderRight: `1px solid ${brand.color.line}`,
          padding: `${20 * s}px ${14 * s}px`,
          background: alpha(brand.color.surface, 0.55),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9 * s,
            marginBottom: 26 * s,
            paddingLeft: 6 * s,
          }}
        >
          <span
            style={{
              width: 11 * s,
              height: 11 * s,
              borderRadius: 3 * s,
              background: brand.color.accent,
              boxShadow: `0 0 ${14 * s}px ${brand.color.accent}`,
            }}
          />
          <span
            style={{
              fontFamily: brand.type.display,
              fontWeight: 650,
              fontSize: 15 * s,
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </span>
        </div>
        {nav.map((item, i) => (
          <div
            key={i}
            style={{
              padding: `${8 * s}px ${10 * s}px`,
              marginBottom: 3 * s,
              borderRadius: 7 * s,
              fontSize: 12.5 * s,
              fontWeight: i === activeNav ? 600 : 450,
              color: i === activeNav ? brand.color.ink : brand.color.inkMuted,
              background: i === activeNav ? alpha(brand.color.accent, 0.13) : "transparent",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            height: 52 * s,
            flexShrink: 0,
            borderBottom: `1px solid ${brand.color.line}`,
            display: "flex",
            alignItems: "center",
            padding: `0 ${18 * s}px`,
            gap: 14 * s,
          }}
        >
          <div
            style={{
              flex: 1,
              maxWidth: 360 * s,
              height: 32 * s,
              borderRadius: 8 * s,
              border: `1px solid ${brand.color.line}`,
              background: alpha(brand.color.bg, 0.6),
              display: "flex",
              alignItems: "center",
              padding: `0 ${12 * s}px`,
              fontSize: 12.5 * s,
              color: typed && t >= typed.at ? brand.color.ink : brand.color.inkFaint,
            }}
          >
            {typed ? (
              <TypedText
                text={typed.text}
                at={typed.at}
                over={typed.over}
                start={start}
                caret={brand.color.accent}
              />
            ) : (
              searchPlaceholder
            )}
          </div>
          {metric ? (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div
                style={{
                  fontFamily: brand.type.display,
                  fontSize: 19 * s,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: brand.color.accent,
                  opacity: track(t, metric.at ?? 0, 0.5, "quintOut"),
                }}
              >
                {metric.value}
              </div>
              <div
                style={{
                  fontFamily: brand.type.mono,
                  fontSize: 9 * s,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: brand.color.inkMuted,
                }}
              >
                {metric.label}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1, padding: `${16 * s}px ${18 * s}px`, overflow: "hidden" }}>
          {rows.map((row, i) => {
            const p = track(t, row.at ?? 0, 0.55, "heroOut");
            if (p <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12 * s,
                  padding: `${11 * s}px ${13 * s}px`,
                  marginBottom: 7 * s,
                  borderRadius: 9 * s,
                  border: `1px solid ${row.accent ? alpha(brand.color.accent, 0.4) : brand.color.line}`,
                  background: row.accent
                    ? alpha(brand.color.accent, 0.09)
                    : alpha(brand.color.surface, 0.5),
                  opacity: p,
                  transform: `translate3d(0, ${(1 - p) * 14}px, 0)`,
                }}
              >
                <span
                  style={{
                    width: 7 * s,
                    height: 7 * s,
                    borderRadius: "50%",
                    background: row.accent ? brand.color.accent : brand.color.inkFaint,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13 * s, fontWeight: 550 }}>{row.label}</span>
                {row.meta ? (
                  <span style={{ fontSize: 11.5 * s, color: brand.color.inkMuted }}>
                    {row.meta}
                  </span>
                ) : null}
                {row.tag ? (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: brand.type.mono,
                      fontSize: 9.5 * s,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: `${4 * s}px ${9 * s}px`,
                      borderRadius: 999,
                      background: alpha(brand.color.accent, 0.17),
                      color: brand.color.accent,
                    }}
                  >
                    {row.tag}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
