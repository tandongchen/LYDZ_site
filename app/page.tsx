import Link from "next/link";
import { GAME_CATALOG, gameCountLabel } from "./games/catalog";

export default function Home() {
  return (
    <main className="magic-archive">
      <div className="archive-shell">
        <header className="archive-topbar">
          <Link className="archive-brand" href="/" aria-label="魔法数学首页">
            <span className="archive-brand-mark archive-magic-hat" aria-hidden="true">
              <span>✦</span>
            </span>
            <span className="archive-brand-name">魔法数学</span>
            <span className="archive-label">MAGICAL MATHEMATICS ARCHIVE</span>
          </Link>
          <p className="archive-note">
            <span aria-hidden="true">✦</span>
            学院典藏 · {gameCountLabel} 册游戏簿
            <span aria-hidden="true">✦</span>
          </p>
        </header>

        <section className="archive-hero" aria-labelledby="cover-title">
          <div className="archive-hero-copy">
            <p className="archive-eyebrow">欢迎进入数学魔法学院</p>
            <h1 id="cover-title">
              展示<em>魔法</em>中
            </h1>
            <div className="archive-hero-support">
              <strong>从直觉出发</strong>
              <span className="archive-rule" aria-hidden="true" />
              <span>
                计算、推理、博弈与概率，化作九场可亲手验证的游戏。
                <br />
                选一本典藏，即刻翻开你的第一局。
              </span>
            </div>
          </div>

          <div className="archive-orbit" aria-hidden="true">
            <span className="archive-orbit-ring" />
            <span className="archive-orbit-star archive-orbit-star-one" />
            <span className="archive-orbit-star archive-orbit-star-two" />
            <span className="archive-orbit-number">
              {gameCountLabel}
              <small>典藏游戏</small>
            </span>
          </div>
        </section>

        <section className="archive-collection" aria-labelledby="collection-title">
          <div className="archive-collection-head">
            <h2 id="collection-title">
              <span aria-hidden="true">M</span>
              魔法游戏典藏
            </h2>
            <p>点击任一典藏卡片 · 开始你的数学冒险 →</p>
          </div>

          <div className="archive-game-grid">
            {GAME_CATALOG.map((game) => (
              <Link
                className={`archive-game-card archive-accent-${game.accent}`}
                href={game.href}
                key={game.id}
                aria-label={`进入${game.title}`}
              >
                <span className="archive-sigil" aria-hidden="true" />
                <span className="archive-card-inner">
                  <span className="archive-card-index">
                    {game.number}
                    <small aria-hidden="true">✦</small>
                  </span>
                  <span className="archive-card-copy">
                    <span className="archive-card-type">{game.category}</span>
                    <strong>{game.title}</strong>
                    <span className="archive-card-description">{game.description}</span>
                  </span>
                  <span className="archive-card-arrow" aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="archive-footer">
          <span><strong>MATHEMATICS IS MAGIC</strong> · 规则会说话，数字有回声</span>
          <span>魔法学院藏书阁 · MM / {gameCountLabel}</span>
        </footer>
      </div>
    </main>
  );
}
