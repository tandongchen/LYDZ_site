import type { Metadata } from "next";
import Link from "next/link";
import "../game-route.css";
import "./game.css";

export const metadata: Metadata = {
  title: "层叠消融｜魔法数学",
  description: "观察层叠结构与连锁关系，完成富有策略的消融挑战。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Link className="game-home-link" href="/">← 返回魔法数学</Link>
      {children}
    </>
  );
}

