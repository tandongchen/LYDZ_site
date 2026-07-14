"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type NumberTile = {
  id: number;
  value: number;
};

type Equation = {
  first: number;
  second: number;
  result: number;
};

const MIN_NUMBER = 2;
const MAX_NUMBER = 100;

function makeTiles(count: number): NumberTile[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    value: index + 1,
  }));
}

export default function Home() {
  const [inputValue, setInputValue] = useState("4");
  const [roundSize, setRoundSize] = useState(4);
  const [tiles, setTiles] = useState<NumberTile[]>(() => makeTiles(4));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<NumberTile[][]>([]);
  const [equation, setEquation] = useState<Equation | null>(null);
  const [error, setError] = useState("");
  const nextId = useRef(5);

  const totalMoves = roundSize - 1;
  const movesMade = roundSize - tiles.length;
  const isComplete = tiles.length === 1;
  const selectedTile = tiles.find((tile) => tile.id === selectedId);
  const expectedResult = useMemo(
    () => (roundSize * (roundSize + 1)) / 2 - (roundSize - 1),
    [roundSize],
  );

  function beginRound(event?: FormEvent) {
    event?.preventDefault();
    const parsed = Number(inputValue);

    if (!Number.isInteger(parsed) || parsed < MIN_NUMBER) {
      setError("请输入一个大于 1 的正整数");
      return;
    }

    if (parsed > MAX_NUMBER) {
      setError(`为了方便点击，请先输入 ${MAX_NUMBER} 以内的数字`);
      return;
    }

    setError("");
    setRoundSize(parsed);
    setTiles(makeTiles(parsed));
    setSelectedId(null);
    setHistory([]);
    setEquation(null);
    nextId.current = parsed + 1;
  }

  function chooseTile(tile: NumberTile) {
    if (isComplete) return;

    if (selectedId === null) {
      setSelectedId(tile.id);
      setEquation(null);
      return;
    }

    if (selectedId === tile.id) {
      setSelectedId(null);
      return;
    }

    const firstIndex = tiles.findIndex((item) => item.id === selectedId);
    const secondIndex = tiles.findIndex((item) => item.id === tile.id);
    const firstTile = tiles[firstIndex];
    if (!firstTile) return;

    const result = firstTile.value + tile.value - 1;
    const insertAt = Math.min(firstIndex, secondIndex);
    const remaining = tiles.filter(
      (item) => item.id !== firstTile.id && item.id !== tile.id,
    );
    const newTile = { id: nextId.current++, value: result };
    const nextTiles = [
      ...remaining.slice(0, insertAt),
      newTile,
      ...remaining.slice(insertAt),
    ];

    setHistory((current) => [...current, tiles]);
    setTiles(nextTiles);
    setSelectedId(null);
    setEquation({
      first: firstTile.value,
      second: tile.value,
      result,
    });
  }

  function undoMove() {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setTiles(previous);
    setHistory((current) => current.slice(0, -1));
    setSelectedId(null);
    setEquation(null);
  }

  function restartRound() {
    setTiles(makeTiles(roundSize));
    setSelectedId(null);
    setHistory([]);
    setEquation(null);
    nextId.current = roundSize + 1;
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="数合实验室首页">
          <span className="brand-mark" aria-hidden="true">
            ∑
          </span>
          <span>数合实验室</span>
        </a>
        <span className="header-tag">数学思维小游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>01</span> 数字合并挑战</div>
        <h1>
          两个数碰一碰，
          <br />
          <em>最后会留下谁？</em>
        </h1>
        <p>
          从 1 开始排好队，每次选两个数，用“相加再减 1”的规则把它们合成一个新数。
        </p>
      </section>

      <section className="workspace" aria-label="数字合并游戏区">
        <div className="game-card">
          <form className="number-form" onSubmit={beginRound}>
            <label htmlFor="round-number">我想从 1 玩到</label>
            <div className="input-row">
              <div className={`number-input-wrap ${error ? "has-error" : ""}`}>
                <input
                  id="round-number"
                  type="number"
                  min={MIN_NUMBER}
                  max={MAX_NUMBER}
                  step="1"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    setError("");
                  }}
                  aria-describedby={error ? "input-error" : "input-hint"}
                />
                <span>以内</span>
              </div>
              <button className="primary-button" type="submit">
                开始新挑战 <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="input-meta">
              <span id="input-hint">可输入 2–{MAX_NUMBER} 的正整数</span>
              {error && <span id="input-error" className="error-text">{error}</span>}
            </div>
          </form>

          <div className="round-divider" />

          <div className="round-head">
            <div>
              <span className="round-label">本轮挑战</span>
              <h2>从 1 到 {roundSize}</h2>
            </div>
            <div className="move-count" aria-label={`已完成 ${movesMade} 步，共 ${totalMoves} 步`}>
              <strong>{movesMade}</strong> / {totalMoves} 步
            </div>
          </div>

          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${totalMoves ? (movesMade / totalMoves) * 100 : 0}%` }} />
          </div>

          <div className="equation-strip" aria-live="polite">
            {isComplete ? (
              <span className="equation-complete">挑战完成！你把所有数字合成了一个。</span>
            ) : selectedTile ? (
              <>
                已选择 <strong>{selectedTile.value}</strong>
                <span className="equation-tip">再选一个数字</span>
              </>
            ) : equation ? (
              <>
                <strong>{equation.first}</strong>
                <span>＋</span>
                <strong>{equation.second}</strong>
                <span>－ 1 ＝</span>
                <strong className="equation-result">{equation.result}</strong>
              </>
            ) : (
              <span>请任意选择两个数字开始合并</span>
            )}
          </div>

          <div className={`tile-field ${isComplete ? "is-complete" : ""}`}>
            <div className="field-dots dots-one" aria-hidden="true" />
            <div className="field-dots dots-two" aria-hidden="true" />
            {isComplete ? (
              <div className="success-panel" aria-live="polite">
                <span className="success-kicker">最终留下的数字</span>
                <strong>{tiles[0]?.value}</strong>
                <p>
                  漂亮！从 1 到 {roundSize}，无论先合并哪两个，最后都会得到 {expectedResult}。
                </p>
                <button className="secondary-button" type="button" onClick={restartRound}>
                  再玩一次
                </button>
              </div>
            ) : (
              <div className="tiles" role="group" aria-label="可以选择的数字">
                {tiles.map((tile) => (
                  <button
                    className={`number-tile ${selectedId === tile.id ? "selected" : ""}`}
                    key={tile.id}
                    type="button"
                    onClick={() => chooseTile(tile)}
                    aria-pressed={selectedId === tile.id}
                    aria-label={`数字 ${tile.value}${selectedId === tile.id ? "，已选择" : ""}`}
                  >
                    {tile.value}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="game-actions">
            <button type="button" onClick={undoMove} disabled={history.length === 0}>
              <span aria-hidden="true">↶</span> 撤销上一步
            </button>
            <button type="button" onClick={restartRound}>
              <span aria-hidden="true">↻</span> 重新开始
            </button>
          </div>
        </div>

        <aside className="rules-card">
          <div className="rules-title-row">
            <span className="rules-icon" aria-hidden="true">?</span>
            <h2>怎么玩</h2>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div><strong>选两个数</strong><p>先点一个，再点另一个。</p></div>
            </li>
            <li>
              <span>2</span>
              <div><strong>合成新数</strong><p>把它们相加，然后减 1。</p></div>
            </li>
            <li>
              <span>3</span>
              <div><strong>继续挑战</strong><p>重复操作，直到只剩一个数。</p></div>
            </li>
          </ol>

          <div className="example-box">
            <span>举个例子</span>
            <div className="example-equation">
              <b>2</b><i>＋</i><b>4</b><i>－ 1 ＝</i><b className="answer">5</b>
            </div>
          </div>

          <div className="think-note">
            <span aria-hidden="true">✦</span>
            <p><strong>想一想</strong>换一种合并顺序，最后的数字会变吗？</p>
          </div>
        </aside>
      </section>

      <footer>
        <span>数合实验室</span>
        <p>让每一次点击，都离答案更近一点。</p>
      </footer>
    </main>
  );
}
