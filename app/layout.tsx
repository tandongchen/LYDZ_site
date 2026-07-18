import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "shuhe-lab-0714.tandongchen499.chatgpt.site";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const title = "世界杯风云｜本地双人足球策略游戏";
  const description = "选择国家队，通过扑克牌强化能力，在十二回合中用进攻、防守与控制争夺世界杯胜利。";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `${baseUrl}/og-world-cup.png`, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og-world-cup.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
