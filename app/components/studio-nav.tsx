import Link from "next/link";
import { MagicMathLogo } from "./magic-math-logo";
import { SiteSearch } from "./site-search";

export function StudioNav() {
  return (
    <header className="studio-nav studio-frame is-floating is-persistent">
      <Link className="studio-brand" href="/#top" aria-label="魔法数学首页">
        <MagicMathLogo />
        <span className="studio-brand-copy">
          <strong>MAGIC MATH</strong>
          <small>魔法数学</small>
        </span>
      </Link>

      <nav className="studio-nav-links" aria-label="首页导航">
        <Link href="/#projects">
          <small>探索</small>
          <span>全部游戏</span>
        </Link>
        <Link href="/#featured">
          <small>精选</small>
          <span>项目档案</span>
        </Link>
        <Link href="/#about">
          <small>关于</small>
          <span>设计方法</span>
        </Link>
      </nav>

      <div className="studio-nav-actions">
        <SiteSearch />
        <Link className="studio-rules-link" href="/rules">
          <span>RULES</span>
          规则详解
        </Link>
        <Link className="studio-contact-link" href="/contact">
          <span aria-hidden="true">+</span>
          CONTACT
        </Link>
      </div>
    </header>
  );
}
