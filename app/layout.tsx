import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "shuhe-lab-0714.tandongchen499.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const title = "数字炸弹｜多人猜数字派对游戏";
  const description = "2—5 人轮流猜测 1—100 之间的秘密数字，逐步缩小范围，千万别引爆数字炸弹。";

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: `${baseUrl}/og.png`, width: 1536, height: 1024 }] },
    twitter: { card: "summary_large_image", title, description, images: [`${baseUrl}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
