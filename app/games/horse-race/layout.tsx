import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "御马狂飙｜魔法数学",
  description: "在速度、概率与风险之间做出选择，抢先抵达终点。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell gameId="horse-race">{children}</GameLayoutShell>;
}
