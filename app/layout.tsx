import type { Metadata } from "next";
import { MagicWandCursor } from "./components/magic-wand-cursor";
import "./globals.css";

const title = "魔法数学｜数学游戏设计师作品集";
const description = "魔法与科技并存的数学游戏世界：用九款原创游戏，把计算、推理、博弈与概率变成可以亲手体验的规则。";

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/favicon.svg?v=2",
  },
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <MagicWandCursor />
      </body>
    </html>
  );
}
