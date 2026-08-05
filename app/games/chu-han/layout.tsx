import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "楚汉之争｜魔法数学",
  description: "排兵布阵、推演得失，在楚汉对弈中争夺最终胜势。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell gameId="chu-han">{children}</GameLayoutShell>;
}
