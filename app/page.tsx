"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type DirectionKey = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type GameStatus = "ready" | "running" | "success" | "failed";

type Direction = {
  key: DirectionKey;
  glyph: string;
  name: string;
  dr: number;
  dc: number;
};

type ArrowCell = {
  id: number;
  row: number;
  col: number;
  arrows: DirectionKey[];
};

type Board = {
  size: number;
  seed: number;
  cells: ArrowCell[];
  solutionId: number;
};

const DIRECTIONS: Direction[] = [
  { key: "n", glyph: "↑", name: "上", dr: -1, dc: 0 },
  { key: "ne", glyph: "↗", name: "右上", dr: -1, dc: 1 },
  { key: "e", glyph: "→", name: "右", dr: 0, dc: 1 },
  { key: "se", glyph: "↘", name: "右下", dr: 1, dc: 1 },
  { key: "s", glyph: "↓", name: "下", dr: 1, dc: 0 },
  { key: "sw", glyph: "↙", name: "左下", dr: 1, dc: -1 },
  { key: "w", glyph: "←", name: "左", dr: 0, dc: -1 },
  { key: "nw", glyph: "↖", name: "左上", dr: -1, dc: -1 },
];

const DIRECTION_MAP = Object.fromEntries(
  DIRECTIONS.map((direction) => [direction.key, direction]),
) as Record<DirectionKey, Direction>;

const SIZE_OPTIONS = [5, 6, 7, 8];

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function directionBetween(from: { row: number; col: number }, to: { row: number; col: number }) {
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);
  return DIRECTIONS.find((direction) => direction.dr === dr && direction.dc === dc)!.key;
}

function createBoard(size: number, seed: number): Board {
  const random = seededRandom(seed);
  const transpose = random() > 0.5;
  const flipRows = random() > 0.5;
  const flipColumns = random() > 0.5;

  const transform = (row: number, col: number) => {
    let nextRow = transpose ? col : row;
    let nextCol = transpose ? row : col;
    if (flipRows) nextRow = size - 1 - nextRow;
    if (flipColumns) nextCol = size - 1 - nextCol;
    return { row: nextRow, col: nextCol };
  };

  const path = Array.from({ length: size }, (_, row) => {
    const columns = Array.from({ length: size }, (__, col) => col);
    if (row % 2 === 1) columns.reverse();
    return columns.map((col) => transform(row, col));
  }).flat();

  if (random() > 0.5) path.reverse();

  const cells = Array.from({ length: size * size }, (_, id) => ({
    id,
    row: Math.floor(id / size),
    col: id % size,
    arrows: [] as DirectionKey[],
  }));

  path.forEach((point, index) => {
    const current = cells[point.row * size + point.col];
    const neighbor = path[index === path.length - 1 ? index - 1 : index + 1];
    const arrows = new Set<DirectionKey>([directionBetween(point, neighbor)]);
    const extraCount = (random() < 0.7 ? 1 : 0) + (random() < 0.28 ? 1 : 0);

    while (arrows.size < 1 + extraCount) {
      arrows.add(DIRECTIONS[Math.floor(random() * DIRECTIONS.length)].key);
    }

    current.arrows = [...arrows];
  });

  return {
    size,
    seed,
    cells,
    solutionId: path[0].row * size + path[0].col,
  };
}

const INITIAL_BOARD = createBoard(6, 20260715);

function coordinateOf(id: number, size: number) {
  return `${String.fromCharCode(65 + (id % size))}${Math.floor(id / size) + 1}`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default function Home() {
  const [selectedSize, setSelectedSize] = useState(6);
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [aliveIds, setAliveIds] = useState<number[]>(INITIAL_BOARD.cells.map((cell) => cell.id));
  const [status, setStatus] = useState<GameStatus>("ready");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [startId, setStartId] = useState<number | null>(null);
  const [trail, setTrail] = useState<number[]>([]);
  const runToken = useRef(0);

  const aliveSet = useMemo(() => new Set(aliveIds), [aliveIds]);
  const removedCount = board.cells.length - aliveIds.length;
  const progress = (removedCount / board.cells.length) * 100;

  function resetState(nextBoard = board) {
    runToken.current += 1;
    setAliveIds(nextBoard.cells.map((cell) => cell.id));
    setStatus("ready");
    setCurrentId(null);
    setStartId(null);
    setTrail([]);
  }

  function generateBoard(size = selectedSize) {
    const seed = (board.seed * 1664525 + 1013904223 + size * 7919) >>> 0;
    const nextBoard = createBoard(size, seed);
    setSelectedSize(size);
    setBoard(nextBoard);
    resetState(nextBoard);
  }

  function findTarget(cell: ArrowCell, direction: Direction, alive: Set<number>) {
    let row = cell.row + direction.dr;
    let col = cell.col + direction.dc;

    while (row >= 0 && row < board.size && col >= 0 && col < board.size) {
      const id = row * board.size + col;
      if (alive.has(id)) return id;
      row += direction.dr;
      col += direction.dc;
    }

    return null;
  }

  async function startChain(id: number) {
    if (status !== "ready") return;

    const token = runToken.current + 1;
    runToken.current = token;
    const alive = new Set(board.cells.map((cell) => cell.id));
    const queue = [id];
    const order: number[] = [];

    setStatus("running");
    setStartId(id);
    setTrail([]);

    while (queue.length > 0) {
      const nextId = queue.shift()!;
      if (!alive.has(nextId)) continue;

      alive.delete(nextId);
      order.push(nextId);
      setCurrentId(nextId);
      setAliveIds([...alive]);
      setTrail([...order]);

      await wait(125);
      if (runToken.current !== token) return;

      const cell = board.cells[nextId];
      cell.arrows.forEach((key) => {
        const target = findTarget(cell, DIRECTION_MAP[key], alive);
        if (target !== null && !queue.includes(target)) queue.push(target);
      });
    }

    await wait(180);
    if (runToken.current !== token) return;
    setCurrentId(null);
    setStatus(alive.size === 0 ? "success" : "failed");
  }

  const statusCopy = {
    ready: { eyebrow: "等待落点", title: "请选择唯一的起点", detail: "点击任意一格，之后交给箭头完成连锁。" },
    running: { eyebrow: "连锁进行中", title: `第 ${trail.length} 格正在消除`, detail: "箭头正在寻找对应方向上最近的方格。" },
    success: { eyebrow: "挑战成功", title: "迷域已被全部清空！", detail: `从 ${coordinateOf(startId!, board.size)} 出发，完成了 ${trail.length} 次连锁。` },
    failed: { eyebrow: "挑战失败", title: `还剩 ${aliveIds.length} 个方格`, detail: "这条连锁已经停止，换一个起点再试试。" },
  }[status];

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="魔法数学首页">
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span>魔法数学</span>
        </a>
        <span className="header-tag">单人连锁推理小游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> SOLO CHAIN PUZZLE <span /></div>
          <h1 aria-label="箭阵迷域">
            {"箭阵迷域".split("").map((character, index) => (
              <span key={`${character}-${index}`}>{character}</span>
            ))}
          </h1>
          <p className="hero-lead">
            一次落点<br />
            <em>引爆整座迷域！</em>
          </p>
          <p className="hero-description">
            每个方格都藏着一组方向。选中一个起点后，箭头会击中该方向上最近的方格，
            再由新方格继续传递。看懂箭阵的路径，让最后一格也消失。
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-arrow art-a">↗</span>
          <span className="art-arrow art-b">←</span>
          <span className="art-arrow art-c">↓</span>
          <span className="art-arrow art-d">↘</span>
          <span className="hero-number">GO</span>
        </div>
      </section>

      <section className="game-shell" aria-label="箭阵迷域游戏区">
        <div className="setup-panel">
          <div className="setup-heading">
            <span className="section-kicker">NEW MAZE</span>
            <h2>选择迷域规模</h2>
            <p>尺寸越大，方向越多。每一张新棋盘都至少藏着一条完整通路。</p>
          </div>

          <div className="setup-controls">
            <fieldset className="size-picker">
              <legend>方格尺寸</legend>
              <div>
                {SIZE_OPTIONS.map((size) => (
                  <button
                    className={selectedSize === size ? "selected" : ""}
                    key={size}
                    type="button"
                    onClick={() => generateBoard(size)}
                    disabled={status === "running"}
                    aria-pressed={selectedSize === size}
                  >
                    <strong>{size}×{size}</strong>
                    <span>{size === 5 ? "轻巧" : size === 6 ? "标准" : size === 7 ? "进阶" : "极限"}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              className="new-game-button"
              type="button"
              onClick={() => generateBoard()}
              disabled={status === "running"}
            >
              随机生成新迷域 <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        <div className="game-divider" />

        <div className="status-row">
          <div className={`status-orb status-${status}`} aria-hidden="true">
            {status === "success" ? "✓" : status === "failed" ? "!" : "↗"}
          </div>
          <div className="turn-status" aria-live="polite">
            <small>{statusCopy.eyebrow}</small>
            <strong>{statusCopy.title}</strong>
            <p>{statusCopy.detail}</p>
          </div>
          <div className="cell-counter">
            <span>剩余</span>
            <strong>{aliveIds.length}</strong>
            <span>/ {board.cells.length} 格</span>
          </div>
        </div>

        <div className="progress-track" aria-label={`已消除 ${removedCount} 格，共 ${board.cells.length} 格`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className={`result-banner result-${status}`} role="status">
          <span className="result-mark" aria-hidden="true">
            {status === "success" ? "全消" : status === "failed" ? "止步" : status === "running" ? "连锁" : "一击"}
          </span>
          <p>
            {status === "ready" && <><strong>你只有一次点击机会。</strong>先沿着箭头在心里走一遍，再决定从哪里开始。</>}
            {status === "running" && <><strong>不要眨眼。</strong>每一次消除都会改变下一支箭寻找的“最近方格”。</>}
            {status === "success" && <><strong>漂亮的落点！</strong>所有箭头都完成了使命，迷域中没有方格了。</>}
            {status === "failed" && <><strong>连锁在这里断开。</strong>保底通路从 {coordinateOf(board.solutionId, board.size)} 开始，再观察一次箭头关系。</>}
          </p>
          {(status === "success" || status === "failed") && (
            <div className="result-actions">
              <button type="button" onClick={() => resetState()}>再试同一局</button>
              <button type="button" onClick={() => generateBoard()}>换一张棋盘</button>
            </div>
          )}
        </div>

        <div
          className="board-frame"
          style={{ "--board-size": board.size } as CSSProperties}
        >
          <div className="column-labels" aria-hidden="true">
            {Array.from({ length: board.size }, (_, index) => <span key={index}>{String.fromCharCode(65 + index)}</span>)}
          </div>
          <div className="board-body">
            <div className="row-labels" aria-hidden="true">
              {Array.from({ length: board.size }, (_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            <div className={`arrow-board board-${board.size}`}>
              {board.cells.map((cell) => {
                const removed = !aliveSet.has(cell.id);
                const coordinate = coordinateOf(cell.id, board.size);
                const arrowNames = cell.arrows.map((key) => DIRECTION_MAP[key].name).join("、");
                return (
                  <button
                    className={`arrow-cell arrows-${cell.arrows.length} ${removed ? "is-removed" : ""} ${currentId === cell.id ? "is-current" : ""}`}
                    key={cell.id}
                    type="button"
                    disabled={status !== "ready" || removed}
                    onClick={() => startChain(cell.id)}
                    aria-label={`${coordinate}，箭头方向：${arrowNames}${removed ? "，已消除" : ""}`}
                  >
                    <span className="cell-coordinate" aria-hidden="true">{coordinate}</span>
                    <span className="arrow-cluster" aria-hidden="true">
                      {cell.arrows.map((key) => (
                        <i key={key}>{DIRECTION_MAP[key].glyph}</i>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="board-footnote">
          <span><i className="dot dot-live" />仍在场</span>
          <span><i className="dot dot-chain" />正在连锁</span>
          <p>{status === "ready" ? "点击任意一格开始挑战" : `本局起点：${startId === null ? "—" : coordinateOf(startId, board.size)}`}</p>
        </div>
      </section>

      <section className="lower-grid">
        <aside className="rules-card">
          <div className="card-heading">
            <span className="card-number">01</span>
            <div><small>GAME RULES</small><h2>怎么玩？</h2></div>
          </div>
          <ol>
            <li><span>1</span><p><strong>只选一次起点</strong>棋盘静止时，任选一个仍存在的方格点击。</p></li>
            <li><span>2</span><p><strong>沿箭头寻找目标</strong>每支箭击中该方向上最近的方格；没有目标就停止。</p></li>
            <li><span>3</span><p><strong>被击中的格继续触发</strong>多支箭可以同时延伸，形成一串自动连锁。</p></li>
            <li><span>4</span><p><strong>清空棋盘即胜利</strong>连锁结束后没有方格留下，挑战成功；否则失败。</p></li>
          </ol>
        </aside>

        <aside className="history-card">
          <div className="card-heading">
            <span className="card-number">02</span>
            <div><small>CHAIN TRACE</small><h2>连锁轨迹</h2></div>
          </div>
          {trail.length === 0 ? (
            <div className="empty-history">
              <span aria-hidden="true">↗</span>
              <p>还没有箭头被触发<br />先找一条能贯穿全局的路径</p>
            </div>
          ) : (
            <div className="trace-list" aria-label="最近消除的方格">
              {trail.slice(-12).map((id, index) => (
                <span key={`${id}-${index}`}>
                  <small>{Math.max(1, trail.length - 11) + index}</small>
                  <strong>{coordinateOf(id, board.size)}</strong>
                </span>
              ))}
            </div>
          )}
          <div className="strategy-note">
            <span aria-hidden="true">“</span>
            <p><strong>观察窍门</strong>先找“没有其他格子指向它”的方格，它往往更适合作为连锁起点。</p>
          </div>
        </aside>
      </section>

      <footer>
        <span>魔法数学</span>
        <p>看清方向，再落下唯一的一步。</p>
        <small>每一次选择都至关重要</small>
      </footer>
    </main>
  );
}
