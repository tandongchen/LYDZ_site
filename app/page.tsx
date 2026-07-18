"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

type Mode = 2 | 4;
type Phase = "setup" | "playing" | "finished";
type Suit = "heart" | "diamond" | "spade" | "club";
type HorseId = "red" | "black" | Suit;

type Card = {
  id: string;
  rank: string;
  suit: Suit;
  symbol: string;
  red: boolean;
};

type Horse = {
  id: HorseId;
  owner: string;
  name: string;
  mark: string;
  red: boolean;
};

type RaceLog = {
  id: number;
  card: Card;
  title: string;
  detail: string;
  penalty?: boolean;
};

const SUITS: Array<Pick<Card, "suit" | "symbol" | "red">> = [
  { suit: "heart", symbol: "♥", red: true },
  { suit: "diamond", symbol: "♦", red: true },
  { suit: "spade", symbol: "♠", red: false },
  { suit: "club", symbol: "♣", red: false },
];

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const DEFAULT_NAMES = ["玩家一", "玩家二", "玩家三", "玩家四"];
const FINISH_STEP = 6;

function shuffled<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function createDeck() {
  return SUITS.flatMap(({ suit, symbol, red }) =>
    RANKS.map((rank) => ({
      id: `${suit}-${rank}`,
      rank,
      suit,
      symbol,
      red,
    })),
  );
}

function cleanName(name: string, index: number) {
  return name.trim() || `玩家${index + 1}`;
}

function horseForCard(card: Card, mode: Mode): HorseId {
  if (mode === 2) {
    return card.suit === "heart" || card.suit === "diamond" ? "red" : "black";
  }
  return card.suit;
}

function hurdleRevealThreshold(hurdleIndex: number) {
  return hurdleIndex === 4 ? 5 : hurdleIndex + 2;
}

function PlayingCard({
  card,
  hidden = false,
  small = false,
}: {
  card?: Card;
  hidden?: boolean;
  small?: boolean;
}) {
  if (hidden || !card) {
    return (
      <span className={`playing-card card-back ${small ? "small" : ""}`} aria-label="未翻开的赛道牌">
        <i />
      </span>
    );
  }

  return (
    <span
      className={`playing-card card-front ${card.red ? "red-card" : "black-card"} ${small ? "small" : ""}`}
      aria-label={`${card.symbol}${card.rank}`}
    >
      <b>{card.rank}</b>
      <em>{card.symbol}</em>
      <small>{card.symbol}</small>
    </span>
  );
}

export default function HorseRaceGame() {
  const [mode, setMode] = useState<Mode>(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerNames, setPlayerNames] = useState(DEFAULT_NAMES);
  const [twoHorseOrder, setTwoHorseOrder] = useState<["red", "black"]>(["red", "black"]);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [hurdles, setHurdles] = useState<Card[]>([]);
  const [revealedHurdles, setRevealedHurdles] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [currentCardSource, setCurrentCardSource] = useState<"draw" | "hurdle" | null>(null);
  const [logs, setLogs] = useState<RaceLog[]>([]);
  const [winner, setWinner] = useState<HorseId | null>(null);
  const [message, setMessage] = useState("选择比赛模式，准备让马匹冲出起跑线。");

  const horses = useMemo<Horse[]>(() => {
    if (mode === 2) {
      const horseDetails = {
        red: { id: "red" as const, name: "红马", mark: "JOKER", red: true },
        black: { id: "black" as const, name: "黑马", mark: "JOKER", red: false },
      };
      return twoHorseOrder.map((horseId, index) => ({
        ...horseDetails[horseId],
        owner: cleanName(playerNames[index], index),
      }));
    }

    return SUITS.map(({ suit, symbol, red }, index) => ({
      id: suit,
      owner: cleanName(playerNames[index], index),
      name: `${symbol} ${["红桃", "方块", "黑桃", "梅花"][index]}马`,
      mark: "A",
      red,
    }));
  }, [mode, playerNames, twoHorseOrder]);

  const winningHorse = horses.find((horse) => horse.id === winner) ?? null;
  const canRevealNextHurdle =
    phase === "playing" &&
    revealedHurdles < hurdles.length &&
    horses.every(
      (horse) =>
        (positions[horse.id] ?? 0) >= hurdleRevealThreshold(revealedHurdles),
    );

  function updatePlayerName(index: number, value: string) {
    setPlayerNames((names) => names.map((name, nameIndex) => (nameIndex === index ? value : name)));
  }

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(nextMode === 2 ? "两匹马按红黑颜色冲刺。" : "四匹马按花色各自冲刺。");
  }

  function startRace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raceCards = shuffled(createDeck());
    const nextHurdles = raceCards.slice(0, 5);
    const nextDeck = raceCards.slice(5);
    const nextPositions = Object.fromEntries(horses.map((horse) => [horse.id, 0]));

    setPositions(nextPositions);
    setHurdles(nextHurdles);
    setRevealedHurdles(0);
    setDeck(nextDeck);
    setCurrentCard(null);
    setCurrentCardSource(null);
    setLogs([]);
    setWinner(null);
    setMessage("赛道已经铺好。翻开第一张牌，让比赛开始！");
    setPhase("playing");
  }

  function drawNextCard() {
    if (phase !== "playing" || deck.length === 0 || canRevealNextHurdle) return;

    const [card, ...remainingDeck] = deck;
    const movingHorseId = horseForCard(card, mode);
    const movingHorse = horses.find((horse) => horse.id === movingHorseId);
    if (!movingHorse) return;

    const nextPositions = {
      ...positions,
      [movingHorseId]: Math.min(FINISH_STEP, (positions[movingHorseId] ?? 0) + 1),
    };
    const nextLogs: RaceLog[] = [
      {
        id: Date.now(),
        card,
        title: `${movingHorse.name} 前进 1 格`,
        detail: `${movingHorse.owner} 的马匹冲向下一段赛道`,
      },
      ...logs,
    ];

    setDeck(remainingDeck);
    setCurrentCard(card);
    setCurrentCardSource("draw");

    if (nextPositions[movingHorseId] >= FINISH_STEP) {
      setPositions(nextPositions);
      setLogs(nextLogs);
      setWinner(movingHorseId);
      setMessage(`${movingHorse.owner} 驾驭${movingHorse.name}率先冲线！`);
      setPhase("finished");
      return;
    }

    setPositions(nextPositions);
    setLogs(nextLogs);
    const everyoneCrossedNextGate =
      revealedHurdles < hurdles.length &&
      horses.every(
        (horse) =>
          (nextPositions[horse.id] ?? 0) >= hurdleRevealThreshold(revealedHurdles),
      );
    const nextGateIsFinish = revealedHurdles === hurdles.length - 1;
    setMessage(
      everyoneCrossedNextGate
        ? nextGateIsFinish
          ? "所有马已到达第 5 道关卡，请点击赛道上的关卡牌手动翻开。"
          : `所有马已完全越过第 ${revealedHurdles + 1} 道关卡，请点击赛道上的关卡牌手动翻开。`
        : `${card.symbol}${card.rank} 翻开，${movingHorse.name}前进 1 格。`,
    );
  }

  function revealNextHurdle() {
    if (!canRevealNextHurdle) return;

    const hurdle = hurdles[revealedHurdles];
    const penalizedHorseId = horseForCard(hurdle, mode);
    const penalizedHorse = horses.find((horse) => horse.id === penalizedHorseId);
    if (!penalizedHorse) return;

    setPositions((current) => ({
      ...current,
      [penalizedHorseId]: Math.max(0, (current[penalizedHorseId] ?? 0) - 1),
    }));
    setLogs((current) => [
      {
        id: Date.now(),
        card: hurdle,
        title: `第 ${revealedHurdles + 1} 道关卡揭晓`,
        detail: `${hurdle.symbol}${hurdle.rank} 命中${penalizedHorse.name}，后退 1 格`,
        penalty: true,
      },
      ...current,
    ]);
    setCurrentCard(hurdle);
    setCurrentCardSource("hurdle");
    setRevealedHurdles((count) => count + 1);
    setMessage(
      `第 ${revealedHurdles + 1} 道关卡是 ${hurdle.symbol}${hurdle.rank}，${penalizedHorse.name}后退 1 格。`,
    );
  }

  function restartSameMode() {
    const raceCards = shuffled(createDeck());
    setPositions(Object.fromEntries(horses.map((horse) => [horse.id, 0])));
    setHurdles(raceCards.slice(0, 5));
    setDeck(raceCards.slice(5));
    setRevealedHurdles(0);
    setCurrentCard(null);
    setCurrentCardSource(null);
    setLogs([]);
    setWinner(null);
    setMessage("新赛道已经铺好。翻开第一张牌！");
    setPhase("playing");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="魔法数学首页">
          <span className="brand-mark magic-hat" aria-hidden="true"><span>✦</span></span>
          <span>魔法数学</span>
        </a>
        <span className="issue-tag">数学思维小游戏</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />THE WILD HORSE RACE<span /></p>
          <h1><span>御</span><span>马</span><span>狂</span><span>飙</span></h1>
          <p className="hero-lead">翻一张牌，<br /><em>让你的马再快一步。</em></p>
          <p className="hero-description">
            红黑对决，或四种花色同场竞速。每次翻牌都推动一匹马向前，
            但藏在赛道里的五张关卡牌，随时可能让领先者退回一步。
          </p>
          <div className="hero-tags" aria-label="游戏特点">
            <span>2 / 4 人可玩</span><span>一副扑克牌</span>
          </div>
        </div>
        <div className="hero-race" aria-hidden="true">
          <span className="sun-disc" />
          <span className="speed-line line-one" />
          <span className="speed-line line-two" />
          <span className="speed-line line-three" />
          <span className="hero-horse horse-red">♞</span>
          <span className="hero-horse horse-black">♞</span>
          <span className="dust dust-one" />
          <span className="dust dust-two" />
        </div>
      </section>

      <section className="game-shell" aria-labelledby="game-title">
        <div className="shell-heading">
          <div>
            <span className="section-kicker">RACE TABLE</span>
            <h2 id="game-title">
              {phase === "setup" ? "选择你的比赛阵容" : phase === "finished" ? "胜负已经揭晓" : "赛道正在疾驰"}
            </h2>
          </div>
          {phase !== "setup" && (
            <button className="text-button" type="button" onClick={() => setPhase("setup")}>
              重新选模式
            </button>
          )}
        </div>

        {phase === "setup" ? (
          <form className="setup-form" onSubmit={startRace}>
            <fieldset className="mode-picker">
              <legend>01 · 选择比赛模式</legend>
              <div>
                <button
                  type="button"
                  className={mode === 2 ? "selected" : ""}
                  aria-pressed={mode === 2}
                  onClick={() => chooseMode(2)}
                >
                  <strong>双马对决</strong>
                  <span>红马 vs 黑马</span>
                  <small>按牌面颜色前进</small>
                </button>
                <button
                  type="button"
                  className={mode === 4 ? "selected" : ""}
                  aria-pressed={mode === 4}
                  onClick={() => chooseMode(4)}
                >
                  <strong>四马争霸</strong>
                  <span>♥ ♦ ♠ ♣</span>
                  <small>按牌面花色前进</small>
                </button>
              </div>
            </fieldset>

            <div className="player-setup">
              <div className="field-label">
                <span>02 · 填写玩家名称</span>
                <small>{mode === 2 ? "点击下方按钮可交换马匹" : "每位玩家对应一种花色"}</small>
              </div>
              <div className={`player-fields mode-${mode}`}>
                {horses.map((horse, index) => (
                  <label key={horse.id}>
                    <span className={horse.red ? "red-suit" : "black-suit"}>{horse.mark === "A" ? horse.name.charAt(0) : "♞"}</span>
                    <div>
                      <small>{horse.name}</small>
                      <input
                        value={playerNames[index]}
                        onChange={(event) => updatePlayerName(index, event.target.value)}
                        maxLength={10}
                        aria-label={`${horse.name}玩家名称`}
                      />
                    </div>
                  </label>
                ))}
              </div>
              {mode === 2 && (
                <button
                  className="swap-button"
                  type="button"
                  onClick={() => setTwoHorseOrder(([first, second]) => [second, first])}
                >
                  ⇄ 交换红马与黑马
                </button>
              )}
            </div>

            <aside className="setup-note">
              <span className="section-kicker">READY?</span>
              <p>系统会自动洗牌，并随机抽出 5 张牌铺成隐藏赛道。</p>
              <button className="primary-button start-button" type="submit">
                发牌开赛 <span>→</span>
              </button>
            </aside>
          </form>
        ) : (
          <div className="race-console">
            <div className="course-board">
              <div className="course-axis">
                <span className="axis-label">赛道</span>
                <div className="axis-grid">
                  <div className="start-marker"><span>START</span></div>
                  {hurdles.map((card, index) => {
                    const isRevealed = index < revealedHurdles;
                    const isReadyToReveal = index === revealedHurdles && canRevealNextHurdle;
                    return (
                      <div className={`gate-marker ${isReadyToReveal ? "ready-to-flip" : ""}`} key={card.id}>
                        <small>关卡 {index + 1}</small>
                        <button
                          className="hurdle-card-button"
                          type="button"
                          disabled={!isReadyToReveal}
                          onClick={revealNextHurdle}
                          aria-label={
                            isReadyToReveal
                              ? `翻开第 ${index + 1} 道关卡牌`
                              : isRevealed
                                ? `第 ${index + 1} 道关卡已翻开`
                                : `第 ${index + 1} 道关卡尚未到达`
                          }
                        >
                          <PlayingCard card={card} hidden={!isRevealed} small />
                          {isReadyToReveal && <b className="flip-hint">点击翻开</b>}
                        </button>
                      </div>
                    );
                  })}
                  <div className="finish-marker"><i /><span>FINISH</span></div>
                </div>
              </div>

              <div className="lanes">
                {horses.map((horse) => (
                  <div className="lane-row" key={horse.id}>
                    <div className="lane-meta">
                      <span className={horse.red ? "red-suit" : "black-suit"}>{horse.name.split(" ")[0]}</span>
                      <div><strong>{horse.name}</strong><small>{horse.owner}</small></div>
                    </div>
                    <div className="lane-track">
                      {Array.from({ length: 7 }, (_, step) => (
                        <div className={`track-cell step-${step}`} key={step}>
                          {(positions[horse.id] ?? 0) === step && (
                            <span
                              className={`horse-token ${horse.red ? "red-horse" : "black-horse"} ${winner === horse.id ? "winner" : ""}`}
                              style={{ "--horse-delay": `${Number(horse.id.length) * 20}ms` } as CSSProperties}
                              aria-label={`${horse.owner}的${horse.name}在第${step}格`}
                            >
                              <b>{horse.mark}</b><em>{horse.mark === "A" ? horse.name.charAt(0) : "♞"}</em>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {phase === "finished" && winningHorse ? (
              <div className="winner-panel" role="status">
                <span className={`winner-seal ${winningHorse.red ? "red-seal" : "black-seal"}`}>♞</span>
                <div>
                  <span className="section-kicker">RACE OVER</span>
                  <h3>{winningHorse.owner} 驾驭{winningHorse.name}夺冠！</h3>
                  <p>率先越过第五张赛道牌，冲过终点线。</p>
                </div>
                <button className="primary-button" type="button" onClick={restartSameMode}>
                  再赛一局 <span>→</span>
                </button>
              </div>
            ) : (
              <div className="draw-grid">
                <div className="draw-stage">
                  <div className="deck-stack" aria-hidden="true">
                    <span /><span /><PlayingCard hidden />
                    <small>剩余 {deck.length} 张</small>
                  </div>
                  <div className="draw-action">
                    <span className="section-kicker">
                      {currentCardSource === "hurdle" ? "CHECKPOINT CARD" : "NEXT CARD"}
                    </span>
                    <h3 className={currentCard?.red ? "red-card-title" : ""}>
                      {currentCard ? `${currentCard.symbol}${currentCard.rank}` : "等待第一张牌"}
                    </h3>
                    <p>{message}</p>
                    <button
                      className="primary-button draw-button"
                      type="button"
                      onClick={drawNextCard}
                      disabled={canRevealNextHurdle}
                    >
                      {canRevealNextHurdle ? "请先翻开关卡" : "翻开下一张"} <span>→</span>
                    </button>
                  </div>
                  <div className="current-card">
                    {currentCard ? <PlayingCard card={currentCard} /> : <span className="card-placeholder">?</span>}
                  </div>
                </div>

                <aside className="race-log" aria-label="比赛记录">
                  <div className="log-heading">
                    <div><span className="section-kicker">RACE LOG</span><h3>赛况播报</h3></div>
                    <strong>{logs.filter((log) => !log.penalty).length}<small>次翻牌</small></strong>
                  </div>
                  <div className="log-list" aria-live="polite">
                    {logs.length === 0 ? (
                      <p className="empty-log">还没有翻牌。<br />第一匹出发的马，会是谁？</p>
                    ) : (
                      logs.map((log) => (
                        <div className={`log-item ${log.penalty ? "penalty" : ""}`} key={log.id}>
                          <span className={log.card.red ? "red-suit" : "black-suit"}>{log.card.symbol}{log.card.rank}</span>
                          <div><strong>{log.title}</strong><small>{log.detail}</small></div>
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              </div>
            )}

            <p className="game-message" aria-live="polite">
              <span>●</span>{message}
            </p>
          </div>
        )}
      </section>

      <section className="rules-section" aria-labelledby="rules-title">
        <div className="rules-heading">
          <div>
            <span className="section-kicker">HOW TO PLAY</span>
            <h2 id="rules-title">一副牌，两种赛制</h2>
          </div>
          <p>先让所有马越过关卡，再揭晓它的惩罚牌。</p>
        </div>
        <div className="rule-grid">
          <article>
            <span>01</span>
            <div><strong>选马与铺赛道</strong><p>双人版用大小王作为红、黑两匹马；四人版用四张 A 代表四种花色。随机抽 5 张牌背面朝上排成赛道。</p></div>
          </article>
          <article>
            <span>02</span>
            <div><strong>翻牌向前冲</strong><p>双人版按红黑颜色前进；四人版按红桃、方块、黑桃、梅花的具体花色前进。每翻一张，对应马匹前进 1 格。</p></div>
          </article>
          <article>
            <span>03</span>
            <div><strong>手动揭晓关卡</strong><p>第 1—4 关必须等所有马完全越过后，才由玩家点击翻开；第 5 关只需所有马到达即可翻开。双人版同色马后退 1 格，四人版同花色马后退 1 格。</p></div>
          </article>
          <article>
            <span>04</span>
            <div><strong>率先越线夺冠</strong><p>继续翻牌并逐道处理关卡。任何一匹马率先越过第 5 张赛道牌、抵达终点，比赛立即结束。</p></div>
          </article>
        </div>
      </section>

      <footer>
        <span>魔法数学</span>
        <p>牌面决定步伐，关卡改变胜负。</p>
      </footer>
    </main>
  );
}
