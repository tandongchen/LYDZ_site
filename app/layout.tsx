import type { Metadata } from "next";
import "./globals.css";

const title = "魔法数学｜九款数学小游戏典藏";
const description = "从数字消消乐到世界杯风云，在九款双人或益智小游戏中玩懂计算、推理、博弈与概率。";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
