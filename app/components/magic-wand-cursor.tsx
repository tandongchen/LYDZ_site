"use client";

import { useEffect, useRef } from "react";

export function MagicWandCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!cursor || !finePointer.matches) return;

    let frame: number | null = null;
    let nextX = 0;
    let nextY = 0;

    const renderPosition = () => {
      cursor.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      frame = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;
      cursor.classList.add("is-visible");
      cursor.classList.toggle(
        "is-action",
        event.target instanceof Element && Boolean(event.target.closest("a, button, input, select, textarea, summary")),
      );
      if (frame === null) frame = window.requestAnimationFrame(renderPosition);
    };

    const handlePointerDown = () => cursor.classList.add("is-casting");
    const handlePointerUp = () => cursor.classList.remove("is-casting");
    const handlePointerOut = (event: MouseEvent) => {
      if (event.relatedTarget === null) cursor.classList.remove("is-visible");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("mouseout", handlePointerOut, { passive: true });

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("mouseout", handlePointerOut);
    };
  }, []);

  return (
    <div className="magic-wand-cursor" ref={cursorRef} aria-hidden="true">
      <span className="wand-cursor-star">✦</span>
      <span className="wand-cursor-shaft" />
      <span className="wand-cursor-node wand-cursor-node-red" />
      <span className="wand-cursor-node wand-cursor-node-blue" />
    </div>
  );
}
