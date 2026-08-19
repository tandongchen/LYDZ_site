"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./particle-text.module.css";

type ParticleTextTrigger = "mount" | "hover" | "click";

type ParticleTextProps = {
  text?: string;
  particleSize?: number;
  density?: number;
  color?: string;
  highlightColor?: string;
  scatter?: number;
  gatherDuration?: number;
  stagger?: number;
  pointerRepel?: number;
  repelRadius?: number;
  idleDrift?: number;
  trigger?: ParticleTextTrigger;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type Particle = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  seed: number;
  depth: number;
  delay: number;
};

const whiteRgb: Rgb = { r: 247, g: 250, b: 255 };

const hexToRgb = (hex: string): Rgb | null => {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
};

const mixRgb = (from: Rgb, to: Rgb, amount: number): Rgb => ({
  r: Math.round(from.r + (to.r - from.r) * amount),
  g: Math.round(from.g + (to.g - from.g) * amount),
  b: Math.round(from.b + (to.b - from.b) * amount),
});

const rgbToCss = (rgb: Rgb) => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const resolveFontSize = (
  value: number | string,
  container: HTMLElement,
  fontWeight: number | string,
  fontFamily: string,
) => {
  if (typeof value === "number") return value;

  const probe = document.createElement("span");
  probe.textContent = "M";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.fontSize = value;
  probe.style.fontWeight = String(fontWeight);
  probe.style.fontFamily = fontFamily;
  container.appendChild(probe);
  const size = Number.parseFloat(window.getComputedStyle(probe).fontSize) || 96;
  probe.remove();
  return size;
};

const waitForFonts = async (font: string) => {
  if (!("fonts" in document)) return;

  try {
    await document.fonts.load(font);
  } catch {
    // The canvas can still render with the browser fallback font.
  }

  await document.fonts.ready;
};

export function ParticleText({
  text = "React Bits",
  particleSize = 2,
  density = 4,
  color = "#ffffff",
  highlightColor = "#8b5cf6",
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
  trigger = "mount",
  fontSize = "clamp(3rem, 12vw, 8rem)",
  fontWeight = 800,
  fontFamily = "inherit",
  glow = true,
  className = "",
  style,
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let particles: Particle[] = [];
    let animationFrame: number | null = null;
    let resizeFrame: number | null = null;
    let buildId = 0;
    let gathering = false;
    let gatherStart = 0;
    let isVisible = true;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;

    const pointer = {
      active: false,
      x: 0,
      y: 0,
      smoothX: 0,
      smoothY: 0,
    };

    const startGather = (fromScatter = true) => {
      if (!particles.length) return;

      const spread = reducedMotion ? 0 : scatter;
      particles.forEach((particle) => {
        if (fromScatter) {
          const angle = particle.seed * Math.PI * 2;
          const distance = spread * (0.35 + particle.depth * 0.75);
          particle.x = particle.targetX + Math.cos(angle) * distance + (particle.depth - 0.5) * spread * 0.55;
          particle.y = particle.targetY + Math.sin(angle) * distance + (particle.seed - 0.5) * spread * 0.55;
        }

        particle.startX = particle.x;
        particle.startY = particle.y;
        particle.delay = reducedMotion ? 0 : particle.seed * stagger;
      });

      gatherStart = performance.now();
      gathering = true;
    };

    const drawParticle = (particle: Particle) => {
      context.fillStyle = particle.color;

      if (particle.size <= 2.1) {
        context.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size,
        );
        return;
      }

      context.beginPath();
      context.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
      context.fill();
    };

    const render = (now: number) => {
      animationFrame = null;
      context.clearRect(0, 0, width, height);

      if (glow && !reducedMotion) {
        context.shadowBlur = particleSize * 3;
        context.shadowColor = highlightColor;
      } else {
        context.shadowBlur = 0;
      }

      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.18;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.18;
      let complete = true;

      particles.forEach((particle) => {
        let baseX = particle.targetX;
        let baseY = particle.targetY;
        let progress = 1;

        if (gathering) {
          const localProgress = (now - gatherStart - particle.delay) / Math.max(1, reducedMotion ? 1 : gatherDuration);
          progress = clamp(localProgress, 0, 1);
          const eased = easeOutCubic(progress);
          baseX = particle.startX + (particle.targetX - particle.startX) * eased;
          baseY = particle.startY + (particle.targetY - particle.startY) * eased;
          if (progress < 1) complete = false;
        } else if (!reducedMotion && idleDrift > 0) {
          const driftTime = now * 0.001;
          baseX += Math.sin(driftTime * 0.9 + particle.seed * 10) * idleDrift * particle.depth;
          baseY += Math.cos(driftTime * 0.75 + particle.depth * 10) * idleDrift * particle.depth;
        }

        if (pointer.active && !reducedMotion && pointerRepel > 0 && repelRadius > 0) {
          const deltaX = baseX - pointer.smoothX;
          const deltaY = baseY - pointer.smoothY;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance > 0 && distance < repelRadius) {
            const force = Math.pow(1 - distance / repelRadius, 2) * pointerRepel;
            baseX += (deltaX / distance) * force;
            baseY += (deltaY / distance) * force;
          }
        }

        const follow = reducedMotion ? 1 : 0.22;
        particle.x += (baseX - particle.x) * follow;
        particle.y += (baseY - particle.y) * follow;

        context.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
        drawParticle(particle);
      });

      context.globalAlpha = 1;
      context.shadowBlur = 0;

      if (gathering && complete) gathering = false;
      if (isVisible && (!reducedMotion || gathering)) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const ensureRenderLoop = () => {
      if (animationFrame === null && isVisible) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const sampleText = async () => {
      const currentBuild = ++buildId;
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      if (width <= 0 || height <= 0) return;

      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      const computed = window.getComputedStyle(container);
      const resolvedFamily = fontFamily === "inherit" ? computed.fontFamily || "sans-serif" : fontFamily;
      let resolvedSize = resolveFontSize(fontSize, container, fontWeight, resolvedFamily);
      let font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;

      await waitForFonts(font);
      if (currentBuild !== buildId) return;

      const offscreen = document.createElement("canvas");
      const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offscreenContext) return;

      const content = String(text || " ");
      const maxTextWidth = width * 0.92;
      offscreenContext.font = font;
      let metrics = offscreenContext.measureText(content);
      const measuredWidth = Math.max(1, metrics.width);

      if (measuredWidth > maxTextWidth) {
        resolvedSize = Math.max(18, resolvedSize * (maxTextWidth / measuredWidth));
        font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;
        await waitForFonts(font);
        if (currentBuild !== buildId) return;
        offscreenContext.font = font;
        metrics = offscreenContext.measureText(content);
      }

      const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
      const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent || resolvedSize * 0.78);
      const descent = Math.ceil(metrics.actualBoundingBoxDescent || resolvedSize * 0.22);
      const padding = Math.max(12, Math.ceil(resolvedSize * 0.08));
      const textWidth = Math.max(1, left + right);
      const textHeight = Math.max(1, ascent + descent);

      offscreen.width = textWidth + padding * 2;
      offscreen.height = textHeight + padding * 2;
      offscreenContext.clearRect(0, 0, offscreen.width, offscreen.height);
      offscreenContext.font = font;
      offscreenContext.textAlign = "left";
      offscreenContext.textBaseline = "alphabetic";
      offscreenContext.fillStyle = "#ffffff";
      offscreenContext.fillText(content, padding - left, padding + ascent);

      const imageData = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height);
      const targets: Array<{ x: number; y: number; alpha: number }> = [];
      const step = Math.max(2, Math.floor(density));

      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = imageData.data[(y * offscreen.width + x) * 4 + 3];
          if (alpha > 40) {
            targets.push({
              x: width / 2 - offscreen.width / 2 + x,
              y: height / 2 - offscreen.height / 2 + y,
              alpha: alpha / 255,
            });
          }
        }
      }

      const maxParticles = Math.max(900, Math.min(5200, Math.floor((width * height) / 90)));
      const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
      const baseRgb = hexToRgb(color);
      const highlightRgb = hexToRgb(highlightColor);
      const selectedTargets = targets.filter((_, index) => index % stride === 0);

      particles = selectedTargets.map((target, index) => {
        const seed = ((index * 9301 + 49297) % 233280) / 233280;
        const depth = 0.45 + (((index * 233 + 97) % 1000) / 1000) * 0.9;
        const horizontalBlend = clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.2, 0, 1);
        let particleColor = color;

        if (baseRgb && highlightRgb) {
          particleColor = horizontalBlend < 0.5
            ? rgbToCss(mixRgb(baseRgb, whiteRgb, horizontalBlend * 2))
            : rgbToCss(mixRgb(whiteRgb, highlightRgb, (horizontalBlend - 0.5) * 2));
        }

        const angle = seed * Math.PI * 2;
        const distance = (reducedMotion ? 0 : scatter) * (0.35 + depth * 0.75);
        const startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * scatter * 0.45;
        const startY = target.y + Math.sin(angle) * distance + (depth - 0.9) * scatter * 0.45;

        return {
          x: reducedMotion ? target.x : startX,
          y: reducedMotion ? target.y : startY,
          startX,
          startY,
          targetX: target.x,
          targetY: target.y,
          size: Math.max(0.6, particleSize * (0.75 + target.alpha * 0.45)),
          color: particleColor,
          seed,
          depth,
          delay: seed * stagger,
        };
      });

      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;

      if (reducedMotion) {
        particles.forEach((particle) => {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.startX = particle.targetX;
          particle.startY = particle.targetY;
          particle.delay = 0;
        });
        gathering = false;
      } else {
        startGather(false);
      }

      ensureRenderLoop();
    };

    const queueSample = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        void sampleText();
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const isInside = event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom;

      if (!isInside || rect.width <= 0 || rect.height <= 0) {
        if (pointer.active) {
          pointer.active = false;
          ensureRenderLoop();
        }
        return;
      }

      const wasActive = pointer.active;
      pointer.x = ((event.clientX - rect.left) / rect.width) * width;
      pointer.y = ((event.clientY - rect.top) / rect.height) * height;
      pointer.active = true;

      if (!wasActive && trigger === "hover") {
        startGather(true);
      }

      ensureRenderLoop();
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      ensureRenderLoop();
    };

    const handleClick = () => {
      if (trigger === "click") {
        startGather(true);
        ensureRenderLoop();
      }
    };

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      void sampleText();
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        ensureRenderLoop();
      } else if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }, { rootMargin: "120px" });

    reduceMotionQuery.addEventListener("change", handleReducedMotionChange);
    window.addEventListener("pointermove", handlePointerMove, { capture: true, passive: true });
    window.addEventListener("blur", handlePointerLeave);
    canvas.addEventListener("click", handleClick);
    visibilityObserver.observe(container);

    const resizeObserver = new ResizeObserver(queueSample);
    resizeObserver.observe(container);
    void sampleText();

    return () => {
      buildId += 1;
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      reduceMotionQuery.removeEventListener("change", handleReducedMotionChange);
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("blur", handlePointerLeave);
      canvas.removeEventListener("click", handleClick);

      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    };
  }, [
    color,
    density,
    fontFamily,
    fontSize,
    fontWeight,
    gatherDuration,
    glow,
    highlightColor,
    idleDrift,
    particleSize,
    pointerRepel,
    repelRadius,
    scatter,
    stagger,
    text,
    trigger,
  ]);

  const classes = `${styles.particleText} ${className}`.trim();

  return (
    <div ref={containerRef} className={classes} style={style}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <span className={styles.screenReaderText}>{text}</span>
    </div>
  );
}
