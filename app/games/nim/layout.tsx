import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "尼姆博弈｜魔法数学",
  description: "观察石堆、规划取舍，在经典尼姆博弈中找出必胜策略。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell gameId="nim">{children}</GameLayoutShell>;
}
