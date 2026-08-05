import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "层叠消融｜魔法数学",
  description: "观察层叠结构与连锁关系，完成富有策略的消融挑战。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell gameId="layered-fusion">{children}</GameLayoutShell>;
}
