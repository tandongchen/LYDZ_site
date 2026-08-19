"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import styles from "./shuffle-title.module.css";

type ShuffleDirection = "right" | "down";
type ShuffleTag = "h2" | "h3" | "p" | "span";

type ShuffleTitleProps = {
  text: string;
  accentText?: string;
  className?: string;
  direction?: ShuffleDirection;
  duration?: number;
  id?: string;
  onShuffleComplete?: () => void;
  scrambleCharset?: string;
  shuffleTimes?: number;
  stagger?: number;
  style?: CSSProperties;
  tag?: ShuffleTag;
  triggerOnHover?: boolean;
  triggerOnce?: boolean;
};

type Glyph = {
  accent: boolean;
  char: string;
  index: number;
  kind: "glyph" | "line-break" | "space";
  punctuation: boolean;
  sequence: string[];
};

type KillableAnimation = {
  kill: () => void;
};

const DEFAULT_CHARSET = "M2×÷∑π01?";
const PUNCTUATION = new Set(["，", "。", "、", "：", "；", "！", "？", ",", ".", ":", ";", "!", "?"]);

function createGlyphs(text: string, accentText: string, shuffleTimes: number, charset: string): Glyph[] {
  const accentStart = accentText ? text.indexOf(accentText) : -1;
  const accentEnd = accentStart >= 0 ? accentStart + accentText.length : -1;
  let stringOffset = 0;
  let glyphIndex = 0;

  return Array.from(text).map((char) => {
    const offset = stringOffset;
    stringOffset += char.length;

    if (char === "\n") {
      return {
        accent: false,
        char,
        index: glyphIndex++,
        kind: "line-break",
        punctuation: false,
        sequence: [],
      };
    }

    if (/\s/u.test(char)) {
      return {
        accent: false,
        char,
        index: glyphIndex++,
        kind: "space",
        punctuation: false,
        sequence: [],
      };
    }

    const rolls = Array.from({ length: shuffleTimes }, (_, rollIndex) => {
      const charsetIndex = (glyphIndex * 5 + rollIndex * 3 + char.codePointAt(0)!) % charset.length;
      return charset[charsetIndex] ?? char;
    });
    const glyph: Glyph = {
      accent: accentStart >= 0 && offset >= accentStart && offset < accentEnd,
      char,
      index: glyphIndex++,
      kind: "glyph",
      punctuation: PUNCTUATION.has(char),
      sequence: [char, ...rolls],
    };

    return glyph;
  });
}

export function ShuffleTitle({
  text,
  accentText = "",
  className = "",
  direction = "right",
  duration = 0.52,
  id,
  onShuffleComplete,
  scrambleCharset = DEFAULT_CHARSET,
  shuffleTimes = 2,
  stagger = 0.035,
  style,
  tag: Tag = "h2",
  triggerOnHover = true,
  triggerOnce = true,
}: ShuffleTitleProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const timelineRef = useRef<KillableAnimation | null>(null);
  const playingRef = useRef(false);
  const rolls = Math.max(1, Math.floor(shuffleTimes));
  const charset = scrambleCharset || DEFAULT_CHARSET;
  const glyphs = useMemo(
    () => createGlyphs(text, accentText, rolls, charset),
    [accentText, charset, rolls, text],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const strips = Array.from(root.querySelectorAll<HTMLElement>("[data-shuffle-strip]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let scrollTrigger: KillableAnimation | null = null;
    let removeHoverListener = () => {};

    const clearStripStyles = () => {
      strips.forEach((strip) => {
        strip.style.removeProperty("filter");
        strip.style.removeProperty("opacity");
        strip.style.removeProperty("transform");
      });
    };

    if (reduceMotion) {
      clearStripStyles();
      return;
    }

    const getStep = (strip: HTMLElement, axis: "x" | "y") => {
      const glyph = strip.querySelector<HTMLElement>("[data-shuffle-glyph]");
      if (!glyph) return 0;

      const glyphRect = glyph.getBoundingClientRect();
      const stripStyle = window.getComputedStyle(strip);
      const gap = Number.parseFloat(axis === "x" ? stripStyle.columnGap : stripStyle.rowGap) || 0;
      return (axis === "x" ? glyphRect.width : glyphRect.height) + gap;
    };

    const initializeAnimation = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);

      const play = () => {
        if (disposed || playingRef.current || !strips.length) return;

        timelineRef.current?.kill();
        playingRef.current = true;

        strips.forEach((strip) => {
          const x = direction === "right" ? -(getStep(strip, "x") * rolls) : 0;
          const y = direction === "down" ? -(getStep(strip, "y") * rolls) : 0;
          strip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          strip.style.opacity = "0.24";
          strip.style.filter = "blur(2.4px)";
        });

        const odd = strips.filter((_, index) => index % 2 === 1);
        const even = strips.filter((_, index) => index % 2 === 0);
        const oddDuration = duration + Math.max(0, odd.length - 1) * stagger;
        const timeline = gsap.timeline({
          onComplete: () => {
            playingRef.current = false;
            clearStripStyles();
            onShuffleComplete?.();
          },
        });
        const tweenVars = {
          x: 0,
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration,
          ease: "power3.out",
          stagger,
          force3D: true,
        };

        if (odd.length) timeline.to(odd, tweenVars, 0);
        if (even.length) timeline.to(even, tweenVars, odd.length ? oddDuration * 0.68 : 0);
        timelineRef.current = timeline;
      };

      if ("fonts" in document) {
        await document.fonts.ready;
      }
      if (disposed) return;

      scrollTrigger = ScrollTrigger.create({
        trigger: root,
        start: "top 88%",
        once: triggerOnce,
        onEnter: play,
      });
      if (triggerOnHover) {
        root.addEventListener("mouseenter", play);
        removeHoverListener = () => root.removeEventListener("mouseenter", play);
      }
    };

    void initializeAnimation();

    return () => {
      disposed = true;
      scrollTrigger?.kill();
      timelineRef.current?.kill();
      timelineRef.current = null;
      playingRef.current = false;
      removeHoverListener();
      clearStripStyles();
    };
  }, [direction, duration, onShuffleComplete, rolls, stagger, text, triggerOnHover, triggerOnce]);

  const classes = `${styles.shuffleTitle} ${className}`.trim();

  return (
    <Tag
      aria-label={text.replace(/\n/g, "")}
      className={classes}
      id={id}
      ref={(node) => {
        rootRef.current = node;
      }}
      style={style}
    >
      <span aria-hidden="true">
        {glyphs.map((glyph) => {
          if (glyph.kind === "line-break") {
            return <br key={`break-${glyph.index}`} />;
          }

          if (glyph.kind === "space") {
            return <span className={styles.space} key={`space-${glyph.index}`} />;
          }

          return (
            <span
              className={styles.frame}
              data-shuffle-accent={glyph.accent ? "true" : undefined}
              data-shuffle-frame="true"
              data-shuffle-punctuation={glyph.punctuation ? "true" : undefined}
              key={`${glyph.char}-${glyph.index}`}
            >
              <span
                className={styles.strip}
                data-shuffle-direction={direction}
                data-shuffle-strip="true"
              >
                {glyph.sequence.map((character, sequenceIndex) => (
                  <span
                    className={styles.glyph}
                    data-shuffle-glyph="true"
                    key={`${character}-${sequenceIndex}`}
                  >
                    {character}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
