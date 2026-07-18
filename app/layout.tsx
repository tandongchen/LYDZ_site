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
  const title = "御马狂飙｜2 人 / 4 人扑克牌赛马游戏";
  const description = "翻牌推动红黑或四种花色的马匹前进，揭晓五道隐藏关卡，率先冲线即可夺冠。";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `${baseUrl}/og.png`, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
