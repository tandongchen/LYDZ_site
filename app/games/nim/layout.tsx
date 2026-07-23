import type { Metadata } from "next";
import Link from "next/link";
import "../game-route.css";
import "./game.css";

export const metadata: Metadata = {
  title: "尼姆博弈｜魔法数学",
  description: "观察石堆、规划取舍，在经典尼姆博弈中找出必胜策略。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Link className="game-home-link" href="/">← 返回魔法数学</Link>
      {children}
    </>
  );
}

