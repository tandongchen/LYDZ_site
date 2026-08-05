import type { Metadata } from "next";
import "./game.css";
import "../game-route.css";
import { GameLayoutShell } from "../game-layout-shell";

export const metadata: Metadata = {
  title: "数字炸弹｜魔法数学",
  description: "不断缩小数字区间，在有限线索中锁定隐藏答案。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameLayoutShell gameId="number-bomb">{children}</GameLayoutShell>;
}
