import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "数字消消乐｜魔法数学",
  description: "自定义连续数字，用相加再减一的规则不断合并，看看最后会留下谁。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell gameId="number-merge">{children}</GameLayoutShell>;
}
