import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "数字合并挑战｜数合实验室",
  description: "选择两个数字，用相加再减一的规则不断合并，看看最后会留下谁。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
