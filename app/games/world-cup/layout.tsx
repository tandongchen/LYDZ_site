import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "世界杯风云｜魔法数学",
  description: "选择国家队，通过攻防、控制与球队技能争夺世界杯冠军。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell>{children}</GameLayoutShell>;
}
