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

const MAX_TILE_COUNT = 100;

function makeTiles(start: number, end: number): NumberTile[] {
  return Array.from({ length: end - start + 1 }, (_, index) => ({
    id: index + 1,
    value: start + index,
  }));
}

export default function Home() {
  const [startInput, setStartInput] = useState("1");
  const [endInput, setEndInput] = useState("8");
  const [roundStart, setRoundStart] = useState(1);
  const [roundEnd, setRoundEnd] = useState(8);
  const [tiles, setTiles] = useState<NumberTile[]>(() => makeTiles(1, 8));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<NumberTile[][]>([]);
  const [equation, setEquation] = useState<Equation | null>(null);
  const [error, setError] = useState("");
  const nextId = useRef(9);

  const roundCount = roundEnd - roundStart + 1;
  const totalMoves = roundCount - 1;
  const movesMade = roundCount - tiles.length;
  const isComplete = tiles.length === 1;
  const selectedTile = tiles.find((tile) => tile.id === selectedId);
  const expectedResult = useMemo(
    () => ((roundStart + roundEnd) * roundCount) / 2 - totalMoves,
    [roundStart, roundEnd, roundCount, totalMoves],
  );

  function beginRound(event?: FormEvent) {
    event?.preventDefault();
    const start = Number(startInput);
    const end = Number(endInput);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
      setError("起点和终点都要是正整数");
      return;
    }

    if (end <= start) {
      setError("终点要大于起点，这样才有数字可以合并");
      return;
    }

    if (end - start + 1 > MAX_TILE_COUNT) {
      setError(`一次最多生成 ${MAX_TILE_COUNT} 个数，请缩小范围`);
      return;
    }

    setError("");
    setRoundStart(start);
    setRoundEnd(end);
    setTiles(makeTiles(start, end));
    setSelectedId(null);
    setHistory([]);
    setEquation(null);
    nextId.current = end - start + 2;
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
    setTiles(makeTiles(roundStart, roundEnd));
    setSelectedId(null);
    setHistory([]);
    setEquation(null);
    nextId.current = roundCount + 1;
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="魔法数学首页">
          <span className="brand-mark magic-hat" aria-hidden="true">
            <span>✦</span>
          </span>
          <span>魔法数学</span>
        </a>
        <span className="header-tag">数学思维小游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="game-name" aria-label="数字消消乐">
          <span aria-hidden="true">数</span>
          <span aria-hidden="true">字</span>
          <span aria-hidden="true">消</span>
          <span aria-hidden="true">消</span>
          <span aria-hidden="true">乐</span>
        </div>
        <h1>
          两个数碰一碰，
          <br />
          <em>最后会留下谁？</em>
        </h1>
        <p>
          让一段连续的数字排好队，每次选两个数，用“相加再减 1”的规则把它们合成一个新数。
        </p>
      </section>

      <section className="workspace" aria-label="数字消消乐游戏区">
        <div className="game-card">
          <form className="number-form" onSubmit={beginRound}>
            <label htmlFor="range-start">我想从某个数玩到某个数</label>
            <div className="input-row">
              <div className="range-inputs">
                <div className={`range-field ${error ? "has-error" : ""}`}>
                  <span>从</span>
                  <input
                    id="range-start"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={startInput}
                    onChange={(event) => {
                      setStartInput(event.target.value);
                      setError("");
                    }}
                    aria-label="起点数字"
                    aria-describedby={error ? "input-error" : "input-hint"}
                  />
                </div>
                <span className="range-arrow" aria-hidden="true">→</span>
                <div className={`range-field ${error ? "has-error" : ""}`}>
                  <span>到</span>
                  <input
                    id="range-end"
                    type="number"
                    min="2"
                    step="1"
                    inputMode="numeric"
                    value={endInput}
                    onChange={(event) => {
                      setEndInput(event.target.value);
                      setError("");
                    }}
                    aria-label="终点数字"
                    aria-describedby={error ? "input-error" : "input-hint"}
                  />
                </div>
              </div>
              <button className="primary-button" type="submit">
                开始新挑战 <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="input-meta">
              <span id="input-hint">请输入正整数，终点需大于起点，最多生成 {MAX_TILE_COUNT} 个数</span>
              {error && <span id="input-error" className="error-text">{error}</span>}
            </div>
          </form>

          <div className="round-divider" />

          <div className="round-head">
            <div>
              <span className="round-label">本轮挑战</span>
              <h2>从 {roundStart} 到 {roundEnd}</h2>
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
                  漂亮！从 {roundStart} 到 {roundEnd}，无论先合并哪两个，最后都会得到 {expectedResult}。
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
        <span>魔法数学</span>
        <p>让每一次点击，都离答案更近一点。</p>
      </footer>
    </main>
  );
}
