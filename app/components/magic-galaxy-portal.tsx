"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GAME_CATALOG } from "../games/catalog";
import { MagicMathLogo } from "./magic-math-logo";

type GalaxyPhase = "idle" | "burst" | "open" | "closing";

const BURST_PARTICLES = [
  { x: -44, y: -18, size: 22, tone: "red" },
  { x: -52, y: 9, size: 11, tone: "blue" },
  { x: -37, y: 28, size: 16, tone: "white" },
  { x: -61, y: -34, size: 7, tone: "red" },
  { x: 43, y: -23, size: 18, tone: "blue" },
  { x: 55, y: 6, size: 12, tone: "red" },
  { x: 39, y: 29, size: 20, tone: "white" },
  { x: 62, y: -37, size: 8, tone: "blue" },
] as const;

export function MagicGalaxyPortal() {
  const [phase, setPhase] = useState<GalaxyPhase>("idle");
  const timerRef = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const openGalaxy = () => {
    if (phase !== "idle") return;
    clearTimer();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("open");
      return;
    }
    setPhase("burst");
    timerRef.current = window.setTimeout(() => setPhase("open"), 760);
  };

  const closeGalaxy = useCallback(() => {
    clearTimer();
    setPhase("closing");
    timerRef.current = window.setTimeout(() => setPhase("idle"), 360);
  }, [clearTimer]);

  useEffect(() => {
    const galaxyVisible = phase === "open" || phase === "closing";
    document.body.classList.toggle("galaxy-is-open", galaxyVisible);
    if (phase === "open") closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase === "open") closeGalaxy();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("galaxy-is-open");
    };
  }, [closeGalaxy, phase]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const overlayVisible = phase === "open" || phase === "closing";

  return (
    <>
      <div className={`hero-orbit galaxy-portal galaxy-phase-${phase}`}>
        <button
          className="galaxy-trigger"
          type="button"
          onClick={openGalaxy}
          disabled={phase !== "idle"}
          aria-label="打开魔法数学游戏星系"
        >
          <span className="orbit-ring orbit-ring-one" />
          <span className="orbit-ring orbit-ring-two" />
          <MagicMathLogo variant="hero" />
          <span className="orbit-node orbit-node-red" />
          <span className="orbit-node orbit-node-blue" />
        </button>

        <span className="galaxy-burst-field" aria-hidden="true">
          {BURST_PARTICLES.map((particle, index) => (
            <i
              className={`galaxy-burst-particle particle-${particle.tone}`}
              key={`${particle.x}-${particle.y}`}
              style={{
                "--burst-x": `${particle.x}vw`,
                "--burst-y": `${particle.y}vh`,
                "--burst-size": `${particle.size}px`,
                "--burst-delay": `${index * 28}ms`,
              } as CSSProperties}
            />
          ))}
        </span>
      </div>

      {overlayVisible ? (
        <section
          className={`galaxy-reveal ${phase === "closing" ? "is-closing" : "is-open"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="galaxy-title"
        >
          <div className="galaxy-nebula" aria-hidden="true" />
          <div className="galaxy-spiral" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          <header className="galaxy-reveal-header">
            <div>
              <small>MAGIC MATH · GALAXY MAP</small>
              <h2 id="galaxy-title">选择你的游戏星球</h2>
              <p>九颗星球，九种数学规则。点击名称即可进入对应世界。</p>
            </div>
            <button ref={closeButtonRef} type="button" onClick={closeGalaxy} aria-label="关闭游戏星系">
              <span>关闭星系</span>
              <b aria-hidden="true">×</b>
            </button>
          </header>

          <nav className="galaxy-game-grid" aria-label="游戏星球列表">
            {GAME_CATALOG.map((game, index) => (
              <Link
                className={`galaxy-planet galaxy-planet-${game.accent}`}
                href={game.href}
                key={game.id}
                style={{ "--planet-delay": `${150 + index * 70}ms` } as CSSProperties}
              >
                <span className="galaxy-planet-orbit" aria-hidden="true" />
                <span className="galaxy-planet-sphere">
                  <small>{game.number}</small>
                  <strong>{game.title}</strong>
                  <i>{game.category}</i>
                </span>
              </Link>
            ))}
          </nav>

          <footer className="galaxy-reveal-footer">
            <span>M² / NINE PLAYABLE WORLDS</span>
            <span>ESC 关闭星系</span>
          </footer>
        </section>
      ) : null}
    </>
  );
}
