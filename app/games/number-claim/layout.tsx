import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "数字抢位战｜魔法数学",
  description: "两位选手轮流抢占数字，先抢到终点数字的一方获胜。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell gameId="number-claim">{children}</GameLayoutShell>;
}
