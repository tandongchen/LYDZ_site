import type { Metadata } from "next";
import Link from "next/link";
import { MagicMathLogo } from "../components/magic-math-logo";
import { StudioNav } from "../components/studio-nav";

export const metadata: Metadata = {
  title: "合作联系｜魔法数学",
  description: "分享新的游戏灵感、规则构想与玩法问题，一起开启下一场数学魔法。",
};

const EMAILS = [
  {
    label: "QQ MAIL",
    address: "1224106085@qq.com",
  },
  {
    label: "GMAIL",
    address: "tandongchen499@gmail.com",
  },
] as const;

const mailSubject = encodeURIComponent("魔法数学｜游戏与规则合作");

export default function ContactPage() {
  return (
    <main className="collaboration-page">
      <StudioNav />

      <div className="collaboration-grid" aria-hidden="true" />
      <div className="collaboration-aura collaboration-aura-red" aria-hidden="true" />
      <div className="collaboration-aura collaboration-aura-blue" aria-hidden="true" />

      <section className="collaboration-hero studio-frame" aria-labelledby="collaboration-title">
        <div className="collaboration-copy">
          <p className="collaboration-kicker">COLLABORATION · CONTACT</p>
          <h1 id="collaboration-title">
            让一个灵感，
            <span>成为下一套规则。</span>
          </h1>
          <p className="collaboration-intro">
            如果你正在构思新的游戏、发现一条有趣的规则，或对现有玩法有任何疑问，欢迎随时写信给我。
            每一次真诚的交流，都可能成为下一场数学魔法的起点。
          </p>

          <div className="collaboration-links" aria-label="联系邮箱">
            {EMAILS.map((email, index) => (
              <a
                href={`mailto:${email.address}?subject=${mailSubject}`}
                key={email.address}
                aria-label={`使用邮箱联系：${email.address}`}
              >
                <span className="collaboration-email-number">0{index + 1}</span>
                <span className="collaboration-email-copy">
                  <small>{email.label}</small>
                  <strong>{email.address}</strong>
                </span>
                <span className="collaboration-email-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>

        <div className="collaboration-signal" aria-hidden="true">
          <span className="collaboration-orbit collaboration-orbit-red" />
          <span className="collaboration-orbit collaboration-orbit-blue" />
          <MagicMathLogo variant="hero" />
          <span className="collaboration-signal-copy">
            <small>OPEN SIGNAL</small>
            <strong>IDEA → RULE → WORLD</strong>
          </span>
        </div>

        <footer className="collaboration-footer">
          <span>MAGIC MATH · GAME DESIGN / MATHEMATICS / INTERACTION</span>
          <Link href="/#contact">返回主页 <b aria-hidden="true">↙</b></Link>
        </footer>
      </section>
    </main>
  );
}
