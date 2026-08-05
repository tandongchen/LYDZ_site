"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { MagicMathLogo } from "../../components/magic-math-logo";

type Phase = "setup" | "playing" | "exploded";

type GuessRecord = {
  team: string;
  teamIndex: number;
  guess: number;
  hint: string;
};

const TEAM_COLORS = ["#b63a3a", "#2f7a52", "#315e91", "#d09a2d"];
const DEFAULT_TEAMS = ["格兰芬多", "斯莱特林", "拉文克劳", "赫奇帕奇"];

function makeSecret() {
  return Math.floor(Math.random() * 100) + 1;
}

export default function NumberBombGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [teamCount, setTeamCount] = useState(4);
  const [teamNames, setTeamNames] = useState(DEFAULT_TEAMS);
  const [secret, setSecret] = useState<number | null>(null);
  const [lower, setLower] = useState(1);
  const [upper, setUpper] = useState(100);
  const [turn, setTurn] = useState(0);
  const [guess, setGuess] = useState("");
  const [records, setRecords] = useState<GuessRecord[]>([]);
  const [message, setMessage] = useState("炸弹已经埋好，等你来缩小范围。");
  const [error, setError] = useState("");
  const [loser, setLoser] = useState<string | null>(null);

  const activeTeams = useMemo(
    () => teamNames.slice(0, teamCount).map((name, index) => name.trim() || `玩家 ${index + 1}`),
    [teamCount, teamNames],
  );
  const currentTeam = activeTeams[turn] ?? activeTeams[0];
  const lowerWasGuessed = records.some((record) => record.guess === lower);
  const upperWasGuessed = records.some((record) => record.guess === upper);
  const playableLower = lower + (lowerWasGuessed ? 1 : 0);
  const playableUpper = upper - (upperWasGuessed ? 1 : 0);
  const remainingPossibilities = playableUpper - playableLower + 1;

  function resetRound() {
    setSecret(makeSecret());
    setLower(1);
    setUpper(100);
    setTurn(0);
    setGuess("");
    setRecords([]);
    setMessage("炸弹已经埋好，范围是 1-100。");
    setError("");
    setLoser(null);
    setPhase("playing");
  }

  function startGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetRound();
  }

  function updateTeamName(index: number, value: string) {
    setTeamNames((names) => names.map((name, teamIndex) => (teamIndex === index ? value : name)));
  }

  function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== "playing" || secret === null) return;

    const value = Number(guess);
    if (!guess.trim() || !Number.isInteger(value)) {
      setError("请输入一个整数。");
      return;
    }
    if (value < playableLower || value > playableUpper) {
      setError(`请输入 ${playableLower} 到 ${playableUpper} 之间的数字。`);
      return;
    }
    if (records.some((record) => record.guess === value)) {
      setError("这个数字已经猜过了，换一个试试。");
      return;
    }

    setError("");
    if (value === secret) {
      setLoser(currentTeam);
      setRecords((items) => [
        { team: currentTeam, teamIndex: turn, guess: value, hint: "砰！炸弹爆炸" },
        ...items,
      ]);
      setMessage(`${currentTeam} 猜中了 ${secret}，炸弹爆炸！`);
      setPhase("exploded");
      setGuess("");
      return;
    }

    const nextLower = value < secret ? value : lower;
    const nextUpper = value > secret ? value : upper;
    const hint = `炸弹在 ${nextLower}-${nextUpper} 之间`;
    setLower(nextLower);
    setUpper(nextUpper);
    setRecords((items) => [{ team: currentTeam, teamIndex: turn, guess: value, hint }, ...items]);
    setMessage(`${currentTeam} 安全，${hint}。`);
    setTurn((turn + 1) % teamCount);
    setGuess("");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="魔法数学首页">
          <MagicMathLogo />
          <span>魔法数学</span>
        </a>
        <span className="issue-tag">派对游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />THE NUMBER BOMB<span /></p>
          <h1><span>数</span><span>字</span><span>炸</span><span>弹</span></h1>
          <p className="hero-lead">别猜中它，<br /><em>让范围越来越小。</em></p>
          <p className="hero-description">
            一个秘密数字，一场轮流试探。每一次安全猜测都会压缩炸弹区间，
            直到某位玩家亲手按下那个危险的数字。
          </p>
        </div>
        <div className="hero-bomb" aria-hidden="true">
          <span className="spark spark-one" />
          <span className="spark spark-two" />
          <span className="fuse" />
          <span className="bomb-body"><i>?</i></span>
          <span className="bomb-shadow" />
        </div>
      </section>

      <section className="game-shell" aria-labelledby="game-title">
        <div className="shell-heading">
          <div>
            <span className="section-kicker">GAME CONSOLE</span>
            <h2 id="game-title">{phase === "setup" ? "召集你的队伍" : "炸弹搜索区"}</h2>
          </div>
          {phase !== "setup" && (
            <button className="text-button" type="button" onClick={() => setPhase("setup")}>
              重新组队
            </button>
          )}
        </div>

        {phase === "setup" ? (
          <form className="setup-form" onSubmit={startGame}>
            <fieldset className="count-picker">
              <legend>选择参加人数</legend>
              <div>
                {[2, 3, 4].map((count) => (
                  <button
                    type="button"
                    className={teamCount === count ? "selected" : ""}
                    aria-pressed={teamCount === count}
                    key={count}
                    onClick={() => setTeamCount(count)}
                  >
                    <strong>{count}</strong><span>人 / 队</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="team-editor">
              <div className="field-label"><span>设置队伍名称</span><small>每位玩家代表一支队伍</small></div>
              <div className="team-fields">
                {activeTeams.map((_, index) => (
                  <label key={index}>
                    <span style={{ background: TEAM_COLORS[index] }}>{index + 1}</span>
                    <input
                      value={teamNames[index]}
                      onChange={(event) => updateTeamName(index, event.target.value)}
                      maxLength={10}
                      aria-label={`第 ${index + 1} 支队伍名称`}
                    />
                  </label>
                ))}
              </div>
            </div>

            <button className="primary-button start-button" type="submit">
              埋下炸弹 <span>→</span>
            </button>
          </form>
        ) : (
          <div className="play-area">
            <div className="turn-strip" aria-label="玩家顺序">
              {activeTeams.map((team, index) => (
                <div
                  className={`team-chip ${phase === "playing" && turn === index ? "active" : ""} ${loser === team ? "lost" : ""}`}
                  key={`${team}-${index}`}
                  style={{ "--team-color": TEAM_COLORS[index] } as React.CSSProperties}
                >
                  <span>{index + 1}</span>
                  <div><small>{phase === "playing" && turn === index ? "正在猜" : "等待"}</small><strong>{team}</strong></div>
                </div>
              ))}
            </div>

            <div className={`range-stage ${phase === "exploded" ? "is-exploded" : ""}`}>
              <div className="range-copy">
                <span className="section-kicker">DANGER ZONE</span>
                <p>{phase === "exploded" ? "炸弹数字揭晓" : "炸弹就在这个范围内"}</p>
                <strong>{phase === "exploded" ? secret : `${lower} - ${upper}`}</strong>
                <small>{phase === "exploded" ? `${loser} 引爆了炸弹` : `还剩 ${remainingPossibilities} 个可能`}</small>
              </div>
              <div className="range-bomb" aria-hidden="true">
                <span className="mini-fuse" />
                <span className="mini-bomb">{phase === "exploded" ? "!" : "?"}</span>
              </div>
              <div className="range-track" aria-hidden="true">
                <span>1</span>
                <div><i style={{ left: `${lower - 1}%`, right: `${100 - upper}%` }} /></div>
                <span>100</span>
              </div>
            </div>

            {phase === "exploded" ? (
              <div className="result-panel" role="status">
                <span className="result-icon">砰</span>
                <div>
                  <small>ROUND OVER</small>
                  <h3>{loser} 踩中了数字炸弹</h3>
                  <p>秘密数字是 <strong>{secret}</strong>，其余队伍成功幸存。</p>
                </div>
                <button className="primary-button" type="button" onClick={resetRound}>再来一局 <span>↻</span></button>
              </div>
            ) : (
              <div className="play-grid">
                <div className="guess-card">
                  <span className="section-kicker">YOUR TURN</span>
                  <h3>轮到 <em>{currentTeam}</em></h3>
                  <p>输入当前范围内的一个整数。猜中炸弹的人输掉本轮。</p>
                  <form className="guess-form" onSubmit={submitGuess}>
                    <label htmlFor="guess-input">你的数字</label>
                    <div>
                      <input
                        id="guess-input"
                        type="number"
                        inputMode="numeric"
                        min={playableLower}
                        max={playableUpper}
                        value={guess}
                        onChange={(event) => setGuess(event.target.value)}
                        placeholder={`${Math.round((playableLower + playableUpper) / 2)}`}
                        autoComplete="off"
                      />
                      <button className="primary-button" type="submit">确认猜测 <span>→</span></button>
                    </div>
                    <p className="form-error" aria-live="polite">{error || `可输入 ${playableLower} 到 ${playableUpper}`}</p>
                  </form>
                </div>

                <aside className="history-card" aria-label="猜测记录">
                  <div className="history-heading">
                    <div><span className="section-kicker">ROUND LOG</span><h3>本轮记录</h3></div>
                    <strong>{records.length}<small>次猜测</small></strong>
                  </div>
                  <div className="history-list" aria-live="polite">
                    {records.length === 0 ? (
                      <p className="empty-history">还没有人出手。<br />第一猜，也许就是最危险的一猜。</p>
                    ) : records.map((record, index) => (
                      <div className="history-item" key={`${record.team}-${record.guess}-${index}`}>
                        <span style={{ background: TEAM_COLORS[record.teamIndex] }}>{record.guess}</span>
                        <div><strong>{record.team}</strong><small>{record.hint}</small></div>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            )}

            <p className="game-message" aria-live="polite"><span>●</span>{message}</p>
          </div>
        )}
      </section>

      <footer><span>魔法数学</span><p>在 1 和 100 之间，藏着一次心跳。</p></footer>
    </main>
  );
}
