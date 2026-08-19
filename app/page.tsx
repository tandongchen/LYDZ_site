import Image from "next/image";
import Link from "next/link";
import { MagicGalaxyPortal } from "./components/magic-galaxy-portal";
import { ParticleText } from "./components/particle-text";
import { ShuffleTitle } from "./components/shuffle-title";
import { StudioNav } from "./components/studio-nav";
import { GAME_CATALOG, GAME_GROUPS, gameCountLabel } from "./games/catalog";

export default function Home() {
  const featuredGames = GAME_CATALOG.filter((game) => game.cover);

  return (
    <main className="studio-site" id="top">
      <StudioNav />
      <section className="studio-hero" aria-labelledby="hero-title">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          poster="/og.png"
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/magic-tech-loop.webm" type="video/webm" />
        </video>
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-content studio-frame">
          <MagicGalaxyPortal />

          <div className="hero-title-lockup">
            <p className="hero-title-cn">魔法数学</p>
              <h1
                className="hero-particle-heading"
                id="hero-title"
                data-shadow="MAGIC MATH"
                aria-label="MAGIC MATH"
              >
              <ParticleText
                className="hero-particle-text"
                text="MAGIC MATH"
                particleSize={2.15}
                density={4}
                color="#ff5c76"
                highlightColor="#5f91ff"
                scatter={260}
                gatherDuration={1500}
                stagger={380}
                pointerRepel={58}
                repelRadius={150}
                idleDrift={0.55}
                trigger="hover"
                fontSize="clamp(86px, 10.7vw, 190px)"
                fontWeight={900}
                fontFamily='"Agency FB", "Arial Narrow", "Arial Black", "Trebuchet MS", sans-serif'
                glow
              />
              <sup className="hero-particle-mark" aria-hidden="true">®</sup>
            </h1>
            <p className="hero-title-tagline">把数学规则变成可玩的世界</p>
          </div>

          <div className="hero-designer-note">
            <span>游戏设计师 / GAME DESIGNER</span>
            <p>数学是上帝的语言，宇宙是用数学写成的</p>
          </div>
        </div>

        <div className="hero-footer studio-frame">
          <p className="hero-footnote">
            Mathematical games engineered for curious minds.
            <br />
            Designed for clarity, replayed for discovery.
          </p>
          <div className="hero-metrics">
            <span><strong>{gameCountLabel}</strong> PROJECTS</span>
            <span><strong>03</strong> CATEGORIES</span>
          </div>
          <a className="hero-enter" href="#projects">
            <span>进入游戏档案</span>
            <strong aria-hidden="true">↓</strong>
          </a>
        </div>
      </section>

      <section className="project-section" id="projects" aria-labelledby="projects-title">
        <div className="studio-frame">
          <div className="section-heading">
            <div>
              <p className="section-kicker section-kicker-dark">GAME UNIVERSE</p>
              <ShuffleTitle
                accentText="全域征程"
                className="section-tech-title shuffle-section-title"
                id="projects-title"
                text="启动全域征程"
              />
            </div>
            <p>灵魂的欲望，是命运的先知</p>
          </div>

          <div className="project-groups">
            {GAME_GROUPS.map((group, groupIndex) => {
              const games = GAME_CATALOG.filter((game) => game.group === group.id);

              return (
                <article className={`project-group project-group-${group.tone}`} key={group.id}>
                  <div className="project-group-head">
                    <span className="project-group-index">0{groupIndex + 1}</span>
                    <span className="project-group-sigil" aria-hidden="true">
                      <i />
                      <i />
                    </span>
                    <span className="project-group-count">{String(games.length).padStart(2, "0")} GAMES</span>
                  </div>
                  <div className="project-group-copy">
                    <p>{group.english}</p>
                    <h3>{group.title}</h3>
                    <span>{group.description}</span>
                  </div>
                  <ol className="project-list">
                    {games.map((game) => (
                      <li key={game.id}>
                        <Link href={game.href}>
                          <strong>{game.title}</strong>
                          <em aria-hidden="true">↗</em>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="featured-section" id="featured" aria-labelledby="featured-title">
        <div className="studio-frame">
          <div className="section-heading section-heading-light">
            <div>
              <ShuffleTitle
                accentText="项目档案"
                className="section-tech-title shuffle-section-title"
                id="featured-title"
                text="精选项目档案"
              />
            </div>
            <p>
              规则、叙事与视觉共同构成体验。
              <br />
              点击项目，进入可以亲手验证的数学世界。
            </p>
          </div>

          <div className="featured-grid">
            {featuredGames.map((game, index) => (
              <Link
                className={`featured-card featured-card-${game.id} ${index === 0 ? "featured-card-lead" : ""}`}
                href={game.href}
                key={game.id}
              >
                <Image
                  src={game.cover ?? "/og.png"}
                  alt={`${game.title}游戏画面`}
                  fill
                  unoptimized
                  sizes={index === 0 ? "(max-width: 1100px) 100vw, 66vw" : "(max-width: 1100px) 100vw, 34vw"}
                />
                <span className="featured-card-shade" aria-hidden="true" />
                <span className="featured-card-copy">
                  <small>{game.category}</small>
                  <strong>{game.title}</strong>
                  <span>{game.description}</span>
                </span>
                <span className="featured-card-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>

          <div className="featured-footer">
            <p>全部 {gameCountLabel} 个项目已开放体验</p>
            <a href="#projects">查看完整项目索引 <span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="studio-frame about-layout">
          <ShuffleTitle
            accentText="改变局势的方法。"
            className="shuffle-section-title"
            direction="down"
            id="about-title"
            text={"数学不是答案，\n而是改变局势的方法。"}
          />
          <div className="about-copy">
            <p>
              每个项目都从一条清晰规则开始，通过反馈、选择与对抗，
              让抽象概念成为可以观察、试错和掌握的游戏体验。
            </p>
            <dl>
              <div><dt>RULE</dt><dd>规则可读</dd></div>
              <div><dt>PLAY</dt><dd>策略可变</dd></div>
              <div><dt>FEEDBACK</dt><dd>结果可见</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div className="contact-aura" aria-hidden="true" />
        <div className="studio-frame contact-layout">
          <div className="contact-topline">
            <span>AVAILABLE FOR CREATIVE COLLABORATION</span>
          </div>
          <div className="contact-main">
            <div className="contact-copy">
              <p className="section-kicker">CONTACT</p>
              <ShuffleTitle
                accentText="好规则"
                className="shuffle-section-title"
                direction="down"
                id="contact-title"
                text={"下一场数学魔法，\n从一个好规则开始。"}
              />
              <p>游戏概念、教育体验、互动装置与数字产品合作。</p>
              <Link className="contact-action" href="/contact">
                <span>发起合作邮件</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <Link className="contact-rule-card" href="/rules" aria-label="打开九个游戏的规则详解">
              <div className="contact-rule-card-topline">
                <span>RULE ARCHIVE</span>
                <span>09 GAMES</span>
              </div>
              <div>
                <small>魔法数学 · 玩法档案</small>
                <h3>游戏规则详解</h3>
                <p>九套规则、核心目标与关键策略，集中收录在同一个档案中。</p>
              </div>
              <ul aria-label="规则档案包含的游戏">
                {GAME_CATALOG.map((game) => (
                  <li key={game.id}>{game.title}</li>
                ))}
              </ul>
              <div className="contact-rule-card-action">
                <span>进入完整规则档案</span>
                <b aria-hidden="true">↗</b>
              </div>
            </Link>
          </div>
          <footer className="contact-footer">
            <Link href="#top">魔法数学 · MAGIC MATH STUDIO</Link>
            <span>GAME DESIGN / MATHEMATICS / INTERACTION</span>
            <span>© 2026</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
