import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { type Brand, alpha } from "../brand/tokens";
import { BodyCopy, Eyebrow, KineticType, LightSweep } from "../primitives/KineticType";
import { BrowserFrame, Counter, Rule, Wipe } from "../primitives/Device";
import { GridField, Marquee, ParallaxRail, ScrollScrub } from "../primitives/Scroll";
import {
  AppWindow,
  Cursor,
  type AppRow,
  type FlowStep,
} from "../primitives/AppUI";
import { ParticleFormation } from "../primitives/ParticleFormation";
import { SceneBody, type FormatName, framePad, typeScale } from "./Shell";
import { track } from "../core/easing";
import { useSeconds, useStagger } from "../core/timing";

/** Everything the simulated product window needs, as data. */
export interface AppWindowConfig {
  title: string;
  nav: string[];
  activeNav?: number;
  url?: string;
  searchPlaceholder?: string;
  typed?: { text: string; at: number; over?: number };
  rows: AppRow[];
  metric?: { label: string; value: string; at?: number };
}

export interface SceneCtx {
  brand: Brand;
  format: FormatName;
  dur: number;
}

const col = (format: FormatName) => (format === "landscape" ? "row" : "column");

/** Opening statement. Eyebrow, masked headline, one line of support. */
export const HeroScene: React.FC<
  SceneCtx & {
    eyebrow: string;
    lines: string[];
    serifLines?: number[];
    italicLines?: number[];
    subhead?: string;
  }
> = ({ brand, format, dur, eyebrow, lines, serifLines, italicLines, subhead }) => {
  const s = typeScale(format);
  const pad = framePad(format);
  return (
    <SceneBody dur={dur} exit="rise">
      <AbsoluteFill
        style={{
          padding: `${pad.y}px ${pad.x}px`,
          justifyContent: "center",
          alignItems: format === "landscape" ? "flex-start" : "center",
        }}
      >
        <div style={{ position: "relative", width: "fit-content", maxWidth: "88%" }}>
          <Eyebrow brand={brand} start={0.12} size={15 * s}>
            {eyebrow}
          </Eyebrow>
          <div style={{ height: 34 * s }} />
          <KineticType
            brand={brand}
            lines={lines}
            serifLines={serifLines}
            italicLines={italicLines}
            size={128 * s}
            start={0.3}
            align={format === "landscape" ? "left" : "center"}
          />
          <LightSweep start={1.75} />
          {subhead ? (
            <>
              <div style={{ height: 42 * s }} />
              <BodyCopy
                brand={brand}
                start={1.15}
                size={26 * s}
                maxWidth={620 * s}
                align={format === "landscape" ? "left" : "center"}
              >
                {subhead}
              </BodyCopy>
            </>
          ) : null}
        </div>
      </AbsoluteFill>
    </SceneBody>
  );
};

/** Single giant claim. Maximum negative space; the beat that lets the film breathe. */
export const StatementScene: React.FC<
  SceneCtx & { lines: string[]; serifLines?: number[]; accentLines?: number[] }
> = ({ brand, format, dur, lines, serifLines, accentLines }) => {
  const s = typeScale(format);
  return (
    <SceneBody dur={dur} exit="whip">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 120 }}>
        <KineticType
          brand={brand}
          lines={lines}
          serifLines={serifLines}
          accentLines={accentLines}
          size={116 * s}
          start={0.18}
          stagger={0.1}
          mode="line"
          align="center"
          lineHeight={1.02}
        />
      </AbsoluteFill>
    </SceneBody>
  );
};

/** Particle wordmark — the abstract "intelligence" beat. */
export const ParticleScene: React.FC<SceneCtx & { word: string; caption?: string }> = ({
  brand,
  format,
  dur,
  word,
  caption,
}) => {
  const s = typeScale(format);
  const t = useSeconds();
  const capIn = track(t, 1.9, 0.9, "quintOut");
  return (
    <SceneBody dur={dur}>
      <AbsoluteFill>
        <ParticleFormation
          brand={brand}
          text={word}
          size={190 * s}
          start={0.1}
          formFor={1.5}
          holdFor={Math.max(0.4, dur - 3.2)}
          disperseFor={0.9}
        />
        {caption ? (
          <AbsoluteFill
            style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150 * s }}
          >
            <div
              style={{
                opacity: capIn,
                transform: `translate3d(0, ${(1 - capIn) * 14}px, 0)`,
                fontFamily: brand.type.mono,
                fontSize: 15 * s,
                letterSpacing: `${brand.type.eyebrowTracking}em`,
                textTransform: "uppercase",
                color: brand.color.inkMuted,
              }}
            >
              {caption}
            </div>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    </SceneBody>
  );
};

/** The product itself, in a browser frame, scroll-scrubbed. */
export const ProductScene: React.FC<
  SceneCtx & {
    capture: string;
    url?: string;
    label?: string;
    /** Pre-split lines. Masked reveals cannot wrap, so the break is explicit. */
    headline?: string[];
    scrollTo?: number;
  }
> = ({ brand, format, dur, capture, url, label, headline, scrollTo = 0.55 }) => {
  const s = typeScale(format);
  const pad = framePad(format);
  return (
    <SceneBody dur={dur}>
      <GridField brand={brand} opacity={0.28} />
      <AbsoluteFill
        style={{
          flexDirection: col(format),
          alignItems: "center",
          justifyContent: "center",
          gap: 64 * s,
          padding: `${pad.y * 0.6}px ${pad.x * 0.7}px`,
        }}
      >
        {headline || label ? (
          <div
            style={{
              flex: format === "landscape" ? "0 1 clamp(320px, 32%, 500px)" : undefined,
              minWidth: 0,
            }}
          >
            {label ? (
              <Eyebrow brand={brand} start={0.2} size={14 * s}>
                {label}
              </Eyebrow>
            ) : null}
            {headline ? (
              <>
                <div style={{ height: 24 * s }} />
                <KineticType
                  brand={brand}
                  lines={headline}
                  size={52 * s}
                  start={0.34}
                  stagger={0.07}
                  lineHeight={1.14}
                />
                <div style={{ height: 26 * s }} />
                <Rule brand={brand} start={0.9} width={88 * s} />
              </>
            ) : null}
          </div>
        ) : null}
        <BrowserFrame
          brand={brand}
          url={url}
          start={0.42}
          width={format === "landscape" ? "62%" : "94%"}
          height={format === "landscape" ? "78%" : "58%"}
          tilt={format === "landscape" ? -4 : 0}
          style={{ flexShrink: 0 }}
        >
          {/* A pure-white page inside a dark film clips badly and reads harsh.
              Pulling it back a touch seats it in the grade without making it
              look dim. */}
          <ScrollScrub
            src={capture}
            from={0}
            to={scrollTo}
            start={0.9}
            duration={dur - 1.4}
            style={{ filter: "brightness(0.86) contrast(1.03) saturate(0.96)" }}
          />
        </BrowserFrame>
      </AbsoluteFill>
    </SceneBody>
  );
};

/** Three numbers. Each counts up on its own stagger. */
export const ProofScene: React.FC<
  SceneCtx & {
    label?: string;
    stats: Array<{ value: number; prefix?: string; suffix?: string; decimals?: number; label: string }>;
  }
> = ({ brand, format, dur, label, stats }) => {
  const s = typeScale(format);
  return (
    <SceneBody dur={dur}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 110 }}>
        {label ? (
          <>
            <Eyebrow brand={brand} start={0.1} size={14 * s} style={{ justifyContent: "center" }}>
              {label}
            </Eyebrow>
            <div style={{ height: 64 * s }} />
          </>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: format === "landscape" ? "row" : "column",
            gap: format === "landscape" ? 110 * s : 48 * s,
            alignItems: format === "landscape" ? "flex-start" : "center",
          }}
        >
          {stats.map((st, i) => (
            <StatBlock key={i} brand={brand} index={i} s={s} {...st} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneBody>
  );
};

const StatBlock: React.FC<{
  brand: Brand;
  index: number;
  s: number;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}> = ({ brand, index, s, value, prefix, suffix, decimals, label }) => {
  // 0.18s between stats: slow enough that each number is read, fast enough
  // that the three still land as one group.
  const p = useStagger(index, { start: 0.25, each: 0.18, duration: 0.9, curve: "heroOut" });
  return (
    <div
      style={{
        opacity: p,
        transform: `translate3d(0, ${(1 - p) * 40}px, 0)`,
        filter: p < 1 ? `blur(${(1 - p) * 9}px)` : undefined,
        textAlign: "left",
      }}
    >
      <Counter
        brand={brand}
        to={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        start={0.3 + index * 0.18}
        duration={1.5}
        size={118 * s}
        color={index === 0 ? brand.color.accent : brand.color.ink}
      />
      <div style={{ height: 14 * s }} />
      <div
        style={{
          fontFamily: brand.type.mono,
          fontSize: 15 * s,
          letterSpacing: `${brand.type.eyebrowTracking}em`,
          textTransform: "uppercase",
          color: brand.color.inkMuted,
          maxWidth: 250 * s,
          lineHeight: 1.5,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Scrolling wall of capability words. The "scrolling effects" beat. */
export const MarqueeScene: React.FC<
  SceneCtx & { rows: string[][]; headline?: string }
> = ({ brand, format, dur, rows, headline }) => {
  const s = typeScale(format);
  const t = useSeconds();
  const inP = track(t, 0.1, 1.0, "heroOut");
  return (
    <SceneBody dur={dur}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 10 * s,
          opacity: inP,
          transform: `scale(${1.08 - inP * 0.08})`,
        }}
      >
        {rows.map((row, i) => {
          // One row carries the weight; the rest are texture. Texture still
          // has to be legible — at inkFaint it just reads as a dirty frame.
          const hero = i === Math.floor(rows.length / 2);
          return (
            <Marquee
              key={i}
              items={row}
              speed={0.045 + i * 0.02}
              direction={i % 2 === 0 ? "left" : "right"}
              size={(hero ? 82 : 52) * s}
              weight={hero ? 650 : 450}
              color={hero ? brand.color.ink : brand.color.inkMuted}
              fontFamily={hero ? brand.type.display : brand.type.body}
              separator={hero ? "·" : "—"}
              fadeEdges={brand.color.bg}
              opacity={hero ? 1 : 0.5}
            />
          );
        })}
      </AbsoluteFill>
      {headline ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              padding: `${22 * s}px ${44 * s}px`,
              borderRadius: 999,
              background: alpha(brand.color.bgDeep, 0.72),
              border: `1px solid ${brand.color.line}`,
              backdropFilter: "blur(14px)",
            }}
          >
            <KineticType
              brand={brand}
              lines={[headline]}
              size={40 * s}
              start={0.7}
              mode="word"
              stagger={0.04}
              align="center"
            />
          </div>
        </AbsoluteFill>
      ) : null}
    </SceneBody>
  );
};

/** Drifting columns of cards. Depth without needing real footage. */
export const RailScene: React.FC<
  SceneCtx & { cards: Array<{ title: string; meta?: string }>; headline?: string[] }
> = ({ brand, format, dur, cards, headline }) => {
  const s = typeScale(format);
  const t = useSeconds();
  const inP = track(t, 0, 1.2, "heroOut");
  const columns = [0, 1, 2].map((c) =>
    cards
      .filter((_, i) => i % 3 === c)
      .map((card, i) => (
        <div
          key={i}
          style={{
            width: 300 * s,
            padding: 26 * s,
            borderRadius: 16,
            background: alpha(brand.color.surface, 0.7),
            border: `1px solid ${brand.color.line}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontFamily: brand.type.display,
              fontSize: 23 * s,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: brand.color.ink,
              lineHeight: 1.25,
            }}
          >
            {card.title}
          </div>
          {card.meta ? (
            <div
              style={{
                marginTop: 12 * s,
                fontFamily: brand.type.mono,
                fontSize: 12 * s,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: brand.color.inkMuted,
              }}
            >
              {card.meta}
            </div>
          ) : null}
        </div>
      )),
  );

  return (
    <SceneBody dur={dur}>
      <AbsoluteFill style={{ opacity: inP * 0.9 }}>
        <ParallaxRail brand={brand} columns={columns} speed={74} tilt={-8} scale={1.12} />
      </AbsoluteFill>
      {headline ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <KineticType
            brand={brand}
            lines={headline}
            size={84 * s}
            start={0.55}
            align="center"
            style={{
              textShadow: `0 20px 80px ${brand.color.bg}, 0 0 40px ${brand.color.bg}`,
            }}
          />
        </AbsoluteFill>
      ) : null}
    </SceneBody>
  );
};

/** Wordmark, tagline, call to action. The frame people screenshot. */
export const EndcardScene: React.FC<
  SceneCtx & { wordmark: string; tagline?: string; cta?: string; logo?: string }
> = ({ brand, format, dur, wordmark, tagline, cta, logo }) => {
  const s = typeScale(format);
  const t = useSeconds();
  const ctaP = track(t, 1.35, 0.9, "heroOut");
  return (
    <SceneBody dur={dur} exitFor={0.25} exit="recede">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 0 }}>
        {logo ? (
          <Wipe start={0.1} duration={0.9} from="bottom" style={{ marginBottom: 40 * s }}>
            <Img src={logo} style={{ height: 76 * s, objectFit: "contain" }} />
          </Wipe>
        ) : null}
        <div style={{ position: "relative" }}>
          <KineticType
            brand={brand}
            lines={[wordmark]}
            size={118 * s}
            start={0.14}
            align="center"
            travel={1.08}
          />
          <LightSweep start={1.1} duration={1.3} intensity={0.42} />
        </div>
        {tagline ? (
          <>
            <div style={{ height: 30 * s }} />
            <BodyCopy brand={brand} start={0.75} size={25 * s} align="center" maxWidth={680 * s}>
              {tagline}
            </BodyCopy>
          </>
        ) : null}
        {cta ? (
          <>
            <div style={{ height: 52 * s }} />
            <div
              style={{
                opacity: ctaP,
                transform: `translate3d(0, ${(1 - ctaP) * 18}px, 0) scale(${0.97 + ctaP * 0.03})`,
                padding: `${17 * s}px ${38 * s}px`,
                borderRadius: 999,
                background: brand.color.accent,
                color: brand.color.bgDeep,
                fontFamily: brand.type.display,
                fontSize: 22 * s,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                boxShadow: `0 24px 70px -18px ${alpha(brand.color.accent, 0.7)}`,
              }}
            >
              {cta}
            </div>
          </>
        ) : null}
      </AbsoluteFill>
    </SceneBody>
  );
};

/**
 * The product, being used.
 *
 * A browser frame around a screenshot proves a product exists; a cursor
 * landing a click and a result arriving proves it works. For an app launch
 * this is the scene that does the persuading, so it gets the longest hold in
 * the film and the UI is rebuilt live rather than captured.
 */
export const UIFlowScene: React.FC<
  SceneCtx & {
    label?: string;
    headline?: string[];
    app: AppWindowConfig;
    steps: FlowStep[];
  }
> = ({ brand, format, dur, label, headline, app, steps }) => {
  const s = typeScale(format);
  const pad = framePad(format);
  const landscape = format === "landscape";
  return (
    <SceneBody dur={dur} exit="recede">
      <GridField brand={brand} opacity={0.22} />
      <AbsoluteFill
        style={{
          flexDirection: landscape ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: landscape ? 56 * s : 38 * s,
          padding: `${pad.y * 0.55}px ${pad.x * 0.6}px`,
        }}
      >
        {label || headline ? (
          <div
            style={{
              flex: landscape ? "0 1 clamp(300px, 30%, 460px)" : undefined,
              minWidth: 0,
            }}
          >
            {label ? (
              <Eyebrow brand={brand} start={0.18} size={14 * s}>
                {label}
              </Eyebrow>
            ) : null}
            {headline ? (
              <>
                <div style={{ height: 22 * s }} />
                <KineticType
                  brand={brand}
                  lines={headline}
                  size={55 * s}
                  start={0.3}
                  stagger={0.07}
                  lineHeight={1.12}
                  align={landscape ? "left" : "center"}
                />
                <div style={{ height: 24 * s }} />
                <Rule brand={brand} start={0.85} width={84 * s} />
              </>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            width: landscape ? "60%" : "96%",
            height: landscape ? "72%" : "54%",
            flexShrink: 0,
          }}
        >
          {/* Spill light. A lit screen throws colour onto what is behind it;
              without this the window looks pasted onto the frame. */}
          <div
            style={{
              position: "absolute",
              inset: "-14%",
              background: `radial-gradient(ellipse 60% 55% at 50% 50%, ${alpha(
                brand.color.accent,
                0.2,
              )} 0%, transparent 70%)`,
              filter: "blur(28px)",
            }}
          />
        <BrowserFrame
          brand={brand}
          url={app.url}
          start={0.4}
          width="100%"
          height="100%"
          tilt={landscape ? -3 : 0}
          style={{ flexShrink: 0 }}
        >
          <AppWindow
            brand={brand}
            title={app.title}
            nav={app.nav}
            activeNav={app.activeNav}
            searchPlaceholder={app.searchPlaceholder}
            typed={app.typed}
            rows={app.rows}
            metric={app.metric}
            start={0.55}
            scale={landscape ? 1.25 : 1.05}
          />
          <Cursor brand={brand} steps={steps} start={0.55} />
        </BrowserFrame>
        </div>
      </AbsoluteFill>
    </SceneBody>
  );
};
