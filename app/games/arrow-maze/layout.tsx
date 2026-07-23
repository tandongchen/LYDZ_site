import type { Metadata } from "next";
import Link from "next/link";
import "../game-route.css";
import "./game.css";

export const metadata: Metadata = {
  title: "箭阵迷域｜魔法数学",
  description: "顺着箭头推演路径，破解方向与空间组成的迷阵。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Link className="game-home-link" href="/">← 返回魔法数学</Link>
      {children}
    </>
  );
}

