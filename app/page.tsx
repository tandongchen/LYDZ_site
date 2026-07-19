"use client";

import { useMemo, useState } from "react";

type PlayerId = "p1" | "p2";
type TeamId =
  | "argentina"
  | "spain"
  | "france"
  | "england"
  | "portugal"
  | "brazil"
  | "norway"
  | "belgium"
  | "colombia"
  | "morocco"
  | "netherlands"
  | "germany"
  | "switzerland"
  | "mexico"
  | "usa"
  | "ecuador"
  | "capeVerde"
  | "japan"
  | "ivoryCoast"
  | "senegal"
  | "egypt";
type StatKey = "attack" | "defense" | "control";
type Phase =
  | "setup"
  | "prep"
  | "firstHalf"
  | "halftime"
  | "secondHalf"
  | "extraFirstHalf"
  | "extraSecondHalf"
  | "penalties"
  | "suddenDeath"
  | "finished";

type Stats = Record<StatKey, number>;
type Score = Record<PlayerId, number>;
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
  argentina: { name: "阿根廷", code: "ARG", stats: { attack: 7, defense: 7, control: 8 } },
  spain: { name: "西班牙", code: "ESP", stats: { attack: 6, defense: 8, control: 8 } },
  france: { name: "法国", code: "FRA", stats: { attack: 8, defense: 6, control: 7 } },
  england: { name: "英格兰", code: "ENG", stats: { attack: 7, defense: 7, control: 7 } },
  portugal: { name: "葡萄牙", code: "POR", stats: { attack: 6, defense: 6, control: 7 } },
  brazil: { name: "巴西", code: "BRA", stats: { attack: 7, defense: 6, control: 6 } },
  norway: { name: "挪威", code: "NOR", stats: { attack: 6, defense: 7, control: 6 } },
  belgium: { name: "比利时", code: "BEL", stats: { attack: 7, defense: 6, control: 6 } },
  colombia: { name: "哥伦比亚", code: "COL", stats: { attack: 6, defense: 7, control: 6 } },
  morocco: { name: "摩洛哥", code: "MAR", stats: { attack: 7, defense: 6, control: 6 } },
  netherlands: { name: "荷兰", code: "NED", stats: { attack: 5, defense: 7, control: 7 } },
  germany: { name: "德国", code: "GER", stats: { attack: 6, defense: 6, control: 6 } },
  switzerland: { name: "瑞士", code: "SUI", stats: { attack: 6, defense: 7, control: 6 } },
  mexico: { name: "墨西哥", code: "MEX", stats: { attack: 7, defense: 5, control: 7 } },
  usa: { name: "美国", code: "USA", stats: { attack: 6, defense: 6, control: 7 } },
  ecuador: { name: "厄瓜多尔", code: "ECU", stats: { attack: 4, defense: 7, control: 6 } },
  capeVerde: { name: "佛得角", code: "CPV", stats: { attack: 4, defense: 8, control: 5 } },
  japan: { name: "日本", code: "JPN", stats: { attack: 6, defense: 4, control: 7 } },
  ivoryCoast: { name: "科特迪瓦", code: "CIV", stats: { attack: 6, defense: 5, control: 6 } },
  senegal: { name: "塞内加尔", code: "SEN", stats: { attack: 7, defense: 5, control: 5 } },
  egypt: { name: "埃及", code: "EGY", stats: { attack: 6, defense: 5, control: 6 } },
};

const TEAM_TIERS: Array<{ label: string; note: string; teams: TeamId[] }> = [
  { label: "一档", note: "冠军争夺者", teams: ["argentina", "spain", "france", "england"] },
  {
    label: "二档",
    note: "劲旅挑战者",
    teams: [
      "portugal",
      "brazil",
      "norway",
      "belgium",
      "colombia",
      "morocco",
      "netherlands",
      "germany",
      "switzerland",
      "mexico",
      "usa",
    ],
  },
  {
    label: "三档",
    note: "黑马突围者",
    teams: ["ecuador", "capeVerde", "japan", "ivoryCoast", "senegal", "egypt"],
  },
];

const STAT_META: Record<StatKey, { label: string; short: string }> = {
  attack: { label: "进攻", short: "攻" },
  defense: { label: "防守", short: "守" },
  control: { label: "控制", short: "控" },
};

const DEFAULT_STATS: Record<PlayerId, Stats> = {
  p1: { attack: 6, defense: 8, control: 8 },
  p2: { attack: 8, defense: 6, control: 7 },
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

function formatChance(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatPercent(value: number) {
  const percent = value * 10;
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1).replace(/\.0$/, "");
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

function isOpenPlayPhase(phase: Phase) {
  return (
    phase === "firstHalf" ||
    phase === "secondHalf" ||
    phase === "extraFirstHalf" ||
    phase === "extraSecondHalf"
  );
}

function isPenaltyPhase(phase: Phase) {
  return phase === "penalties" || phase === "suddenDeath";
}

export default function WorldCupGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [teams, setTeams] = useState<Record<PlayerId, TeamId>>({ p1: "spain", p2: "france" });
  const [stats, setStats] = useState<Record<PlayerId, Stats>>(DEFAULT_STATS);
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [current, setCurrent] = useState<PlayerId>("p1");
  const [firstHalfStarter, setFirstHalfStarter] = useState<PlayerId>("p1");
  const [extraStarter, setExtraStarter] = useState<PlayerId>("p1");
  const [penaltyStarter, setPenaltyStarter] = useState<PlayerId>("p1");
  const [prepAction, setPrepAction] = useState(0);
  const [roundInPhase, setRoundInPhase] = useState(0);
  const [roundSlot, setRoundSlot] = useState<0 | 1>(0);
  const [drawnCard, setDrawnCard] = useState<PlayingCard | null>(null);
  const [boostLeft, setBoostLeft] = useState(0);
  const [sabotageLeft, setSabotageLeft] = useState(0);
  const [score, setScore] = useState<Score>({ p1: 0, p2: 0 });
  const [penaltyScore, setPenaltyScore] = useState<Score>({ p1: 0, p2: 0 });
  const [attacks, setAttacks] = useState<Score>({ p1: 0, p2: 0 });
  const [defenseReady, setDefenseReady] = useState<Record<PlayerId, boolean>>({
    p1: false,
    p2: false,
  });
  const [bonusTurns, setBonusTurns] = useState(0);
  const [halftimeOrder, setHalftimeOrder] = useState<PlayerId[]>(["p1", "p2"]);
  const [halftimeIndex, setHalftimeIndex] = useState(0);
  const [halftimePoints, setHalftimePoints] = useState(3);
  const [winnerPlayer, setWinnerPlayer] = useState<PlayerId | null>(null);
  const [decidedByPenalties, setDecidedByPenalties] = useState(false);
  const [actionLocked, setActionLocked] = useState(false);
  const [message, setMessage] = useState("双方选择球队后，由系统掷硬币决定准备阶段先手。");
  const [formula, setFormula] = useState("五回合准备 · 常规比赛十二回合");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [goalEffect, setGoalEffect] = useState<{ id: number; scorer: PlayerId } | null>(null);

  const activeTeam = TEAM_DATA[teams[current]];
  const opponent = otherPlayer(current);
  const openPlay = isOpenPlayPhase(phase);
  const penaltyPlay = isPenaltyPhase(phase);
  const actionPhase = openPlay || penaltyPlay;
  const prepRound = Math.floor(prepAction / 2) + 1;
  const prepSlot = (prepAction % 2) + 1;
  const showPenaltyScore = penaltyPlay || decidedByPenalties;

  const phaseLabel = useMemo(() => {
    if (phase === "setup") return "赛前选队";
    if (phase === "prep") return `准备阶段 ${prepRound} / 5 · 抽牌 ${prepSlot} / 2`;
    if (phase === "firstHalf") return `上半场 ${roundInPhase + 1} / 6 · 行动 ${roundSlot + 1} / 2`;
    if (phase === "halftime") return "中场休息";
    if (phase === "secondHalf") return `下半场 ${roundInPhase + 1} / 6 · 行动 ${roundSlot + 1} / 2`;
    if (phase === "extraFirstHalf") return `加时上半场 ${roundInPhase + 1} / 3 · 行动 ${roundSlot + 1} / 2`;
    if (phase === "extraSecondHalf") return `加时下半场 ${roundInPhase + 1} / 3 · 行动 ${roundSlot + 1} / 2`;
    if (phase === "penalties") return `点球大战 ${roundInPhase + 1} / 5 · 点球 ${roundSlot + 1} / 2`;
    if (phase === "suddenDeath") return `点球突然死亡 第 ${roundInPhase + 1} 回合 · 点球 ${roundSlot + 1} / 2`;
    return decidedByPenalties ? "点球大战结束" : "全场结束";
  }, [phase, prepRound, prepSlot, roundInPhase, roundSlot, decidedByPenalties]);

  function pushLog(entry: Omit<LogEntry, "id">) {
    setLogs((previous) => [{ ...entry, id: Date.now() + Math.random() }, ...previous].slice(0, 16));
  }

  function triggerGoalEffect(scorer: PlayerId) {
    const id = Date.now();
    setGoalEffect({ id, scorer });
    window.setTimeout(() => {
      setGoalEffect((active) => (active?.id === id ? null : active));
    }, 1250);
  }

  function updateTeam(player: PlayerId, team: TeamId) {
    setTeams((previous) => {
      if (previous[otherPlayer(player)] === team) return previous;
      setStats((oldStats) => ({ ...oldStats, [player]: copyStats(TEAM_DATA[team].stats) }));
      return { ...previous, [player]: team };
    });
  }

  function starterForPhase(targetPhase: Phase): PlayerId {
    if (targetPhase === "firstHalf") return firstHalfStarter;
    if (targetPhase === "secondHalf") return otherPlayer(firstHalfStarter);
    if (targetPhase === "extraFirstHalf") return extraStarter;
    if (targetPhase === "extraSecondHalf") return otherPlayer(extraStarter);
    return penaltyStarter;
  }

  function beginActionPhase(targetPhase: Phase, starter: PlayerId, text: string) {
    setPhase(targetPhase);
    setCurrent(starter);
    setRoundInPhase(0);
    setRoundSlot(0);
    setBonusTurns(0);
    setDefenseReady({ p1: false, p2: false });
    setActionLocked(false);
    setMessage(text);
    setFormula(isPenaltyPhase(targetPhase) ? "进攻 − 对方防守 ÷ 2" : "双方各行动一次才完成一回合");
  }

  function startGame() {
    const prepStarter: PlayerId = Math.random() < 0.5 ? "p1" : "p2";
    setStats({
      p1: copyStats(TEAM_DATA[teams.p1].stats),
      p2: copyStats(TEAM_DATA[teams.p2].stats),
    });
    setDeck(createDeck());
    setCurrent(prepStarter);
    setPrepAction(0);
    setRoundInPhase(0);
    setRoundSlot(0);
    setScore({ p1: 0, p2: 0 });
    setPenaltyScore({ p1: 0, p2: 0 });
    setAttacks({ p1: 0, p2: 0 });
    setDefenseReady({ p1: false, p2: false });
    setBonusTurns(0);
    setDrawnCard(null);
    setWinnerPlayer(null);
    setDecidedByPenalties(false);
    setActionLocked(false);
    setLogs([]);
    setGoalEffect(null);
    setPhase("prep");
    setMessage(`${playerLabel(prepStarter)} · ${TEAM_DATA[teams[prepStarter]].name} 获得准备阶段先手。`);
    setFormula("每个准备回合双方各抽一张牌");
    pushLog({
      title: `${TEAM_DATA[teams.p1].name} VS ${TEAM_DATA[teams.p2].name}`,
      detail: `${playerLabel(prepStarter)}获得准备阶段先手，双方将在五个回合中各抽五张牌。`,
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
    if (prepAction === 9) {
      const starter: PlayerId = Math.random() < 0.5 ? "p1" : "p2";
      setFirstHalfStarter(starter);
      beginActionPhase(
        "firstHalf",
        starter,
        `${playerLabel(starter)} · ${TEAM_DATA[teams[starter]].name}获得上半场先手。`,
      );
      pushLog({
        title: "准备阶段结束",
        detail: `${playerLabel(starter)}获得上半场先手。每回合双方各行动一次，上半场共六回合。`,
        tone: "system",
      });
      return;
    }
    const next = otherPlayer(current);
    const nextAction = prepAction + 1;
    setPrepAction(nextAction);
    setCurrent(next);
    setMessage(`准备阶段第 ${Math.floor(nextAction / 2) + 1} 回合，轮到${playerLabel(next)}抽牌。`);
    setFormula(`本回合抽牌 ${(nextAction % 2) + 1} / 2`);
  }

  function finishGame(
    scoreSnapshot: Score,
    penaltySnapshot: Score,
    byPenalties: boolean,
  ) {
    const source = byPenalties ? penaltySnapshot : scoreSnapshot;
    const resultWinner: PlayerId = source.p1 > source.p2 ? "p1" : "p2";
    setScore(scoreSnapshot);
    setPenaltyScore(penaltySnapshot);
    setWinnerPlayer(resultWinner);
    setDecidedByPenalties(byPenalties);
    setBonusTurns(0);
    setActionLocked(false);
    setPhase("finished");
    setMessage(`${playerLabel(resultWinner)} · ${TEAM_DATA[teams[resultWinner]].name}赢得世界杯风云！`);
    setFormula(
      byPenalties
        ? `比赛 ${scoreSnapshot.p1} : ${scoreSnapshot.p2} · 点球 ${penaltySnapshot.p1} : ${penaltySnapshot.p2}`
        : `全场比分 ${scoreSnapshot.p1} : ${scoreSnapshot.p2}`,
    );
    pushLog({
      title: byPenalties ? "点球大战结束" : "全场比赛结束",
      detail: byPenalties
        ? `${TEAM_DATA[teams[resultWinner]].name}在点球大战中以 ${penaltySnapshot[resultWinner]} : ${penaltySnapshot[otherPlayer(resultWinner)]} 获胜。`
        : `${TEAM_DATA[teams[resultWinner]].name}以 ${scoreSnapshot[resultWinner]} : ${scoreSnapshot[otherPlayer(resultWinner)]} 获胜。`,
      tone: "goal",
    });
  }

  function startExtraTime(scoreSnapshot: Score) {
    const starter: PlayerId = Math.random() < 0.5 ? "p1" : "p2";
    setExtraStarter(starter);
    beginActionPhase(
      "extraFirstHalf",
      starter,
      `常规时间战平，${playerLabel(starter)}获得加时赛上半场先手。`,
    );
    setFormula("加时赛上下半场各三个完整回合");
    pushLog({
      title: `常规时间战平 ${scoreSnapshot.p1} : ${scoreSnapshot.p2}`,
      detail: "进入加时赛。上下半场各三个回合，每回合双方各行动一次。",
      tone: "system",
    });
  }

  function startPenaltyShootout(scoreSnapshot: Score) {
    const starter: PlayerId = Math.random() < 0.5 ? "p1" : "p2";
    setPenaltyStarter(starter);
    setPenaltyScore({ p1: 0, p2: 0 });
    beginActionPhase(
      "penalties",
      starter,
      `加时赛仍然战平，${playerLabel(starter)}先罚点球。`,
    );
    setFormula("点球进球率 = 进攻 − 对方防守 ÷ 2");
    pushLog({
      title: `加时赛战平 ${scoreSnapshot.p1} : ${scoreSnapshot.p2}`,
      detail: "进入五回合点球大战，点球比分单独计算。",
      tone: "system",
    });
  }

  function enterHalftime(scoreSnapshot: Score, attacksSnapshot: Score) {
    const first: PlayerId =
      scoreSnapshot.p1 !== scoreSnapshot.p2
        ? scoreSnapshot.p1 > scoreSnapshot.p2
          ? "p1"
          : "p2"
        : attacksSnapshot.p1 !== attacksSnapshot.p2
          ? attacksSnapshot.p1 > attacksSnapshot.p2
            ? "p1"
            : "p2"
          : firstHalfStarter;
    setHalftimeOrder([first, otherPlayer(first)]);
    setHalftimeIndex(0);
    setHalftimePoints(3);
    setCurrent(first);
    setBonusTurns(0);
    setDefenseReady({ p1: false, p2: false });
    setActionLocked(false);
    setPhase("halftime");
    setMessage(`${playerLabel(first)}先分配 3 点中场能力值。`);
    setFormula("进球数优先 · 若相同则进攻次数优先");
    pushLog({
      title: `半场比分 ${scoreSnapshot.p1} : ${scoreSnapshot.p2}`,
      detail: `${playerLabel(first)}获得中场加点先手，双方各有 3 点。`,
      tone: "system",
    });
  }

  function handleCompletedRound(
    completedRounds: number,
    scoreSnapshot: Score,
    attacksSnapshot: Score,
    penaltySnapshot: Score,
  ) {
    if (phase === "firstHalf" && completedRounds === 6) {
      enterHalftime(scoreSnapshot, attacksSnapshot);
      return;
    }
    if (phase === "secondHalf" && completedRounds === 6) {
      if (scoreSnapshot.p1 === scoreSnapshot.p2) startExtraTime(scoreSnapshot);
      else finishGame(scoreSnapshot, penaltySnapshot, false);
      return;
    }
    if (phase === "extraFirstHalf" && completedRounds === 3) {
      const starter = otherPlayer(extraStarter);
      beginActionPhase(
        "extraSecondHalf",
        starter,
        `加时赛易边，${playerLabel(starter)}获得加时下半场先手。`,
      );
      pushLog({
        title: `加时半场 ${scoreSnapshot.p1} : ${scoreSnapshot.p2}`,
        detail: `${playerLabel(starter)}作为加时上半场后手，在加时下半场先行动。`,
        tone: "system",
      });
      return;
    }
    if (phase === "extraSecondHalf" && completedRounds === 3) {
      if (scoreSnapshot.p1 === scoreSnapshot.p2) startPenaltyShootout(scoreSnapshot);
      else finishGame(scoreSnapshot, penaltySnapshot, false);
      return;
    }
    if (phase === "penalties" && completedRounds === 5) {
      if (penaltySnapshot.p1 !== penaltySnapshot.p2) {
        finishGame(scoreSnapshot, penaltySnapshot, true);
      } else {
        beginActionPhase(
          "suddenDeath",
          penaltyStarter,
          "五回合点球仍然战平，进入突然死亡。",
        );
        setFormula("双方各罚一球；一方进球而另一方未进球，比赛立即结束");
        pushLog({
          title: `五轮点球战平 ${penaltySnapshot.p1} : ${penaltySnapshot.p2}`,
          detail: "进入点球突然死亡，每个完整回合后比较点球比分。",
          tone: "system",
        });
      }
      return;
    }
    if (phase === "suddenDeath" && penaltySnapshot.p1 !== penaltySnapshot.p2) {
      finishGame(scoreSnapshot, penaltySnapshot, true);
      return;
    }

    setRoundInPhase(completedRounds);
    setRoundSlot(0);
    const starter = starterForPhase(phase);
    setCurrent(starter);
    setActionLocked(false);
    setMessage(`${phase === "suddenDeath" ? "突然死亡" : "下一"}回合开始，${playerLabel(starter)}先行动。`);
    setFormula(penaltyPlay ? "点球进球率 = 进攻 − 对方防守 ÷ 2" : "双方各行动一次才完成一回合");
  }

  function advanceScheduledAction(
    scoreSnapshot: Score,
    attacksSnapshot: Score,
    penaltySnapshot: Score,
  ) {
    if (roundSlot === 0) {
      const next = otherPlayer(current);
      setRoundSlot(1);
      setCurrent(next);
      setActionLocked(false);
      setMessage(`本回合还未结束，轮到${playerLabel(next)}行动。`);
      setFormula(`本回合行动 2 / 2`);
      return;
    }
    handleCompletedRound(roundInPhase + 1, scoreSnapshot, attacksSnapshot, penaltySnapshot);
  }

  function finishAction(
    controlAward = 0,
    scoreSnapshot: Score = score,
    attacksSnapshot: Score = attacks,
    penaltySnapshot: Score = penaltyScore,
  ) {
    setDefenseReady((previous) => ({ ...previous, [otherPlayer(current)]: false }));
    if (controlAward > 0) {
      setBonusTurns(controlAward);
      setActionLocked(false);
      setMessage(`${playerLabel(current)}获得两次额外行动，期间不能再次选择控制。`);
      setFormula("额外行动 1 / 2 · 不占用双方的正常行动位置");
      return;
    }
    if (bonusTurns > 1) {
      setBonusTurns((value) => value - 1);
      setActionLocked(false);
      setMessage(`${playerLabel(current)}继续第二次额外行动。`);
      setFormula("额外行动 2 / 2 · 控制按钮仍然禁用");
      return;
    }
    if (bonusTurns === 1) setBonusTurns(0);
    advanceScheduledAction(scoreSnapshot, attacksSnapshot, penaltySnapshot);
  }

  function attack() {
    if (!actionPhase || actionLocked) return;
    setActionLocked(true);
    const defender = otherPlayer(current);

    if (penaltyPlay) {
      const rawChance = stats[current].attack - stats[defender].defense / 2;
      const chance = clampChance(rawChance);
      const chanceText = formatChance(chance);
      const percentText = formatPercent(chance);
      const goal = Math.random() < chance / 10;
      if (goal) triggerGoalEffect(current);
      const nextPenaltyScore = goal
        ? { ...penaltyScore, [current]: penaltyScore[current] + 1 }
        : penaltyScore;
      setPenaltyScore(nextPenaltyScore);
      const expression = `${stats[current].attack} − ${stats[defender].defense} ÷ 2`;
      setMessage(goal ? `${TEAM_DATA[teams[current]].name}点球命中！` : `${TEAM_DATA[teams[current]].name}罚失点球。`);
      setFormula(`${expression} = ${chanceText} · ${percentText}% 进球率`);
      pushLog({
        title: goal ? `${TEAM_DATA[teams[current]].name}点球命中` : `${TEAM_DATA[teams[current]].name}点球未进`,
        detail: `${expression} = ${chanceText}，本次点球进球率 ${percentText}%。`,
        tone: goal ? "goal" : current,
      });
      window.setTimeout(() => finishAction(0, score, attacks, nextPenaltyScore), 260);
      return;
    }

    const defended = defenseReady[defender];
    const rawChance = stats[current].attack - stats[defender].defense / (defended ? 1 : 1.5);
    const chance = clampChance(rawChance);
    const chanceText = formatChance(chance);
    const percentText = formatPercent(chance);
    const goal = Math.random() < chance / 10;
    if (goal) triggerGoalEffect(current);
    const nextScore = goal ? { ...score, [current]: score[current] + 1 } : score;
    const nextAttacks = { ...attacks, [current]: attacks[current] + 1 };
    setScore(nextScore);
    setAttacks(nextAttacks);
    setDefenseReady((previous) => ({ ...previous, [defender]: false }));
    const expression = defended
      ? `${stats[current].attack} − ${stats[defender].defense}`
      : `${stats[current].attack} − ${stats[defender].defense} ÷ 1.5`;
    setMessage(goal ? `进球！${TEAM_DATA[teams[current]].name}改写比分。` : "射门未能转化为进球。");
    setFormula(`${expression} = ${chanceText} · ${percentText}% 进球率`);
    pushLog({
      title: goal ? `${TEAM_DATA[teams[current]].name}进球` : `${TEAM_DATA[teams[current]].name}进攻未果`,
      detail: `${defended ? "对手此前已防守，" : ""}${expression} = ${chanceText}，本次进球率 ${percentText}%。`,
      tone: goal ? "goal" : current,
    });
    window.setTimeout(() => finishAction(0, nextScore, nextAttacks, penaltyScore), 260);
  }

  function defend() {
    if (!openPlay || actionLocked) return;
    setActionLocked(true);
    setDefenseReady((previous) => ({ ...previous, [current]: true }));
    setMessage(`${TEAM_DATA[teams[current]].name}进入防守姿态。`);
    setFormula(`对手下一次进攻时：进攻 − ${stats[current].defense}`);
    pushLog({
      title: `${TEAM_DATA[teams[current]].name}稳固防线`,
      detail: "若对手下一次行动选择进攻，将使用“进攻 − 防守”计算，不再除以 2。",
      tone: current,
    });
    window.setTimeout(() => finishAction(), 260);
  }

  function control() {
    if (!openPlay || bonusTurns > 0 || actionLocked) return;
    setActionLocked(true);
    const rival = otherPlayer(current);
    const chance = clampChance(stats[current].control - stats[rival].control / 2);
    const chanceText = formatChance(chance);
    const percentText = formatPercent(chance);
    const success = Math.random() < chance / 10;
    setMessage(success ? `${TEAM_DATA[teams[current]].name}掌控节奏，赢得两次额外行动！` : "控制未成功，本次行动直接结束。");
    setFormula(`${stats[current].control} − ${stats[rival].control} ÷ 2 = ${chanceText} · ${percentText}% 成功率`);
    pushLog({
      title: success ? `${TEAM_DATA[teams[current]].name}掌控比赛` : `${TEAM_DATA[teams[current]].name}争夺控制失败`,
      detail: `控制公式结果为 ${chanceText}，成功率 ${percentText}%。${success ? "获得两次额外行动。" : "本次行动跳过。"}`,
      tone: current,
    });
    window.setTimeout(() => finishAction(success ? 2 : 0), 260);
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
    beginActionPhase(
      "secondHalf",
      lowerStarter,
      `${playerLabel(lowerStarter)} · ${TEAM_DATA[teams[lowerStarter]].name}获得下半场先手。`,
    );
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
    setPenaltyScore({ p1: 0, p2: 0 });
    setAttacks({ p1: 0, p2: 0 });
    setLogs([]);
    setDrawnCard(null);
    setWinnerPlayer(null);
    setDecidedByPenalties(false);
    setActionLocked(false);
    setGoalEffect(null);
    setMessage("双方选择球队后，由系统掷硬币决定准备阶段先手。");
    setFormula("五回合准备 · 常规比赛十二回合");
  }

  function teamZone(player: PlayerId, position: "top" | "bottom") {
    const team = TEAM_DATA[teams[player]];
    const canAct = actionPhase && current === player && !actionLocked;
    return (
      <section className={`team-zone ${position} ${player} ${canAct ? "active" : ""}`}>
        <div className="team-identity">
          <span className="team-badge">{team.code}</span>
          <div>
            <small>{playerLabel(player)}</small>
            <strong>{team.name}</strong>
            {openPlay && defenseReady[player] && <em className="defense-ready-chip">防守待生效</em>}
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
            <span>↗</span><b>进攻</b><small>{penaltyPlay ? "点球射门" : "概率进球"}</small>
          </button>
          <button className="defense-action" disabled={!canAct || penaltyPlay} onClick={defend}>
            <span>◆</span><b>防守</b><small>{penaltyPlay ? "点球阶段禁用" : "加强下次防守"}</small>
          </button>
          <button className="control-action" disabled={!canAct || penaltyPlay || bonusTurns > 0} onClick={control}>
            <span>◎</span><b>控制</b><small>{penaltyPlay ? "点球阶段禁用" : bonusTurns > 0 ? "额外行动禁用" : "争取两次行动"}</small>
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
          <span>魔法数学</span>
        </a>
        <span className="issue-tag">双人博弈</span>
      </header>

      <section className="hero">
        <div className="hero-title-lockup">
          <p className="eyebrow"><span />WORLD CUP DUEL<span /></p>
          <h1><span>世</span><span>界</span><span>杯</span><span>风</span><span>云</span></h1>
        </div>
        <div className="hero-copy">
          <p className="hero-lead">一座球场，<em>三种选择</em>。</p>
          <p className="hero-description">
            从扑克牌增益到上下半场攻防，用进攻、防守与控制塑造一场充满变数的世界杯对决。
            每一个百分比都公开，每一个决定都由两位玩家亲手作出。
          </p>
          <div className="hero-tags"><span>本地 1V1</span><span>概率攻防</span></div>
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

          <div className="scoreboard-rail" aria-label="比赛比分">
            <div className="scoreboard">
              <span>{TEAM_DATA[teams.p1].code}</span>
              <strong>{score.p1}<i>:</i>{score.p2}</strong>
              <span>{TEAM_DATA[teams.p2].code}</span>
            </div>
            {showPenaltyScore && (
              <div className="penalty-scoreboard">
                <span>点球</span><strong>{penaltyScore.p1}<i>:</i>{penaltyScore.p2}</strong>
              </div>
            )}
          </div>

          <div className="football-pitch">
            <span className="touchline" />
            <span className="halfway-line" />
            <span className="centre-circle" />
            <span className="centre-dot" />
            <span className="penalty-box top-box" />
            <span className="penalty-box bottom-box" />
            <span className="goal-box top-goal-box" />
            <span className="goal-box bottom-goal-box" />
            <span className="goal top-goal" />
            <span className="goal bottom-goal" />
            {goalEffect && (
              <div key={goalEffect.id} className={`goal-effect ${goalEffect.scorer}`} aria-live="polite">
                <span className="goal-shot-ball" aria-hidden="true">⚽</span>
                <span className="goal-net-impact" aria-hidden="true" />
                <strong>GOAL!</strong>
              </div>
            )}

            {phase === "setup" && (
              <div className="pitch-panel setup-panel">
                <span className="panel-kicker">SELECT YOUR TEAMS</span>
                <h3>选择对阵球队</h3>
                <label>
                  <span>玩家一 · 球场上方</span>
                  <select value={teams.p1} onChange={(event) => updateTeam("p1", event.target.value as TeamId)}>
                    {TEAM_TIERS.map((tier) => (
                      <optgroup key={tier.label} label={`${tier.label} · ${tier.note}`}>
                        {tier.teams.map((team) => (
                          <option key={team} value={team} disabled={teams.p2 === team}>
                            {TEAM_DATA[team].name} · 攻{TEAM_DATA[team].stats.attack} 守{TEAM_DATA[team].stats.defense} 控{TEAM_DATA[team].stats.control}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label>
                  <span>玩家二 · 球场下方</span>
                  <select value={teams.p2} onChange={(event) => updateTeam("p2", event.target.value as TeamId)}>
                    {TEAM_TIERS.map((tier) => (
                      <optgroup key={tier.label} label={`${tier.label} · ${tier.note}`}>
                        {tier.teams.map((team) => (
                          <option key={team} value={team} disabled={teams.p1 === team}>
                            {TEAM_DATA[team].name} · 攻{TEAM_DATA[team].stats.attack} 守{TEAM_DATA[team].stats.defense} 控{TEAM_DATA[team].stats.control}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <button className="primary-button gold-button" onClick={startGame}>确认对阵 · 决定先手</button>
              </div>
            )}

            {phase === "prep" && (
              <div className="pitch-panel card-panel">
                <span className="panel-kicker">PRE-MATCH DRAW · {prepRound}/5 · {prepSlot}/2</span>
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
                    <button className="primary-button gold-button" disabled={boostLeft > 0 || sabotageLeft > 0} onClick={confirmPrepCard}>完成分配</button>
                  </>
                )}
              </div>
            )}

            {actionPhase && (
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

            {phase === "finished" && winnerPlayer && (
              <div className="pitch-panel final-panel">
                <span className="panel-kicker">{decidedByPenalties ? "PENALTY RESULT" : "FULL TIME"}</span>
                <div className="cup-mark">♛</div>
                <h3>{TEAM_DATA[teams[winnerPlayer]].name}获胜</h3>
                <strong className="final-score">{score.p1} <i>:</i> {score.p2}</strong>
                {decidedByPenalties && <strong className="final-penalty-score">点球 {penaltyScore.p1} : {penaltyScore.p2}</strong>}
                <p>{playerLabel(winnerPlayer)}赢得本场世界杯风云。</p>
                <button className="primary-button gold-button" onClick={resetGame}>再来一场</button>
              </div>
            )}
          </div>

          {teamZone("p2", "bottom")}
        </div>

        <div className="match-ribbon">
          <div><span>比赛阶段</span><b>{phaseLabel}</b></div>
          <div className="live-message"><span>场上播报</span><b>{message}</b><small>{formula}</small></div>
          <div><span>{penaltyPlay ? "点球比分" : "进攻次数"}</span><b>{penaltyPlay ? `${penaltyScore.p1} : ${penaltyScore.p2}` : `${attacks.p1} : ${attacks.p2}`}</b></div>
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
          <div><span className="section-kicker">RULE BOOK / FULL MATCH</span><h2>从抽牌到点球决胜</h2></div>
          <p>一个回合必须由双方各完成一次行动。所有能力值限制在 0—15，概率公式结果限制在 0—10。</p>
        </div>
        <div className="formula-board">
          <article><span>↗</span><div><small>普通进攻</small><strong>进攻 − 防守 ÷ 1.5</strong><p>结果 × 10% = 本次进球率</p></div></article>
          <article><span>◆</span><div><small>防守后进攻</small><strong>进攻 − 防守</strong><p>防守令对方下一次进攻不再除以 2</p></div></article>
          <article><span>◎</span><div><small>争夺控制</small><strong>控制 − 对方控制 ÷ 2</strong><p>成功得到两次额外行动，期间不能再控制</p></div></article>
          <article><span>●</span><div><small>点球大战</small><strong>进攻 − 防守 ÷ 2</strong><p>点球比分独立于常规及加时赛比分</p></div></article>
        </div>
        <div className="rule-grid">
          <article><span>01</span><div><strong>五回合准备</strong><p>每回合双方各抽一张牌。红牌为本队加 2；黑牌为本队加 1，并令对手任一能力减 1。</p></div></article>
          <article><span>02</span><div><strong>上下半场各六回合</strong><p>每回合双方各行动一次；上半场后手在下半场先行动。</p></div></article>
          <article><span>03</span><div><strong>中场各加三点</strong><p>领先者先加；比分相同则进攻次数更多者先加；仍相同则上半场先手先加。</p></div></article>
          <article><span>04</span><div><strong>加时赛六回合</strong><p>常规时间战平后进入加时赛，上下半场各三个完整回合。</p></div></article>
          <article><span>05</span><div><strong>五轮点球大战</strong><p>加时仍平则双方各罚五球，只能选择进攻，并在主比分下方独立计分。</p></div></article>
          <article><span>06</span><div><strong>点球突然死亡</strong><p>五轮后仍平，每回合双方各罚一球；一方进球而另一方未进球时立即决出胜负。</p></div></article>
        </div>
        <div className="team-catalog">
          {TEAM_TIERS.map((tier) => (
            <section className="team-tier" key={tier.label}>
              <header><strong>{tier.label}</strong><span>{tier.note}</span></header>
              <div className="team-table">
                {tier.teams.map((team) => (
                  <div key={team}><b>{TEAM_DATA[team].code}</b><strong>{TEAM_DATA[team].name}</strong><span>攻 {TEAM_DATA[team].stats.attack}</span><span>守 {TEAM_DATA[team].stats.defense}</span><span>控 {TEAM_DATA[team].stats.control}</span></div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>MAGIC MATH</span>
        <p>把规则变成一场看得见的比赛。</p>
      </footer>
    </main>
  );
}
