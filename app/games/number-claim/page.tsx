"use client";

import { FormEvent, useMemo, useState } from "react";
import { MagicMathLogo } from "../../components/magic-math-logo";

type Player = "A" | "B";
type Owner = Player | null;

const MAX_TARGET = 200;

function otherPlayer(player: Player): Player {
  return player === "A" ? "B" : "A";
}

export default function Home() {
  const [targetInput, setTargetInput] = useState("30");
  const [firstPlayer, setFirstPlayer] = useState<Player>("A");
  const [target, setTarget] = useState(30);
  const [owners, setOwners] = useState<Owner[]>(() => Array(30).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("A");
  const [pending, setPending] = useState<number[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [round, setRound] = useState(1);
  const [error, setError] = useState("");

  const claimedA = useMemo(
    () => owners.filter((owner) => owner === "A").length,
    [owners],
  );
  const claimedB = useMemo(
    () => owners.filter((owner) => owner === "B").length,
    [owners],
  );
  const claimedTotal = claimedA + claimedB;

  function startGame(event?: FormEvent) {
    event?.preventDefault();
    const nextTarget = Number(targetInput);

    if (!Number.isInteger(nextTarget) || nextTarget <= 3) {
      setError("终点数字必须是大于 3 的整数");
      return;
    }

    if (nextTarget > MAX_TARGET) {
      setError(`为了让数字清晰可点，终点数字请不要超过 ${MAX_TARGET}`);
      return;
    }

    setError("");
    setTarget(nextTarget);
    setOwners(Array(nextTarget).fill(null));
    setCurrentPlayer(firstPlayer);
    setPending([]);
    setWinner(null);
    setRound(1);
  }

  function toggleNumber(number: number) {
    if (winner || owners[number - 1]) return;

    if (pending.includes(number)) {
      if (number === pending[pending.length - 1]) {
        setPending((numbers) => numbers.slice(0, -1));
      }
      return;
    }

    const nextNumber = claimedTotal + pending.length + 1;
    if (pending.length === 2 || number !== nextNumber) return;
    setPending((numbers) => [...numbers, number]);
  }

  function confirmTurn() {
    if (winner || pending.length < 1 || pending.length > 2) return;

    const nextOwners = [...owners];
    pending.forEach((number) => {
      nextOwners[number - 1] = currentPlayer;
    });

    setOwners(nextOwners);
    setPending([]);

    if (pending.includes(target)) {
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
          <MagicMathLogo />
          <span>魔法数学</span>
        </a>
        <span className="header-tag">双人数学策略小游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> TWO PLAYER GAME <span /></div>
        <h1 className="game-name" aria-label="数字抢位战">
          {"数字抢位战".split("").map((character, index) => (
            <span key={`${character}-${index}`} aria-hidden="true">{character}</span>
          ))}
        </h1>
        <p className="hero-lead">
          每次抢占一格或两格，
          <br />
          <em>谁会先碰到终点？</em>
        </p>
        <p className="hero-description">
          设定一个大于 3 的终点数字，选好先手，然后从 1 开始按顺序轮流抢位。
          每一轮必须拿下接下来的 1-2 个数字，率先抢到终点数字的人获胜。
        </p>
      </section>

      <section className="workspace" aria-label="数字抢位战游戏区">
        <div className="game-card">
          <form className="setup-panel" onSubmit={startGame}>
            <div className="setup-copy">
              <span className="section-kicker">开局设置</span>
              <h2>这一局，要抢到几号？</h2>
              <p>终点需大于 3，游戏会生成从 1 到终点的所有数字。</p>
            </div>

            <div className="setup-controls">
              <label className={`target-field ${error ? "has-error" : ""}`} htmlFor="target-number">
                <span>终点</span>
                <input
                  id="target-number"
                  type="number"
                  min="4"
                  max={MAX_TARGET}
                  step="1"
                  inputMode="numeric"
                  value={targetInput}
                  onChange={(event) => {
                    setTargetInput(event.target.value);
                    setError("");
                  }}
                  aria-describedby={error ? "input-error" : "target-hint"}
                />
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
                      <span>{player}</span> 选手
                    </button>
                  ))}
                </div>
              </fieldset>

              <button className="primary-button" type="submit">
                开始新对局 <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="input-meta">
              <span id="target-hint">支持 4-{MAX_TARGET}，默认终点为 30</span>
              {error && <span id="input-error" className="error-text">{error}</span>}
            </div>
          </form>

          <div className="round-divider" />

          <div className="battle-head">
            <div className={`turn-badge player-${currentPlayer.toLowerCase()}`}>
              <span className="turn-dot" />
              {winner ? "对局结束" : `轮到 ${currentPlayer} 选手`}
            </div>
            <div className="round-count">第 <strong>{round}</strong> 轮</div>
          </div>

          <div className="scoreboard" aria-label="双方抢位数量">
            <div className="score-player score-a">
              <span className="player-avatar">A</span>
              <div><small>A 选手</small><strong>{claimedA}</strong></div>
            </div>
            <div className="battle-progress">
              <div>
                <span className="fill-a" style={{ width: `${target ? (claimedA / target) * 100 : 0}%` }} />
                <span className="fill-b" style={{ width: `${target ? (claimedB / target) * 100 : 0}%` }} />
              </div>
              <small>已抢 {claimedTotal} / {target} 格</small>
            </div>
            <div className="score-player score-b">
              <div><small>B 选手</small><strong>{claimedB}</strong></div>
              <span className="player-avatar">B</span>
            </div>
          </div>

          <div className={`turn-instruction ${winner ? "is-winner" : ""}`} aria-live="polite">
            {winner ? (
              <>
                <span className={`winner-medal player-${winner.toLowerCase()}`}>★</span>
                <div>
                  <small>抢位成功</small>
                  <strong>{winner} 选手先抢到 {target} 号，赢得本局！</strong>
                </div>
              </>
            ) : (
              <>
                <span className="choice-count">{pending.length}<i>/2</i></span>
                <div>
                  <small>本轮已选</small>
                  <strong>
                    {pending.length === 0
                      ? `请 ${currentPlayer} 选手从 ${claimedTotal + 1} 开始选择 1-2 个数字`
                      : pending.length === 2
                        ? `已选择 ${[...pending].sort((a, b) => a - b).join("、")}，可以确认本轮抢位`
                        : `已选择 ${pending[0]}，可以确认或再选一个`}
                  </strong>
                </div>
              </>
            )}
          </div>

          <div className="number-board" role="group" aria-label={`从 1 到 ${target} 的抢位数字`}>
            <div className="board-corner corner-one" aria-hidden="true" />
            <div className="board-corner corner-two" aria-hidden="true" />
            <div className="numbers-grid">
              {owners.map((owner, index) => {
                const number = index + 1;
                const isPending = pending.includes(number);
                const isTarget = number === target;
                const isNext = !winner && !owner && number === claimedTotal + pending.length + 1;
                const canUndoPending = isPending && number === pending[pending.length - 1];
                return (
                  <button
                    className={`number-tile ${owner ? `owned owned-${owner.toLowerCase()}` : ""} ${isPending ? `pending pending-${currentPlayer.toLowerCase()}` : ""} ${isNext ? "next-tile" : ""} ${isTarget ? "target-tile" : ""}`}
                    key={number}
                    type="button"
                    onClick={() => toggleNumber(number)}
                    disabled={Boolean(owner) || Boolean(winner) || (!isNext && !canUndoPending)}
                    aria-pressed={isPending}
                    aria-label={`${number}号${isTarget ? "，终点" : ""}${owner ? `，已被${owner}选手占领` : isPending ? "，本轮已选择" : isNext ? "，接下来可选择" : "，尚未轮到"}`}
                  >
                    {isTarget && <small>终点</small>}
                    <span>{number}</span>
                    {owner && <b>{owner}</b>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="game-actions">
            <button
              className="clear-button"
              type="button"
              onClick={() => setPending([])}
              disabled={pending.length === 0 || Boolean(winner)}
            >
              清空本轮选择
            </button>
            {winner ? (
              <button className="confirm-button replay-button" type="button" onClick={() => startGame()}>
                再来一局 <span aria-hidden="true">↻</span>
              </button>
            ) : (
              <button className={`confirm-button player-${currentPlayer.toLowerCase()}`} type="button" onClick={confirmTurn} disabled={pending.length === 0}>
                确认抢位 · 交给 {otherPlayer(currentPlayer)} <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>

      </section>

      <footer>
        <span>魔法数学</span>
        <p>运气也是实力的一部分</p>
      </footer>
    </main>
  );
}
