"use client";

import { FormEvent, useMemo, useState } from "react";

type Player = "A" | "B";

type Pile = {
  id: number;
  count: number;
  initial: number;
};

type Move = {
  player: Player;
  pile: number;
  amount: number;
  remaining: number;
};

const PLAYER_NAMES: Record<Player, string> = {
  A: "珊瑚队",
  B: "青叶队",
};

function otherPlayer(player: Player): Player {
  return player === "A" ? "B" : "A";
}

function createPiles(pileCount: number, seed: number): Pile[] {
  let value = seed >>> 0;
  const random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };

  return Array.from({ length: pileCount }, (_, index) => {
    const count = Math.floor(random() * 7) + 3;
    return { id: index + 1, count, initial: count };
  });
}

const INITIAL_PILES = createPiles(4, 7349);

export default function Home() {
  const [pileInput, setPileInput] = useState("4");
  const [firstPlayer, setFirstPlayer] = useState<Player>("A");
  const [piles, setPiles] = useState<Pile[]>(INITIAL_PILES);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("A");
  const [selectedPile, setSelectedPile] = useState<number | null>(null);
  const [takeCount, setTakeCount] = useState(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<Move[]>([]);
  const [error, setError] = useState("");

  const flowersLeft = useMemo(
    () => piles.reduce((total, pile) => total + pile.count, 0),
    [piles],
  );
  const initialFlowers = useMemo(
    () => piles.reduce((total, pile) => total + pile.initial, 0),
    [piles],
  );
  const activePile = piles.find((pile) => pile.id === selectedPile) ?? null;
  const progress = initialFlowers
    ? ((initialFlowers - flowersLeft) / initialFlowers) * 100
    : 100;

  function startGame(event?: FormEvent) {
    event?.preventDefault();
    const nextPileCount = Number(pileInput);

    if (!Number.isInteger(nextPileCount) || nextPileCount < 3 || nextPileCount > 7) {
      setError("请输入 3 到 7 之间的整数");
      return;
    }

    setPiles(createPiles(nextPileCount, Date.now() ^ Math.floor(Math.random() * 1000000)));
    setCurrentPlayer(firstPlayer);
    setSelectedPile(null);
    setTakeCount(1);
    setWinner(null);
    setRound(1);
    setHistory([]);
    setError("");
  }

  function choosePile(pile: Pile) {
    if (winner || pile.count === 0) return;
    setSelectedPile(pile.id);
    setTakeCount(1);
  }

  function confirmTurn() {
    if (winner || !activePile || takeCount < 1 || takeCount > activePile.count) return;

    const nextPiles = piles.map((pile) =>
      pile.id === activePile.id ? { ...pile, count: pile.count - takeCount } : pile,
    );
    const remaining = flowersLeft - takeCount;

    setPiles(nextPiles);
    setHistory((moves) => [
      { player: currentPlayer, pile: activePile.id, amount: takeCount, remaining },
      ...moves,
    ]);
    setSelectedPile(null);
    setTakeCount(1);

    if (remaining === 0) {
      setWinner(currentPlayer);
      return;
    }

    setCurrentPlayer(otherPlayer(currentPlayer));
    setRound((value) => value + 1);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="魔法数学首页">
          <span className="brand-mark magic-hat" aria-hidden="true"><span>✦</span></span>
          <span>魔法数学</span>
        </a>
        <span className="header-tag">双人数学策略小游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> TWO PLAYER GAME <span /></div>
          <h1 aria-label="尼姆博弈">
            {"尼姆博弈".split("").map((character, index) => (
              <span key={`${character}-${index}`}>{character}</span>
            ))}
          </h1>
          <p className="hero-lead">
            最后一朵花<br />
            <em>决定胜负！</em>
          </p>
          <p className="hero-description">
            从任意一堆拿走任意数量的小花，但一回合只能动一堆。
            看似随手一拿，其实每一步都在改变胜负的天平。
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="hero-flower flower-one"><i /></span>
          <span className="hero-flower flower-two"><i /></span>
          <span className="hero-flower flower-three"><i /></span>
          <span className="hero-flower flower-four"><i /></span>
          <span className="hero-number">NIM</span>
        </div>
      </section>

      <section className="game-shell" aria-label="尼姆博弈游戏区">
        <form className="setup-panel" onSubmit={startGame}>
          <div className="setup-heading">
            <span className="section-kicker">NEW ROUND</span>
            <h2>布置这一桌小花</h2>
            <p>设置花堆数量、决定先手，然后生成一局全新的对战。</p>
          </div>

          <div className="setup-controls">
            <label className={`pile-field ${error ? "has-error" : ""}`} htmlFor="pile-count">
              <span>花堆数量</span>
              <div>
                <input
                  id="pile-count"
                  type="number"
                  min="3"
                  max="7"
                  step="1"
                  inputMode="numeric"
                  value={pileInput}
                  onChange={(event) => {
                    setPileInput(event.target.value);
                    setError("");
                  }}
                  aria-describedby={error ? "pile-error" : "pile-hint"}
                />
                <b>堆</b>
              </div>
            </label>

            <fieldset className="first-player-picker">
              <legend>谁先开始？</legend>
              <div>
                {(["A", "B"] as Player[]).map((player) => (
                  <button
                    className={`player-pick player-${player.toLowerCase()} ${firstPlayer === player ? "selected" : ""}`}
                    key={player}
                    type="button"
                    onClick={() => setFirstPlayer(player)}
                    aria-pressed={firstPlayer === player}
                  >
                    <span>{player}</span>{PLAYER_NAMES[player]}
                  </button>
                ))}
              </div>
            </fieldset>

            <button className="new-game-button" type="submit">
              随机开一局 <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="setup-meta">
            <span id="pile-hint">可设置 3–7 堆，每堆随机出现 3–9 朵花</span>
            {error && <span id="pile-error" className="error-text">{error}</span>}
          </div>
        </form>

        <div className="game-divider" />

        <div className="status-row">
          <div className="turn-status">
            <span className={`turn-avatar player-${currentPlayer.toLowerCase()}`}>{currentPlayer}</span>
            <div>
              <small>{winner ? "本局结束" : `第 ${round} 回合`}</small>
              <strong>
                {winner ? `${PLAYER_NAMES[winner]} 获胜！` : `轮到 ${PLAYER_NAMES[currentPlayer]}`}
              </strong>
            </div>
          </div>
          <div className="flower-counter">
            <span>桌上还剩</span>
            <strong>{flowersLeft}</strong>
            <span>朵花</span>
          </div>
        </div>

        <div className="progress-track" aria-label={`已取走 ${initialFlowers - flowersLeft} 朵，共 ${initialFlowers} 朵`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        {winner ? (
          <div className={`winner-banner player-${winner.toLowerCase()}`} role="status">
            <span className="winner-bloom" aria-hidden="true"><i /></span>
            <div>
              <small>LAST FLOWER</small>
              <h2>{PLAYER_NAMES[winner]} 拿走了最后一朵花</h2>
              <p>漂亮的收官！第 {round} 回合结束了这场对局。</p>
            </div>
            <button type="button" onClick={() => startGame()}>再来一局</button>
          </div>
        ) : (
          <div className="turn-prompt" aria-live="polite">
            <span>本回合</span>
            <strong>
              {activePile
                ? `从第 ${activePile.id} 堆拿走 ${takeCount} 朵花`
                : `请 ${PLAYER_NAMES[currentPlayer]} 先选择一堆花`}
            </strong>
          </div>
        )}

        <div className={`piles-grid pile-count-${piles.length}`}>
          {piles.map((pile) => {
            const isSelected = selectedPile === pile.id;
            return (
              <article
                className={`pile-card ${isSelected ? `selected player-${currentPlayer.toLowerCase()}` : ""} ${pile.count === 0 ? "empty" : ""}`}
                key={pile.id}
              >
                <button
                  className="pile-select"
                  type="button"
                  onClick={() => choosePile(pile)}
                  disabled={pile.count === 0 || Boolean(winner)}
                  aria-pressed={isSelected}
                  aria-label={`第 ${pile.id} 堆，剩余 ${pile.count} 朵花${isSelected ? "，已选择" : ""}`}
                >
                  <div className="pile-label">
                    <span>PILE {String(pile.id).padStart(2, "0")}</span>
                    <strong>{pile.count}<small> 朵</small></strong>
                  </div>
                  <div className="flowers" aria-hidden="true">
                    {Array.from({ length: pile.initial }, (_, flowerIndex) => {
                      const exists = flowerIndex < pile.count;
                      const chosen = isSelected && exists && flowerIndex >= pile.count - takeCount;
                      return (
                        <span
                          className={`flower ${exists ? "exists" : "removed"} ${chosen ? "chosen" : ""}`}
                          key={flowerIndex}
                        ><i /></span>
                      );
                    })}
                  </div>
                  <span className="pile-action">
                    {pile.count === 0
                      ? "这一堆空了"
                      : isSelected
                        ? `本回合选择 ${takeCount} 朵`
                        : "选择这一堆"}
                  </span>
                </button>

                {isSelected && activePile && !winner && (
                  <div className="take-control">
                    <span>拿几朵？</span>
                    <div className="stepper">
                      <button
                        type="button"
                        onClick={() => setTakeCount((value) => Math.max(1, value - 1))}
                        disabled={takeCount === 1}
                        aria-label="少拿一朵"
                      >−</button>
                      <strong>{takeCount}</strong>
                      <button
                        type="button"
                        onClick={() => setTakeCount((value) => Math.min(activePile.count, value + 1))}
                        disabled={takeCount === activePile.count}
                        aria-label="多拿一朵"
                      >＋</button>
                    </div>
                    <button className="take-all" type="button" onClick={() => setTakeCount(activePile.count)}>
                      全部拿走
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!winner && (
          <div className="confirm-bar">
            <div>
              <span className={`mini-avatar player-${currentPlayer.toLowerCase()}`}>{currentPlayer}</span>
              <p>
                {activePile
                  ? `确认后将交给 ${PLAYER_NAMES[otherPlayer(currentPlayer)]}`
                  : "一次只能从同一堆拿花"}
              </p>
            </div>
            <button type="button" onClick={confirmTurn} disabled={!activePile}>
              确认拿取 {activePile ? `${takeCount} 朵` : ""}<span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </section>

      <section className="lower-grid">
        <aside className="rules-card">
          <div className="card-heading">
            <span className="card-number">01</span>
            <div><small>GAME RULES</small><h2>怎么玩？</h2></div>
          </div>
          <ol>
            <li><span>1</span><p><strong>任选一堆</strong>每回合先从还有花的堆中选择一堆。</p></li>
            <li><span>2</span><p><strong>想拿几朵都可以</strong>至少拿一朵，也可以把这一堆全部拿空。</p></li>
            <li><span>3</span><p><strong>拿完换人</strong>一回合不能同时拿两堆，确认后轮到对方。</p></li>
            <li><span>4</span><p><strong>最后一朵定胜负</strong>取走桌上最后一朵花的人立即获胜。</p></li>
          </ol>
        </aside>

        <aside className="history-card">
          <div className="card-heading">
            <span className="card-number">02</span>
            <div><small>MOVE LOG</small><h2>行动记录</h2></div>
          </div>
          {history.length === 0 ? (
            <div className="empty-history">
              <span aria-hidden="true">✦</span>
              <p>第一步还没有落下<br />仔细看看每一堆的数量吧</p>
            </div>
          ) : (
            <ol className="move-list">
              {history.slice(0, 6).map((move, index) => (
                <li key={`${move.remaining}-${index}`}>
                  <span className={`mini-avatar player-${move.player.toLowerCase()}`}>{move.player}</span>
                  <p><strong>{PLAYER_NAMES[move.player]}</strong> 从第 {move.pile} 堆拿走 {move.amount} 朵</p>
                  <small>余 {move.remaining}</small>
                </li>
              ))}
            </ol>
          )}
          <div className="strategy-note">
            <span aria-hidden="true">※</span>
            <p><strong>想一想</strong>每次拿完之后，怎样的花堆组合会让对手最难选择？</p>
          </div>
        </aside>
      </section>

      <footer>
        <span>魔法数学</span>
        <p>每一步，都让局面悄悄改变。</p>
        <small>每一次选择都至关重要</small>
      </footer>
    </main>
  );
}
