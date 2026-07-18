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
  const title = "楚汉之争｜玩家与 AI 的双人扑克牌战术游戏";
  const description = "选择楚或汉，在八座战场布置三张牌的战斗队形，与 AI 军师争夺天下。";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `${baseUrl}/og-chuhan.png`, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og-chuhan.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
