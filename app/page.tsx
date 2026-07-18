"use client";

import { useMemo, useState } from "react";

type PlayerId = "p1" | "p2";
type TeamId = "argentina" | "spain" | "france" | "england" | "portugal";
type StatKey = "attack" | "defense" | "control";
type Phase = "setup" | "prep" | "firstHalf" | "halftime" | "secondHalf" | "finished";

type Stats = Record<StatKey, number>;
type PlayingCard = {
  id: string;
  rank: string;
  suit: "♥" | "♦" | "♠" | "♣";
  red: boolean;
};
type LogEntry = {
  id: number;
  title: string;
  detail: string;
  tone: "system" | "p1" | "p2" | "goal";
};

const TEAM_DATA: Record<TeamId, { name: string; code: string; stats: Stats }> = {
  argentina: { name: "阿根廷", code: "ARG", stats: { attack: 7, defense: 7, control: 7 } },
  spain: { name: "西班牙", code: "ESP", stats: { attack: 6, defense: 7, control: 8 } },
  france: { name: "法国", code: "FRA", stats: { attack: 8, defense: 6, control: 6 } },
  england: { name: "英格兰", code: "ENG", stats: { attack: 7, defense: 6, control: 6 } },
  portugal: { name: "葡萄牙", code: "POR", stats: { attack: 7, defense: 5, control: 6 } },
};

const STAT_META: Record<StatKey, { label: string; short: string }> = {
  attack: { label: "进攻", short: "攻" },
  defense: { label: "防守", short: "守" },
  control: { label: "控制", short: "控" },
};

const DEFAULT_STATS: Record<PlayerId, Stats> = {
  p1: { attack: 6, defense: 7, control: 8 },
  p2: { attack: 8, defense: 6, control: 6 },
};

function otherPlayer(player: PlayerId): PlayerId {
  return player === "p1" ? "p2" : "p1";
}

function playerLabel(player: PlayerId) {
  return player === "p1" ? "玩家一" : "玩家二";
}

function clampChance(value: number) {
  return Math.max(0, Math.min(10, value));
}

function createDeck(): PlayingCard[] {
  const suits: PlayingCard["suit"][] = ["♥", "♦", "♠", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${suit}-${rank}`,
      rank,
      suit,
      red: suit === "♥" || suit === "♦",
    })),
  );
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function copyStats(stats: Stats): Stats {
  return { attack: stats.attack, defense: stats.defense, control: stats.control };
}

export default function WorldCupGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [teams, setTeams] = useState<Record<PlayerId, TeamId>>({ p1: "spain", p2: "france" });
  const [stats, setStats] = useState<Record<PlayerId, Stats>>(DEFAULT_STATS);
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [current, setCurrent] = useState<PlayerId>("p1");
  const [prepStarter, setPrepStarter] = useState<PlayerId>("p1");
  const [firstHalfStarter, setFirstHalfStarter] = useState<PlayerId>("p1");
  const [prepTurn, setPrepTurn] = useState(0);
  const [matchTurn, setMatchTurn] = useState(0);
  const [drawnCard, setDrawnCard] = useState<PlayingCard | null>(null);
  const [boostLeft, setBoostLeft] = useState(0);
  const [sabotageLeft, setSabotageLeft] = useState(0);
  const [score, setScore] = useState<Record<PlayerId, number>>({ p1: 0, p2: 0 });
  const [attacks, setAttacks] = useState<Record<PlayerId, number>>({ p1: 0, p2: 0 });
  const [defenseActiveAt, setDefenseActiveAt] = useState<Record<PlayerId, number | null>>({
    p1: null,
    p2: null,
  });
  const [bonusTurns, setBonusTurns] = useState(0);
  const [halftimeOrder, setHalftimeOrder] = useState<PlayerId[]>(["p1", "p2"]);
  const [halftimeIndex, setHalftimeIndex] = useState(0);
  const [halftimePoints, setHalftimePoints] = useState(3);
  const [message, setMessage] = useState("双方选择球队后，由系统掷硬币决定准备阶段先手。");
  const [formula, setFormula] = useState("17 回合 · 5 回合准备 · 12 回合对决");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const activeTeam = TEAM_DATA[teams[current]];
  const opponent = otherPlayer(current);
  const isMatchPhase = phase === "firstHalf" || phase === "secondHalf";
  const halfTurn = phase === "firstHalf" ? matchTurn + 1 : matchTurn - 5;
  const winner =
    score.p1 === score.p2 ? null : score.p1 > score.p2 ? ("p1" as const) : ("p2" as const);

  const phaseLabel = useMemo(() => {
    if (phase === "setup") return "赛前选队";
    if (phase === "prep") return `准备阶段 ${prepTurn + 1} / 5`;
    if (phase === "firstHalf") return `上半场 ${halfTurn} / 6`;
    if (phase === "halftime") return "中场休息";
    if (phase === "secondHalf") return `下半场 ${halfTurn} / 6`;
    return "全场结束";
  }, [phase, prepTurn, halfTurn]);

  function pushLog(entry: Omit<LogEntry, "id">) {
    setLogs((previous) => [{ ...entry, id: Date.now() + Math.random() }, ...previous].slice(0, 12));
  }

  function updateTeam(player: PlayerId, team: TeamId) {
    setTeams((previous) => {
      if (previous[otherPlayer(player)] === team) return previous;
      const next = { ...previous, [player]: team };
      setStats((oldStats) => ({ ...oldStats, [player]: copyStats(TEAM_DATA[team].stats) }));
      return next;
    });
  }

  function startGame() {
    const starter: PlayerId = Math.random() < 0.5 ? "p1" : "p2";
    const nextStats = {
      p1: copyStats(TEAM_DATA[teams.p1].stats),
      p2: copyStats(TEAM_DATA[teams.p2].stats),
    };
    setStats(nextStats);
    setDeck(createDeck());
    setPrepStarter(starter);
    setCurrent(starter);
    setPrepTurn(0);
    setMatchTurn(0);
    setScore({ p1: 0, p2: 0 });
    setAttacks({ p1: 0, p2: 0 });
    setDefenseActiveAt({ p1: null, p2: null });
    setBonusTurns(0);
    setDrawnCard(null);
    setLogs([]);
    setPhase("prep");
    setMessage(`${playerLabel(starter)} · ${TEAM_DATA[teams[starter]].name} 获得准备阶段先手。`);
    setFormula("点击球场中央的牌堆，抽取第一张牌");
    pushLog({
      title: `${TEAM_DATA[teams.p1].name} VS ${TEAM_DATA[teams.p2].name}`,
      detail: `${playerLabel(starter)}获得准备阶段先手，双方轮流完成五次抽牌。`,
      tone: "system",
    });
  }

  function drawCard() {
    if (drawnCard || deck.length === 0) return;
    const [card, ...rest] = deck;
    setDeck(rest);
    setDrawnCard(card);
    setBoostLeft(card.red ? 2 : 1);
    setSabotageLeft(card.red ? 0 : 1);
    setMessage(
      card.red
        ? `${playerLabel(current)}抽到红牌，可将 2 点自由分配给本队。`
        : `${playerLabel(current)}抽到黑牌：本队加 1 点，同时令对手任一能力减 1 点。`,
    );
    setFormula(card.red ? "红牌 = 本队 +2" : "黑牌 = 本队 +1 · 对手 −1");
  }

  function addPoint(player: PlayerId, key: StatKey, source: "prep" | "halftime") {
    const available = source === "prep" ? boostLeft : halftimePoints;
    if (available <= 0 || stats[player][key] >= 15) return;
    setStats((previous) => ({
      ...previous,
      [player]: { ...previous[player], [key]: previous[player][key] + 1 },
    }));
    if (source === "prep") setBoostLeft((value) => value - 1);
    else setHalftimePoints((value) => value - 1);
  }

  function subtractPoint(player: PlayerId, key: StatKey) {
    if (sabotageLeft <= 0 || stats[player][key] <= 0) return;
    setStats((previous) => ({
      ...previous,
      [player]: { ...previous[player], [key]: previous[player][key] - 1 },
    }));
    setSabotageLeft((value) => value - 1);
  }

  function confirmPrepCard() {
    if (!drawnCard || boostLeft > 0 || sabotageLeft > 0) return;
    pushLog({
      title: `${playerLabel(current)}完成能力调整`,
      detail: `${drawnCard.suit}${drawnCard.rank} 已结算；${TEAM_DATA[teams[current]].name}当前为攻 ${stats[current].attack} / 守 ${stats[current].defense} / 控 ${stats[current].control}。`,
      tone: current,
    });
    setDrawnCard(null);
    if (prepTurn === 4) {
      const starter: PlayerId = Math.random() < 0.5 ? "p1" : "p2";
      setFirstHalfStarter(starter);
      setCurrent(starter);
      setPhase("firstHalf");
      setMessage(`${playerLabel(starter)} · ${TEAM_DATA[teams[starter]].name} 获得上半场先手。`);
      setFormula("选择进攻、防守或控制");
      pushLog({
        title: "准备阶段结束",
        detail: `${playerLabel(starter)}获得上半场先手，六回合对决开始。`,
        tone: "system",
      });
      return;
    }
    const next = otherPlayer(current);
    setPrepTurn((value) => value + 1);
    setCurrent(next);
    setMessage(`轮到${playerLabel(next)} · ${TEAM_DATA[teams[next]].name}抽牌。`);
    setFormula(`准备阶段 ${prepTurn + 2} / 5`);
  }

  function finishMatchAction(
    controlAward = 0,
    scoreSnapshot: Record<PlayerId, number> = score,
    attacksSnapshot: Record<PlayerId, number> = attacks,
  ) {
    const nextTurn = matchTurn + 1;
    if (nextTurn === 6) {
      const first =
        scoreSnapshot.p1 !== scoreSnapshot.p2
          ? scoreSnapshot.p1 > scoreSnapshot.p2
            ? "p1"
            : "p2"
          : attacksSnapshot.p1 !== attacksSnapshot.p2
            ? attacksSnapshot.p1 > attacksSnapshot.p2
              ? "p1"
              : "p2"
            : firstHalfStarter;
      const order: PlayerId[] = [first, otherPlayer(first)];
      setMatchTurn(nextTurn);
      setHalftimeOrder(order);
      setHalftimeIndex(0);
      setHalftimePoints(3);
      setCurrent(first);
      setBonusTurns(0);
      setDefenseActiveAt({ p1: null, p2: null });
      setPhase("halftime");
      setMessage(`${playerLabel(first)}先分配 3 点中场能力值。`);
      setFormula("进球数优先 · 若相同则进攻次数优先");
      pushLog({
        title: `半场比分 ${scoreSnapshot.p1} : ${scoreSnapshot.p2}`,
        detail: `${playerLabel(first)}获得中场加点先手。双方各有 3 点。`,
        tone: "system",
      });
      return;
    }
    if (nextTurn >= 12) {
      setMatchTurn(nextTurn);
      setBonusTurns(0);
      setPhase("finished");
      const finalScore = { ...scoreSnapshot };
      const resultWinner =
        finalScore.p1 === finalScore.p2 ? null : finalScore.p1 > finalScore.p2 ? "p1" : "p2";
      setMessage(resultWinner ? `${playerLabel(resultWinner)}赢得世界杯风云！` : "双方战成平局。");
      setFormula(`全场比分 ${finalScore.p1} : ${finalScore.p2}`);
      pushLog({
        title: "全场比赛结束",
        detail: resultWinner
          ? `${TEAM_DATA[teams[resultWinner]].name}以 ${finalScore[resultWinner]} : ${finalScore[otherPlayer(resultWinner)]} 获胜。`
          : `双方以 ${finalScore.p1} : ${finalScore.p2} 战平。`,
        tone: "goal",
      });
      return;
    }

    setMatchTurn(nextTurn);
    if (controlAward > 0) {
      setBonusTurns(controlAward);
      setMessage(`${playerLabel(current)}获得连续两个行动回合，期间不能再次选择控制。`);
      setFormula("额外行动 1 / 2");
      return;
    }
    if (bonusTurns > 1) {
      setBonusTurns((value) => value - 1);
      setMessage(`${playerLabel(current)}继续额外行动。`);
      setFormula("额外行动 2 / 2");
      return;
    }
    setBonusTurns(0);
    const next = otherPlayer(current);
    setCurrent(next);
    setMessage(`轮到${playerLabel(next)} · ${TEAM_DATA[teams[next]].name}行动。`);
    setFormula("选择进攻、防守或控制");
  }

  function attack() {
    if (!isMatchPhase) return;
    const defender = otherPlayer(current);
    const defended = defenseActiveAt[defender] === matchTurn;
    const rawChance = stats[current].attack - stats[defender].defense / (defended ? 1 : 2);
    const chance = clampChance(rawChance);
    const goal = Math.random() < chance / 10;
    const nextScore = goal ? { ...score, [current]: score[current] + 1 } : score;
    const nextAttacks = { ...attacks, [current]: attacks[current] + 1 };
    setAttacks(nextAttacks);
    setDefenseActiveAt((previous) => ({ ...previous, [defender]: null }));
    if (goal) setScore(nextScore);
    const expression = defended
      ? `${stats[current].attack} − ${stats[defender].defense}`
      : `${stats[current].attack} − ${stats[defender].defense} ÷ 2`;
    setMessage(goal ? `进球！${TEAM_DATA[teams[current]].name}改写比分。` : "射门未能转化为进球。");
    setFormula(`${expression} = ${chance} · ${chance * 10}% 进球率`);
    pushLog({
      title: goal ? `${TEAM_DATA[teams[current]].name}进球` : `${TEAM_DATA[teams[current]].name}进攻未果`,
      detail: `${defended ? "对手上回合已防守，" : ""}${expression} = ${chance}，本次进球率 ${chance * 10}%。`,
      tone: goal ? "goal" : current,
    });
    setScore(nextScore);
    window.setTimeout(() => finishMatchAction(0, nextScore, nextAttacks), 260);
  }

  function defend() {
    if (!isMatchPhase) return;
    setDefenseActiveAt((previous) => ({ ...previous, [current]: matchTurn + 1 }));
    setMessage(`${TEAM_DATA[teams[current]].name}进入防守姿态。`);
    setFormula(`对手下一回合进攻时：进攻 − ${stats[current].defense}`);
    pushLog({
      title: `${TEAM_DATA[teams[current]].name}稳固防线`,
      detail: `若对手下一回合进攻，将使用“进攻 − 防守”计算，不再除以 2。`,
      tone: current,
    });
    window.setTimeout(() => finishMatchAction(), 260);
  }

  function control() {
    if (!isMatchPhase || bonusTurns > 0) return;
    const rival = otherPlayer(current);
    const chance = clampChance(stats[current].control - stats[rival].control);
    const success = Math.random() < chance / 10;
    setMessage(success ? `${TEAM_DATA[teams[current]].name}掌控节奏，赢得连续两个行动回合！` : "控制未成功，本回合直接结束。");
    setFormula(`${stats[current].control} − ${stats[rival].control} = ${chance} · ${chance * 10}% 成功率`);
    pushLog({
      title: success ? `${TEAM_DATA[teams[current]].name}掌控比赛` : `${TEAM_DATA[teams[current]].name}争夺控制失败`,
      detail: `控制差为 ${chance}，成功率 ${chance * 10}%。${success ? "获得连续两个行动回合。" : "本回合跳过。"}`,
      tone: current,
    });
    window.setTimeout(() => finishMatchAction(success ? 2 : 0), 260);
  }

  function confirmHalftime() {
    if (halftimePoints > 0) return;
    pushLog({
      title: `${playerLabel(current)}完成中场调整`,
      detail: `${TEAM_DATA[teams[current]].name}当前为攻 ${stats[current].attack} / 守 ${stats[current].defense} / 控 ${stats[current].control}。`,
      tone: current,
    });
    if (halftimeIndex === 0) {
      const next = halftimeOrder[1];
      setHalftimeIndex(1);
      setHalftimePoints(3);
      setCurrent(next);
      setMessage(`轮到${playerLabel(next)}分配 3 点中场能力值。`);
      return;
    }
    const lowerStarter = otherPlayer(firstHalfStarter);
    setCurrent(lowerStarter);
    setPhase("secondHalf");
    setMessage(`${playerLabel(lowerStarter)} · ${TEAM_DATA[teams[lowerStarter]].name}获得下半场先手。`);
    setFormula("上半场后手在下半场先行动");
    pushLog({
      title: "下半场开始",
      detail: `${playerLabel(lowerStarter)}作为上半场后手，获得下半场先手。`,
      tone: "system",
    });
  }

  function resetGame() {
    setPhase("setup");
    setTeams({ p1: "spain", p2: "france" });
    setStats(DEFAULT_STATS);
    setScore({ p1: 0, p2: 0 });
    setAttacks({ p1: 0, p2: 0 });
    setLogs([]);
    setDrawnCard(null);
    setMessage("双方选择球队后，由系统掷硬币决定准备阶段先手。");
    setFormula("17 回合 · 5 回合准备 · 12 回合对决");
  }

  function teamZone(player: PlayerId, position: "top" | "bottom") {
    const team = TEAM_DATA[teams[player]];
    const canAct = isMatchPhase && current === player;
    return (
      <section className={`team-zone ${position} ${player} ${canAct ? "active" : ""}`}>
        <div className="team-identity">
          <span className="team-badge">{team.code}</span>
          <div>
            <small>{playerLabel(player)}</small>
            <strong>{team.name}</strong>
          </div>
        </div>
        <div className="ability-strip" aria-label={`${team.name}能力值`}>
          {(Object.keys(STAT_META) as StatKey[]).map((key) => (
            <span key={key}>
              <small>{STAT_META[key].short}</small>
              <b>{stats[player][key]}</b>
            </span>
          ))}
        </div>
        <div className="action-row">
          <button className="attack-action" disabled={!canAct} onClick={attack}>
            <span>↗</span><b>进攻</b><small>概率进球</small>
          </button>
          <button className="defense-action" disabled={!canAct} onClick={defend}>
            <span>◆</span><b>防守</b><small>加强下回合</small>
          </button>
          <button className="control-action" disabled={!canAct || bonusTurns > 0} onClick={control}>
            <span>◎</span><b>控制</b><small>{bonusTurns > 0 ? "额外回合禁用" : "争取两回合"}</small>
          </button>
        </div>
      </section>
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#game">
          <span className="brand-mark magic-hat"><span>✦</span></span>
          <span>魔法帽游戏实验室</span>
        </a>
        <span className="issue-tag">双人游戏 · 第 04 期</span>
      </header>

      <section className="hero">
        <div className="hero-title-lockup">
          <p className="eyebrow"><span />WORLD CUP DUEL<span /></p>
          <h1><span>世</span><span>界</span><span>杯</span><span>风</span><span>云</span></h1>
        </div>
        <div className="hero-copy">
          <p className="hero-lead">一座球场，<em>三种选择</em>。</p>
          <p className="hero-description">
            从扑克牌增益到上下半场攻防，用进攻、防守与控制塑造十二回合的世界杯对决。
            每一个百分比都公开，每一个决定都由两位玩家亲手作出。
          </p>
          <div className="hero-tags"><span>本地 1V1</span><span>17 回合</span><span>概率攻防</span><span>扑克牌增益</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="sun-disc" />
          <div className="hero-ball">◆</div>
          <div className="tactics tactics-one">↗</div>
          <div className="tactics tactics-two">×</div>
          <div className="tactics tactics-three">○</div>
          <div className="goal-frame" />
        </div>
      </section>

      <section className="game-shell" id="game" aria-labelledby="game-title">
        <div className="shell-heading">
          <div>
            <span className="section-kicker">MATCH CENTRE / 01</span>
            <h2 id="game-title">世界杯风云 · 双人比赛中心</h2>
          </div>
          {phase !== "setup" && <button className="text-button" onClick={resetGame}>重新开赛</button>}
        </div>

        <div className={`stadium ${phase}`}>
          {teamZone("p1", "top")}

          <div className="football-pitch">
            <span className="touchline" />
            <span className="halfway-line" />
            <span className="centre-circle" />
            <span className="centre-dot" />
            <span className="penalty-box top-box" />
            <span className="penalty-box bottom-box" />
            <span className="goal top-goal" />
            <span className="goal bottom-goal" />
            <div className="scoreboard">
              <span>{TEAM_DATA[teams.p1].code}</span>
              <strong>{score.p1}<i>:</i>{score.p2}</strong>
              <span>{TEAM_DATA[teams.p2].code}</span>
            </div>

            {phase === "setup" && (
              <div className="pitch-panel setup-panel">
                <span className="panel-kicker">SELECT YOUR TEAMS</span>
                <h3>选择对阵球队</h3>
                <label>
                  <span>玩家一 · 上半场</span>
                  <select value={teams.p1} onChange={(event) => updateTeam("p1", event.target.value as TeamId)}>
                    {(Object.keys(TEAM_DATA) as TeamId[]).map((team) => (
                      <option key={team} value={team} disabled={teams.p2 === team}>
                        {TEAM_DATA[team].name} · 攻{TEAM_DATA[team].stats.attack} 守{TEAM_DATA[team].stats.defense} 控{TEAM_DATA[team].stats.control}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>玩家二 · 下半场</span>
                  <select value={teams.p2} onChange={(event) => updateTeam("p2", event.target.value as TeamId)}>
                    {(Object.keys(TEAM_DATA) as TeamId[]).map((team) => (
                      <option key={team} value={team} disabled={teams.p1 === team}>
                        {TEAM_DATA[team].name} · 攻{TEAM_DATA[team].stats.attack} 守{TEAM_DATA[team].stats.defense} 控{TEAM_DATA[team].stats.control}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary-button gold-button" onClick={startGame}>确认对阵 · 决定先手</button>
              </div>
            )}

            {phase === "prep" && (
              <div className="pitch-panel card-panel">
                <span className="panel-kicker">PRE-MATCH DRAW · {prepTurn + 1}/5</span>
                {!drawnCard ? (
                  <>
                    <div className="deck-stack" aria-hidden="true"><span>⚽</span></div>
                    <h3>{playerLabel(current)}抽牌</h3>
                    <p>{activeTeam.name} · 攻 {stats[current].attack} / 守 {stats[current].defense} / 控 {stats[current].control}</p>
                    <button className="primary-button gold-button" onClick={drawCard}>从牌堆抽一张</button>
                  </>
                ) : (
                  <>
                    <div className={`drawn-card ${drawnCard.red ? "red" : "black"}`}>
                      <b>{drawnCard.rank}</b><span>{drawnCard.suit}</span><small>{drawnCard.rank}</small>
                    </div>
                    <h3>{drawnCard.red ? "红牌 · 分配 2 点" : "黑牌 · 加 1 减 1"}</h3>
                    <div className="allocation-grid">
                      <div>
                        <small>{activeTeam.name}可加 {boostLeft} 点</small>
                        {(Object.keys(STAT_META) as StatKey[]).map((key) => (
                          <button key={key} disabled={boostLeft === 0 || stats[current][key] >= 15} onClick={() => addPoint(current, key, "prep")}>
                            {STAT_META[key].label} <b>{stats[current][key]}</b><span>＋</span>
                          </button>
                        ))}
                      </div>
                      {!drawnCard.red && (
                        <div>
                          <small>{TEAM_DATA[teams[opponent]].name}需减 {sabotageLeft} 点</small>
                          {(Object.keys(STAT_META) as StatKey[]).map((key) => (
                            <button key={key} disabled={sabotageLeft === 0 || stats[opponent][key] <= 0} onClick={() => subtractPoint(opponent, key)}>
                              {STAT_META[key].label} <b>{stats[opponent][key]}</b><span>−</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="primary-button gold-button" disabled={boostLeft > 0 || sabotageLeft > 0} onClick={confirmPrepCard}>
                      完成分配
                    </button>
                  </>
                )}
              </div>
            )}

            {isMatchPhase && (
              <div className="pitch-status" aria-live="polite">
                <span>{phaseLabel}</span>
                <strong>{message}</strong>
                <small>{formula}</small>
                <i className={`ball-marker ${current}`} aria-hidden="true">◆</i>
              </div>
            )}

            {phase === "halftime" && (
              <div className="pitch-panel halftime-panel">
                <span className="panel-kicker">HALF TIME · 03 POINTS</span>
                <h3>{playerLabel(current)}中场调整</h3>
                <p>{TEAM_DATA[teams[current]].name}还有 <b>{halftimePoints}</b> 点可分配，能力上限为 15。</p>
                <div className="halftime-abilities">
                  {(Object.keys(STAT_META) as StatKey[]).map((key) => (
                    <button key={key} disabled={halftimePoints === 0 || stats[current][key] >= 15} onClick={() => addPoint(current, key, "halftime")}>
                      <small>{STAT_META[key].label}</small><b>{stats[current][key]}</b><span>＋</span>
                    </button>
                  ))}
                </div>
                <button className="primary-button gold-button" disabled={halftimePoints > 0} onClick={confirmHalftime}>确认中场调整</button>
              </div>
            )}

            {phase === "finished" && (
              <div className="pitch-panel final-panel">
                <span className="panel-kicker">FULL TIME</span>
                <div className="cup-mark">♛</div>
                <h3>{winner ? `${TEAM_DATA[teams[winner]].name}获胜` : "握手言和"}</h3>
                <strong className="final-score">{score.p1} <i>:</i> {score.p2}</strong>
                <p>{winner ? `${playerLabel(winner)}赢得本场世界杯风云。` : "双方进球数相同，本场比赛为平局。"}</p>
                <button className="primary-button gold-button" onClick={resetGame}>再来一场</button>
              </div>
            )}
          </div>

          {teamZone("p2", "bottom")}
        </div>

        <div className="match-ribbon">
          <div><span>比赛阶段</span><b>{phaseLabel}</b></div>
          <div className="live-message"><span>场上播报</span><b>{message}</b><small>{formula}</small></div>
          <div><span>进攻次数</span><b>{attacks.p1} : {attacks.p2}</b></div>
        </div>

        <div className="battle-log">
          <div>
            <span className="section-kicker">MATCH REPORT</span>
            <h3>比赛记录</h3>
          </div>
          <div className="log-list">
            {logs.length === 0 ? (
              <p>选择球队并开赛后，这里会记录每次抽牌、行动与概率公式。</p>
            ) : logs.map((log) => (
              <article key={log.id} className={log.tone}>
                <span>{log.tone === "goal" ? "⚽" : log.tone === "system" ? "•" : log.tone === "p1" ? "1" : "2"}</span>
                <div><strong>{log.title}</strong><small>{log.detail}</small></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rules-section" id="rules">
        <div className="rules-heading">
          <div><span className="section-kicker">RULE BOOK / 17 ROUNDS</span><h2>从抽牌到终场哨</h2></div>
          <p>所有能力值始终限制在 0—15。概率公式的结果限制在 0—10，再换算为 0%—100%。</p>
        </div>
        <div className="formula-board">
          <article><span>↗</span><div><small>普通进攻</small><strong>进攻 − 防守 ÷ 2</strong><p>结果 × 10% = 本次进球率</p></div></article>
          <article><span>◆</span><div><small>防守后进攻</small><strong>进攻 − 防守</strong><p>仅影响对手紧接着的下一回合</p></div></article>
          <article><span>◎</span><div><small>争夺控制</small><strong>己方控制 − 对方控制</strong><p>成功可连续行动两回合，期间不能再控制</p></div></article>
        </div>
        <div className="rule-grid">
          <article><span>01</span><div><strong>五回合准备</strong><p>双方轮流抽牌。红牌给本队 2 点；黑牌给本队 1 点，并让对手任一能力减 1。</p></div></article>
          <article><span>02</span><div><strong>上半场六回合</strong><p>系统重新决定先手，双方依次从进攻、防守、控制中选择行动。</p></div></article>
          <article><span>03</span><div><strong>中场各加三点</strong><p>进球领先者先加；若比分相同，进攻次数更多者先加；仍相同则由上半场先手先加。</p></div></article>
          <article><span>04</span><div><strong>下半场六回合</strong><p>上半场后手改为下半场先手。终场时进球更多者获胜，相同则平局。</p></div></article>
        </div>
        <div className="team-table">
          {(Object.keys(TEAM_DATA) as TeamId[]).map((team) => (
            <div key={team}><b>{TEAM_DATA[team].code}</b><strong>{TEAM_DATA[team].name}</strong><span>攻 {TEAM_DATA[team].stats.attack}</span><span>守 {TEAM_DATA[team].stats.defense}</span><span>控 {TEAM_DATA[team].stats.control}</span></div>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>MAGIC HAT GAME LAB</span>
        <p>把规则变成一场看得见的比赛。</p>
      </footer>
    </main>
  );
}
