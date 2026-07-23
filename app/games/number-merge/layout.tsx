import type { Metadata } from "next";
import Link from "next/link";
import "../game-route.css";
import "./game.css";

export const metadata: Metadata = {
  title: "数字消消乐｜魔法数学",
  description: "自定义连续数字，用相加再减一的规则不断合并，看看最后会留下谁。",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Link className="game-home-link" href="/">← 返回魔法数学</Link>
      {children}
    </>
  );
}

