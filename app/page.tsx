"use client";

import { useEffect, useMemo, useState } from "react";

type Suit = "heart" | "diamond" | "spade" | "club" | "joker";
type Faction = "chu" | "han";
type Actor = "player" | "ai";
type Phase = "setup" | "rps" | "playing" | "finished";
type Gesture = "rock" | "scissors" | "paper";

type Card = {
  id: string;
  rank: string;
  suit: Suit;
  symbol: string;
  red: boolean;
  value: number;
};

type Formation = {
  level: number;
  name: string;
  sum: number;
};

type Battlefield = {
  id: number;
  marker: Card;
  troops: Record<Actor, Card[]>;
  completedAt: Partial<Record<Actor, number>>;
  winner: Actor | null;
};

type BattleLog = {
  id: number;
  title: string;
  detail: string;
  actor?: Actor;
};

type RpsState = {
  player?: Gesture;
  ai?: Gesture;
  chooser?: Actor;
  text: string;
};

type GameState = {
  phase: Phase;
  playerFaction: Faction;
  hands: Record<Actor, Card[]>;
  deck: Card[];
  battlefields: Battlefield[];
  turn: Actor;
  hasPlayed: boolean;
  usedSkill: Record<Actor, boolean>;
  selectedCardId: string | null;
  message: string;
  logs: BattleLog[];
  winner: Actor | null;
  winReason: string;
  actionSeq: number;
  round: number;
  aiThinking: boolean;
  rps: RpsState;
};

type SwapRef = { field: number; actor: Actor; card: number };

const SUITS: Array<Pick<Card, "suit" | "symbol" | "red">> = [
  { suit: "heart", symbol: "♥", red: true },
  { suit: "diamond", symbol: "♦", red: true },
  { suit: "spade", symbol: "♠", red: false },
  { suit: "club", symbol: "♣", red: false },
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const GESTURES: Record<Gesture, { icon: string; label: string }> = {
  rock: { icon: "●", label: "石头" },
  scissors: { icon: "✌", label: "剪刀" },
  paper: { icon: "▱", label: "布" },
};

function randomGesture() {
  const options = Object.keys(GESTURES) as Gesture[];
  return options[Math.floor(Math.random() * options.length)];
}

function aiPrefersFirst() {
  return Math.random() > 0.38;
}

function shuffled<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function createFullDeck() {
  const suited = SUITS.flatMap(({ suit, symbol, red }) =>
    RANKS.map((rank, index) => ({
      id: `${suit}-${rank}`,
      rank,
      suit,
      symbol,
      red,
      value: index + 1,
    })),
  );
  return [
    ...suited,
    { id: "joker-small", rank: "小王", suit: "joker" as const, symbol: "JOKER", red: false, value: 14 },
    { id: "joker-big", rank: "大王", suit: "joker" as const, symbol: "JOKER", red: true, value: 15 },
  ];
}

function createBattle() {
  const fullDeck = createFullDeck();
  const fixedMarkers = fullDeck.filter((card) => card.rank === "A" || card.suit === "joker");
  const combatCards = shuffled(fullDeck.filter((card) => card.rank !== "A" && card.suit !== "joker"));
  const randomMarkers = combatCards.slice(0, 2);
  const playable = shuffled(combatCards.slice(2));
  const markers = shuffled([...fixedMarkers, ...randomMarkers]);
  return {
    markers,
    playerHand: playable.slice(0, 6),
    aiHand: playable.slice(6, 12),
    deck: playable.slice(12),
  };
}

function initialGame(playerFaction: Faction = "chu"): GameState {
  return {
    phase: "setup",
    playerFaction,
    hands: { player: [], ai: [] },
    deck: [],
    battlefields: [],
    turn: "player",
    hasPlayed: false,
    usedSkill: { player: false, ai: false },
    selectedCardId: null,
    message: "选择楚或汉，我会自动执掌另一方。",
    logs: [],
    winner: null,
    winReason: "",
    actionSeq: 0,
    round: 1,
    aiThinking: false,
    rps: { text: "出拳定先后。" },
  };
}

function cloneGame(game: GameState): GameState {
  return {
    ...game,
    hands: { player: [...game.hands.player], ai: [...game.hands.ai] },
    deck: [...game.deck],
    usedSkill: { ...game.usedSkill },
    logs: [...game.logs],
    rps: { ...game.rps },
    battlefields: game.battlefields.map((field) => ({
      ...field,
      troops: { player: [...field.troops.player], ai: [...field.troops.ai] },
      completedAt: { ...field.completedAt },
    })),
  };
}

function factionOf(game: GameState, actor: Actor) {
  return actor === "player" ? game.playerFaction : game.playerFaction === "chu" ? "han" : "chu";
}

function factionName(faction: Faction) {
  return faction === "chu" ? "楚" : "汉";
}

function actorName(actor: Actor) {
  return actor === "player" ? "你" : "我";
}

function getFormation(cards: Card[]): Formation | null {
  if (cards.length !== 3) return null;
  const sorted = [...cards].sort((a, b) => a.value - b.value);
  const sameSuit = cards.every((card) => card.suit === cards[0].suit);
  const sameRank = cards.every((card) => card.value === cards[0].value);
  const straight = sorted[1].value === sorted[0].value + 1 && sorted[2].value === sorted[1].value + 1;
  const sum = cards.reduce((total, card) => total + card.value, 0);
  if (straight && sameSuit) return { level: 5, name: "同花顺", sum };
  if (sameRank) return { level: 4, name: "同点数", sum };
  if (straight) return { level: 3, name: "顺子", sum };
  if (sameSuit) return { level: 2, name: "同花", sum };
  return { level: 1, name: "散阵", sum };
}

function compareFormation(
  first: Card[],
  second: Card[],
  firstCompleted = Number.MAX_SAFE_INTEGER,
  secondCompleted = Number.MAX_SAFE_INTEGER,
) {
  const a = getFormation(first);
  const b = getFormation(second);
  if (!a || !b) return 0;
  if (a.level !== b.level) return a.level - b.level;
  if (a.sum !== b.sum) return a.sum - b.sum;
  return secondCompleted - firstCompleted;
}

function formationPower(cards: Card[]) {
  const formation = getFormation(cards);
  return formation ? formation.level * 100 + formation.sum : 0;
}

function possibleCombatCards(game: GameState) {
  const played = new Set(
    game.battlefields.flatMap((field) => [...field.troops.player, ...field.troops.ai]).map((card) => card.id),
  );
  return createFullDeck().filter(
    (card) => card.rank !== "A" && card.suit !== "joker" && !played.has(card.id),
  );
}

function defenderCanBeat(game: GameState, field: Battlefield, attacker: Actor) {
  const defender: Actor = attacker === "player" ? "ai" : "player";
  const attackFormation = getFormation(field.troops[attacker]);
  if (!attackFormation) return true;
  const partial = field.troops[defender];
  const missing = 3 - partial.length;
  const candidates = possibleCombatCards(game);
  if (missing === 1) {
    return candidates.some((card) => formationPower([...partial, card]) > formationPower(field.troops[attacker]));
  }
  if (missing === 2) {
    for (let first = 0; first < candidates.length; first += 1) {
      for (let second = first + 1; second < candidates.length; second += 1) {
        if (formationPower([...partial, candidates[first], candidates[second]]) > formationPower(field.troops[attacker])) {
          return true;
        }
      }
    }
  }
  return false;
}

function attackVerdict(game: GameState, field: Battlefield, attacker: Actor) {
  const defender: Actor = attacker === "player" ? "ai" : "player";
  if (field.winner || field.troops[attacker].length !== 3) {
    return { success: false, text: "这座战场还不能发起进攻。" };
  }
  const defendingCards = field.troops[defender];
  if (defendingCards.length === 0) {
    return { success: true, text: "乘虚而入：守军尚未布阵，立即夺下战场。" };
  }
  if (defendingCards.length === 3) {
    const comparison = compareFormation(
      field.troops[attacker],
      defendingCards,
      field.completedAt[attacker],
      field.completedAt[defender],
    );
    return comparison > 0
      ? { success: true, text: "针锋相对：你的战斗队形更强。" }
      : { success: false, text: "针锋相对：守军队形更强，本次进攻失败。" };
  }
  return defenderCanBeat(game, field, attacker)
    ? { success: false, text: "尚非胜券在握：守军理论上仍能组成更强队形。" }
    : { success: true, text: "胜券在握：守军已无法组成更强队形。" };
}

function victoryFor(fields: Battlefield[], actor: Actor) {
  const wins = fields.map((field, index) => (field.winner === actor ? index : -1)).filter((index) => index >= 0);
  if (wins.length >= 4) return "大获全胜 · 夺下任意四座战场";
  for (let index = 0; index <= 5; index += 1) {
    if ([index, index + 1, index + 2].every((fieldIndex) => wins.includes(fieldIndex))) {
      return "势如破竹 · 连夺相邻三座战场";
    }
  }
  if ((wins.includes(0) && wins.includes(1)) || (wins.includes(6) && wins.includes(7))) {
    return "边路突袭 · 夺下边缘连续两座战场";
  }
  return null;
}

function settleVictory(game: GameState, actor: Actor) {
  const reason = victoryFor(game.battlefields, actor);
  if (!reason) return game;
  return {
    ...game,
    phase: "finished",
    winner: actor,
    winReason: reason,
    aiThinking: false,
    message: `${actorName(actor)}以“${reason.split(" · ")[0]}”结束楚汉之争。`,
  };
}

function resolveAttack(game: GameState, fieldIndex: number, attacker: Actor) {
  const next = cloneGame(game);
  const field = next.battlefields[fieldIndex];
  const verdict = attackVerdict(next, field, attacker);
  if (!verdict.success) {
    next.message = `第 ${fieldIndex + 1} 战场｜${verdict.text}`;
    return next;
  }
  field.winner = attacker;
  next.logs.unshift({
    id: Date.now() + fieldIndex,
    title: `${actorName(attacker)}夺下第 ${fieldIndex + 1} 战场`,
    detail: verdict.text,
    actor: attacker,
  });
  next.message = `第 ${fieldIndex + 1} 战场｜${verdict.text}`;
  return settleVictory(next, attacker);
}

function partialPotential(cards: Card[]) {
  if (cards.length === 3) return formationPower(cards) * 10;
  let score = cards.reduce((total, card) => total + card.value, 0);
  if (cards.length === 2) {
    if (cards[0].value === cards[1].value) score += 55;
    if (cards[0].suit === cards[1].suit) score += 28;
    if (Math.abs(cards[0].value - cards[1].value) <= 2) score += 34;
  }
  return score;
}

function maybeUseAiSkill(game: GameState) {
  if (game.usedSkill.ai) return game;
  const faction = factionOf(game, "ai");
  const next = cloneGame(game);
  if (faction === "chu") {
    const aiValue = next.hands.ai.reduce((sum, card) => sum + card.value, 0);
    const playerValue = next.hands.player.reduce((sum, card) => sum + card.value, 0);
    if (playerValue <= aiValue + 7) return game;
    [next.hands.ai, next.hands.player] = [next.hands.player, next.hands.ai];
    next.usedSkill.ai = true;
    next.logs.unshift({ id: Date.now(), title: "我发动「乱世枭雄」", detail: "双方交换全部手牌。", actor: "ai" });
    return next;
  }

  const refs: SwapRef[] = [];
  next.battlefields.forEach((field, fieldIndex) => {
    (["player", "ai"] as Actor[]).forEach((actor) => {
      field.troops[actor].forEach((_, cardIndex) => refs.push({ field: fieldIndex, actor, card: cardIndex }));
    });
  });
  const baseline = next.battlefields.reduce((sum, field) => sum + partialPotential(field.troops.ai), 0);
  let bestGain = 0;
  let bestPair: [SwapRef, SwapRef] | null = null;
  for (let first = 0; first < refs.length; first += 1) {
    for (let second = first + 1; second < refs.length; second += 1) {
      const a = refs[first];
      const b = refs[second];
      if (a.field === b.field) continue;
      const trial = cloneGame(next);
      const cardA = trial.battlefields[a.field].troops[a.actor][a.card];
      const cardB = trial.battlefields[b.field].troops[b.actor][b.card];
      trial.battlefields[a.field].troops[a.actor][a.card] = cardB;
      trial.battlefields[b.field].troops[b.actor][b.card] = cardA;
      const score = trial.battlefields.reduce((sum, field) => sum + partialPotential(field.troops.ai), 0);
      if (score - baseline > bestGain) {
        bestGain = score - baseline;
        bestPair = [a, b];
      }
    }
  }
  if (!bestPair || bestGain < 25) return game;
  const [a, b] = bestPair;
  const cardA = next.battlefields[a.field].troops[a.actor][a.card];
  const cardB = next.battlefields[b.field].troops[b.actor][b.card];
  next.battlefields[a.field].troops[a.actor][a.card] = cardB;
  next.battlefields[b.field].troops[b.actor][b.card] = cardA;
  next.usedSkill.ai = true;
  next.logs.unshift({
    id: Date.now(),
    title: "我发动「运筹帷幄」",
    detail: `调换第 ${a.field + 1} 与第 ${b.field + 1} 战场的一张牌。`,
    actor: "ai",
  });
  return next;
}

function aiPlayChoice(game: GameState) {
  let best: { cardIndex: number; fieldIndex: number; score: number } | null = null;
  game.hands.ai.forEach((card, cardIndex) => {
    game.battlefields.forEach((field, fieldIndex) => {
      if (field.winner || field.troops.ai.length >= 3) return;
      let score = partialPotential([...field.troops.ai, card]);
      if (field.troops.player.length === 2) score += 42;
      if (fieldIndex <= 1 || fieldIndex >= 6) score += 10;
      const ownWins = game.battlefields.filter((item) => item.winner === "ai").length;
      if (ownWins >= 3) score += 18;
      if (!best || score > best.score) best = { cardIndex, fieldIndex, score };
    });
  });
  return best as { cardIndex: number; fieldIndex: number; score: number } | null;
}

function aiAttackProvableFields(game: GameState) {
  let next = game;
  for (let index = 0; index < next.battlefields.length; index += 1) {
    if (next.phase === "finished") break;
    const field = next.battlefields[index];
    if (field.winner || field.troops.ai.length !== 3) continue;
    if (attackVerdict(next, field, "ai").success) next = resolveAttack(next, index, "ai");
  }
  return next;
}

function runAiTurn(game: GameState) {
  if (game.phase !== "playing" || game.turn !== "ai") return game;
  let next = maybeUseAiSkill(game);
  next = aiAttackProvableFields(next);
  if (next.phase === "finished") return { ...next, aiThinking: false };
  next = cloneGame(next);
  const choice = aiPlayChoice(next);
  if (choice) {
    const [card] = next.hands.ai.splice(choice.cardIndex, 1);
    next.actionSeq += 1;
    const field = next.battlefields[choice.fieldIndex];
    field.troops.ai.push(card);
    if (field.troops.ai.length === 3) field.completedAt.ai = next.actionSeq;
    const drawn = next.deck.shift();
    if (drawn) next.hands.ai.push(drawn);
    next.logs.unshift({
      id: Date.now() + 7,
      title: `我向第 ${choice.fieldIndex + 1} 战场出牌`,
      detail: drawn ? "完成出牌并补一张牌。" : "牌堆已空，不再补牌。",
      actor: "ai",
    });
  } else {
    next.logs.unshift({ id: Date.now() + 8, title: "我跳过出牌", detail: "所有可用战场均已满位。", actor: "ai" });
  }
  next = aiAttackProvableFields(next);
  if (next.phase === "finished") return { ...next, aiThinking: false };
  return {
    ...next,
    turn: "player",
    hasPlayed: false,
    selectedCardId: null,
    aiThinking: false,
    round: next.round + 1,
    message: "轮到你：可先发动技能或进攻，再选择一张手牌投入战场。",
  };
}

function CardFace({ card, small = false, hidden = false }: { card?: Card; small?: boolean; hidden?: boolean }) {
  if (hidden || !card) {
    return <span className={`poker-card card-back ${small ? "small" : ""}`} aria-label="牌面朝下"><i>楚汉</i></span>;
  }
  return (
    <span className={`poker-card card-front ${card.red ? "red-card" : "black-card"} ${small ? "small" : ""}`}>
      <b>{card.rank}</b><em>{card.symbol}</em><small>{card.symbol}</small>
    </span>
  );
}

function TroopSlot({
  card,
  selectable,
  selected,
  onClick,
}: {
  card?: Card;
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`troop-slot ${card ? "filled" : ""} ${selectable ? "selectable" : ""} ${selected ? "swap-selected" : ""}`}
      disabled={!card || !selectable}
      onClick={onClick}
      aria-label={card ? `${card.symbol}${card.rank}${selected ? "，已选中" : ""}` : "空位"}
    >
      {card ? <CardFace card={card} small /> : <span>+</span>}
    </button>
  );
}

export default function ChuHanGame() {
  const [game, setGame] = useState<GameState>(() => initialGame());
  const [swapSelection, setSwapSelection] = useState<SwapRef[]>([]);

  const aiFaction = game.playerFaction === "chu" ? "han" : "chu";
  const playerCanAct = game.phase === "playing" && game.turn === "player" && !game.aiThinking;
  const noLegalSlot = useMemo(
    () => game.battlefields.length > 0 && game.battlefields.every((field) => field.winner || field.troops.player.length >= 3),
    [game.battlefields],
  );

  useEffect(() => {
    if (game.phase !== "playing" || game.turn !== "ai" || game.aiThinking) return;
    const timer = window.setTimeout(() => setGame((current) => runAiTurn(current)), 720);
    return () => window.clearTimeout(timer);
  }, [game.phase, game.turn, game.aiThinking, game.round]);

  function chooseFaction(faction: Faction) {
    setGame((current) => ({
      ...current,
      playerFaction: faction,
      message: `你选择${factionName(faction)}，我将执掌${factionName(faction === "chu" ? "han" : "chu")}。`,
    }));
  }

  function prepareGame() {
    const battle = createBattle();
    setSwapSelection([]);
    setGame({
      ...initialGame(game.playerFaction),
      phase: "rps",
      hands: { player: battle.playerHand, ai: battle.aiHand },
      deck: battle.deck,
      battlefields: battle.markers.map((marker, index) => ({
        id: index,
        marker,
        troops: { player: [], ai: [] },
        completedAt: {},
        winner: null,
      })),
      message: "八座战场已经铺开。猜拳获胜者决定先后手。",
    });
  }

  function playRps(playerGesture: Gesture) {
    const aiGesture = randomGesture();
    if (playerGesture === aiGesture) {
      setGame((current) => ({
        ...current,
        rps: { player: playerGesture, ai: aiGesture, text: "平局，再来一拳！" },
      }));
      return;
    }
    const playerWins =
      (playerGesture === "rock" && aiGesture === "scissors") ||
      (playerGesture === "scissors" && aiGesture === "paper") ||
      (playerGesture === "paper" && aiGesture === "rock");
    if (playerWins) {
      setGame((current) => ({
        ...current,
        rps: { player: playerGesture, ai: aiGesture, chooser: "player", text: "你赢了，请决定先手或后手。" },
      }));
      return;
    }
    const aiChoosesFirst = aiPrefersFirst();
    setGame((current) => ({
      ...current,
      phase: "playing",
      turn: aiChoosesFirst ? "ai" : "player",
      rps: { player: playerGesture, ai: aiGesture, chooser: "ai", text: `我赢了，并选择${aiChoosesFirst ? "先手" : "后手"}。` },
      message: aiChoosesFirst ? "我赢得猜拳，选择先手。" : "我赢得猜拳，选择后手；由你先出牌。",
    }));
  }

  function chooseOrder(turn: Actor) {
    setGame((current) => ({
      ...current,
      phase: "playing",
      turn,
      message: turn === "player" ? "你选择先手。请选择一张手牌，再选择战场。" : "你选择后手，由我先行。",
    }));
  }

  function selectHand(cardId: string) {
    if (!playerCanAct || game.hasPlayed) return;
    setGame((current) => ({
      ...current,
      selectedCardId: current.selectedCardId === cardId ? null : cardId,
      message: current.selectedCardId === cardId ? "已取消选牌。" : "手牌已选中，请点击一座尚有空位的战场。",
    }));
  }

  function playToField(fieldIndex: number) {
    if (!playerCanAct || game.hasPlayed || !game.selectedCardId) return;
    setGame((current) => {
      const next = cloneGame(current);
      const field = next.battlefields[fieldIndex];
      if (!field || field.winner || field.troops.player.length >= 3) return current;
      const cardIndex = next.hands.player.findIndex((card) => card.id === next.selectedCardId);
      if (cardIndex < 0) return current;
      const [card] = next.hands.player.splice(cardIndex, 1);
      field.troops.player.push(card);
      next.actionSeq += 1;
      if (field.troops.player.length === 3) field.completedAt.player = next.actionSeq;
      const drawn = next.deck.shift();
      if (drawn) next.hands.player.push(drawn);
      next.hasPlayed = true;
      next.selectedCardId = null;
      next.message = drawn
        ? `你向第 ${fieldIndex + 1} 战场投入 ${card.symbol}${card.rank}，并补了一张牌。仍可发起进攻。`
        : `你向第 ${fieldIndex + 1} 战场投入 ${card.symbol}${card.rank}。牌堆已耗尽，仍可进攻。`;
      next.logs.unshift({
        id: Date.now(),
        title: `你向第 ${fieldIndex + 1} 战场出牌`,
        detail: `${card.symbol}${card.rank}${drawn ? " · 已补牌" : " · 牌堆已空"}`,
        actor: "player",
      });
      return next;
    });
  }

  function playerAttack(fieldIndex: number) {
    if (!playerCanAct) return;
    setGame((current) => resolveAttack(current, fieldIndex, "player"));
  }

  function useChuSkill() {
    if (!playerCanAct || game.hasPlayed || game.usedSkill.player || game.playerFaction !== "chu") return;
    setGame((current) => {
      const next = cloneGame(current);
      [next.hands.player, next.hands.ai] = [next.hands.ai, next.hands.player];
      next.usedSkill.player = true;
      next.selectedCardId = null;
      next.message = "「乱世枭雄」发动：你与我的全部手牌已经互换。";
      next.logs.unshift({ id: Date.now(), title: "你发动「乱世枭雄」", detail: "双方交换全部手牌。", actor: "player" });
      return next;
    });
  }

  function toggleSwap(ref: SwapRef) {
    if (!playerCanAct || game.hasPlayed || game.usedSkill.player || game.playerFaction !== "han") return;
    setSwapSelection((current) => {
      const exists = current.findIndex(
        (item) => item.field === ref.field && item.actor === ref.actor && item.card === ref.card,
      );
      if (exists >= 0) return current.filter((_, index) => index !== exists);
      if (current.length === 1 && current[0].field === ref.field) return [ref];
      return current.length >= 2 ? [ref] : [...current, ref];
    });
  }

  function confirmHanSkill() {
    if (swapSelection.length !== 2 || swapSelection[0].field === swapSelection[1].field) return;
    setGame((current) => {
      const next = cloneGame(current);
      const [a, b] = swapSelection;
      const cardA = next.battlefields[a.field].troops[a.actor][a.card];
      const cardB = next.battlefields[b.field].troops[b.actor][b.card];
      if (!cardA || !cardB) return current;
      next.battlefields[a.field].troops[a.actor][a.card] = cardB;
      next.battlefields[b.field].troops[b.actor][b.card] = cardA;
      next.usedSkill.player = true;
      next.message = `「运筹帷幄」发动：第 ${a.field + 1} 与第 ${b.field + 1} 战场各调换一张牌。`;
      next.logs.unshift({
        id: Date.now(),
        title: "你发动「运筹帷幄」",
        detail: `调换第 ${a.field + 1} 与第 ${b.field + 1} 战场的一张牌。`,
        actor: "player",
      });
      return next;
    });
    setSwapSelection([]);
  }

  function endTurn() {
    if (!playerCanAct || (!game.hasPlayed && !noLegalSlot)) return;
    setSwapSelection([]);
    setGame((current) => ({
      ...current,
      turn: "ai",
      hasPlayed: false,
      selectedCardId: null,
      message: noLegalSlot && !current.hasPlayed ? "无空位可出牌，你跳过出牌阶段。" : "你的回合结束，轮到我。",
    }));
  }

  function restart() {
    const faction = game.playerFaction;
    setSwapSelection([]);
    setGame(initialGame(faction));
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="魔法数学首页">
          <span className="brand-mark battle-mark" aria-hidden="true">楚</span>
          <span>魔法数学</span>
        </a>
        <span className="issue-tag">纸牌兵法 · 双人对决</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />CHU–HAN CONTENTION<span /></p>
          <h1><span>楚</span><span>汉</span><span>之</span><span>争</span></h1>
          <p className="hero-lead">一纸鸿沟，<br /><em>八座战场定天下。</em></p>
          <p className="hero-description">
            你选楚或汉，我执掌另一方。以三张牌结成战斗队形，判断时机、主动进攻，
            率先打穿中路或奇袭边关。
          </p>
          <div className="hero-tags"><span>玩家 VS 我</span><span>一副扑克牌</span><span>15–25 分钟</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="sun-disc" />
          <span className="hero-banner chu-banner">楚</span>
          <span className="hero-banner han-banner">汉</span>
          <span className="river-stroke" />
          <span className="spear spear-one" />
          <span className="spear spear-two" />
        </div>
      </section>

      <section className="game-shell" aria-labelledby="game-title">
        <div className="shell-heading">
          <div>
            <span className="section-kicker">BATTLE TABLE · 八阵图</span>
            <h2 id="game-title">
              {game.phase === "setup" ? "选择你的阵营" : game.phase === "rps" ? "猜拳定先后" : game.phase === "finished" ? "天下已定" : `第 ${game.round} 回合 · ${game.turn === "player" ? "你方行动" : "我方行动"}`}
            </h2>
          </div>
          {game.phase !== "setup" && <button className="text-button" type="button" onClick={restart}>重开战局</button>}
        </div>

        {game.phase === "setup" && (
          <div className="faction-setup">
            <div className="faction-picker">
              <button type="button" className={`faction-card chu ${game.playerFaction === "chu" ? "selected" : ""}`} onClick={() => chooseFaction("chu")}>
                <span className="faction-seal">楚</span>
                <small>西楚霸王 · 正面强攻</small>
                <strong>乱世枭雄</strong>
                <p>一次机会：在出牌前，将你与我的全部手牌互换。</p>
              </button>
              <span className="versus">VS</span>
              <button type="button" className={`faction-card han ${game.playerFaction === "han" ? "selected" : ""}`} onClick={() => chooseFaction("han")}>
                <span className="faction-seal">汉</span>
                <small>汉王入关 · 谋定后动</small>
                <strong>运筹帷幄</strong>
                <p>一次机会：在出牌前，调换不同战场上各一张明牌。</p>
              </button>
            </div>
            <aside className="setup-brief">
              <span className="section-kicker">YOUR SIDE</span>
              <h3>你执掌{factionName(game.playerFaction)}</h3>
              <p>我将自动成为{factionName(aiFaction)}。系统会把大小王、四张 A 与随机两张牌洗成八座隐藏战场，再各发六张手牌。</p>
              <button className="primary-button" type="button" onClick={prepareGame}>列阵开战 <span>→</span></button>
            </aside>
          </div>
        )}

        {game.phase === "rps" && (
          <div className="rps-stage">
            <div className="rps-result">
              <div><small>你 · {factionName(game.playerFaction)}</small><strong>{game.rps.player ? GESTURES[game.rps.player].icon : "?"}</strong><span>{game.rps.player ? GESTURES[game.rps.player].label : "尚未出拳"}</span></div>
              <b>对</b>
              <div><small>我 · {factionName(aiFaction)}</small><strong>{game.rps.ai ? GESTURES[game.rps.ai].icon : "?"}</strong><span>{game.rps.ai ? GESTURES[game.rps.ai].label : "等待你"}</span></div>
            </div>
            <div className="rps-controls">
              <span className="section-kicker">ROCK · PAPER · SCISSORS</span>
              <h3>{game.rps.text}</h3>
              {game.rps.chooser === "player" ? (
                <div className="order-buttons">
                  <button className="primary-button" type="button" onClick={() => chooseOrder("player")}>选择先手</button>
                  <button className="outline-button" type="button" onClick={() => chooseOrder("ai")}>选择后手</button>
                </div>
              ) : (
                <div className="gesture-buttons">
                  {(Object.keys(GESTURES) as Gesture[]).map((gesture) => (
                    <button type="button" key={gesture} onClick={() => playRps(gesture)}><b>{GESTURES[gesture].icon}</b><span>{GESTURES[gesture].label}</span></button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(game.phase === "playing" || game.phase === "finished") && (
          <div className="war-console">
            <div className="status-strip">
              <div className={`army-chip ${aiFaction}`}><span>我</span><b>{factionName(aiFaction)}军</b><small>{game.hands.ai.length} 张手牌 · 技能{game.usedSkill.ai ? "已用" : "可用"}</small></div>
              <div className="turn-message" role="status"><span>{game.turn === "player" ? "YOUR TURN" : "MY TURN"}</span><p>{game.message}</p></div>
              <div className={`army-chip player ${game.playerFaction}`}><span>你</span><b>{factionName(game.playerFaction)}军</b><small>{game.hands.player.length} 张手牌 · 技能{game.usedSkill.player ? "已用" : "可用"}</small></div>
            </div>

            <div className="battle-scroll" aria-label="八座战场，可横向滚动">
              <div className="battle-board">
                <div className="army-axis top-axis"><span>我的部队</span><i /></div>
                <div className="battle-grid">
                  {game.battlefields.map((field, fieldIndex) => {
                    const playerFormation = getFormation(field.troops.player);
                    const aiFormation = getFormation(field.troops.ai);
                    const canPlace = playerCanAct && !game.hasPlayed && !!game.selectedCardId && !field.winner && field.troops.player.length < 3;
                    const canAttack = playerCanAct && !field.winner && field.troops.player.length === 3;
                    return (
                      <article className={`battlefield ${field.winner ? `won-${field.winner}` : ""}`} key={field.id}>
                        <header><span>战场 {fieldIndex + 1}</span>{field.winner && <b>{field.winner === "player" ? "你方占领" : "我方占领"}</b>}</header>
                        <div className={`troop-row ai-troops ${field.winner === "ai" ? "advanced" : ""}`}>
                          {[0, 1, 2].map((slot) => {
                            const ref = { field: fieldIndex, actor: "ai" as Actor, card: slot };
                            return <TroopSlot key={slot} card={field.troops.ai[slot]} selectable={game.playerFaction === "han" && playerCanAct && !game.hasPlayed && !game.usedSkill.player} selected={swapSelection.some((item) => item.field === fieldIndex && item.actor === "ai" && item.card === slot)} onClick={() => toggleSwap(ref)} />;
                          })}
                          {aiFormation && <span className="formation-tag">{aiFormation.name} · {aiFormation.sum}</span>}
                        </div>
                        <div className="front-line">
                          <span className="river-label">鸿沟</span>
                          <CardFace hidden small />
                        </div>
                        <div
                          className={`player-field-target ${canPlace ? "ready" : ""}`}
                          role={canPlace ? "button" : undefined}
                          tabIndex={canPlace ? 0 : -1}
                          onClick={() => canPlace && playToField(fieldIndex)}
                          onKeyDown={(event) => {
                            if (canPlace && (event.key === "Enter" || event.key === " ")) playToField(fieldIndex);
                          }}
                          aria-label={canPlace ? `向第 ${fieldIndex + 1} 战场出牌` : undefined}
                        >
                          <span className={`troop-row player-troops ${field.winner === "player" ? "advanced" : ""}`}>
                            {[0, 1, 2].map((slot) => {
                              const ref = { field: fieldIndex, actor: "player" as Actor, card: slot };
                              return <TroopSlot key={slot} card={field.troops.player[slot]} selectable={game.playerFaction === "han" && playerCanAct && !game.hasPlayed && !game.usedSkill.player} selected={swapSelection.some((item) => item.field === fieldIndex && item.actor === "player" && item.card === slot)} onClick={() => toggleSwap(ref)} />;
                            })}
                          </span>
                        </div>
                        <footer className="field-footer">
                          <span>{playerFormation ? `${playerFormation.name} · ${playerFormation.sum}` : `${field.troops.player.length}/3 布阵`}</span>
                          {canAttack && <button type="button" onClick={() => playerAttack(fieldIndex)}>发起进攻</button>}
                        </footer>
                      </article>
                    );
                  })}
                </div>
                <div className="army-axis bottom-axis"><i /><span>你的部队</span></div>
              </div>
            </div>

            {game.phase === "finished" ? (
              <div className={`victory-panel ${game.winner === "player" ? game.playerFaction : aiFaction}`}>
                <span className="victory-seal">{factionName(game.winner === "player" ? game.playerFaction : aiFaction)}</span>
                <div><span className="section-kicker">THE REALM IS DECIDED</span><h3>{game.winner === "player" ? "你赢下了楚汉之争" : "这一局由我拿下"}</h3><p>{game.winReason}</p></div>
                <button className="primary-button" type="button" onClick={restart}>再战一局</button>
              </div>
            ) : (
              <div className="command-deck">
                <div className="skill-panel">
                  <span className="section-kicker">ONCE PER GAME</span>
                  <h3>{game.playerFaction === "chu" ? "乱世枭雄" : "运筹帷幄"}</h3>
                  <p>{game.playerFaction === "chu" ? "出牌前交换双方全部手牌。" : "出牌前先后点选不同战场上的两张明牌，再确认调换。"}</p>
                  {game.playerFaction === "chu" ? (
                    <button className="skill-button" type="button" disabled={!playerCanAct || game.hasPlayed || game.usedSkill.player} onClick={useChuSkill}>{game.usedSkill.player ? "本局已发动" : "发动技能"}</button>
                  ) : (
                    <div className="han-skill-actions"><button className="skill-button" type="button" disabled={!playerCanAct || game.hasPlayed || game.usedSkill.player || swapSelection.length !== 2} onClick={confirmHanSkill}>{game.usedSkill.player ? "本局已发动" : `确认调换 ${swapSelection.length}/2`}</button>{swapSelection.length > 0 && !game.usedSkill.player && <button className="clear-selection" type="button" onClick={() => setSwapSelection([])}>清除</button>}</div>
                  )}
                </div>

                <div className="hand-panel">
                  <div className="hand-heading"><div><span className="section-kicker">YOUR HAND</span><h3>你的手牌</h3></div><small>牌堆余 {game.deck.length} 张</small></div>
                  <div className="player-hand">
                    {game.hands.player.map((card) => (
                      <button type="button" key={card.id} className={game.selectedCardId === card.id ? "selected" : ""} disabled={!playerCanAct || game.hasPlayed} onClick={() => selectHand(card.id)} aria-label={`选择${card.symbol}${card.rank}`}><CardFace card={card} /></button>
                    ))}
                    {game.hands.player.length === 0 && <p>手牌已全部打出。</p>}
                  </div>
                </div>

                <div className="turn-panel">
                  <span className="section-kicker">COMMAND</span>
                  <h3>{game.turn === "player" ? (game.hasPlayed ? "整军完毕" : noLegalSlot ? "无位可下" : "等待落子") : "我方推演中"}</h3>
                  <p>{game.turn === "player" ? (game.hasPlayed ? "可以继续发起进攻，或结束回合。" : noLegalSlot ? "跳过出牌，但仍可发起进攻。" : "选手牌，再点战场；系统自动补牌。") : "我会自动使用技能、出牌并判断进攻。"}</p>
                  <button className="primary-button end-turn" type="button" disabled={!playerCanAct || (!game.hasPlayed && !noLegalSlot)} onClick={endTurn}>{noLegalSlot && !game.hasPlayed ? "跳过出牌" : "结束回合"} <span>→</span></button>
                </div>
              </div>
            )}

            <div className="battle-log">
              <div><span className="section-kicker">BATTLE REPORT</span><h3>军情简报</h3></div>
              <div className="log-list">
                {game.logs.length === 0 ? <p>号角刚刚吹响，尚无军情。</p> : game.logs.slice(0, 8).map((log) => <article key={log.id}><span className={log.actor ?? "player"}>{log.actor ? factionName(factionOf(game, log.actor)) : "报"}</span><div><strong>{log.title}</strong><small>{log.detail}</small></div></article>)}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rules-section" aria-labelledby="rules-title">
        <div className="rules-heading"><div><span className="section-kicker">FIELD MANUAL</span><h2 id="rules-title">八战场，一套兵法</h2></div><p>三张牌结成队形；主动进攻不占用出牌。相同队形先比点数和，再比谁先成阵。</p></div>
        <div className="formation-order"><span>强</span><b>同花顺</b><i>›</i><b>同点数</b><i>›</i><b>顺子</b><i>›</i><b>同花</b><i>›</i><b>散阵</b><span>弱</span></div>
        <div className="rule-grid">
          <article><span>01</span><div><strong>打一张，补一张</strong><p>每回合向未占领且己方未满三张的战场出一张牌，然后自动从牌堆补一张。</p></div></article>
          <article><span>02</span><div><strong>三种进攻判定</strong><p>对方满阵就正面比较；零张直接夺取；一至两张则检验其理论最强队形。</p></div></article>
          <article><span>03</span><div><strong>三条胜利路线</strong><p>任意四场“大获全胜”；相邻三场“势如破竹”；最左或最右连续两场“边路突袭”。</p></div></article>
          <article><span>04</span><div><strong>牌尽仍可继续</strong><p>抽牌堆耗尽后继续打手牌；所有战场无空位时跳过出牌，但依旧可以进攻。</p></div></article>
        </div>
      </section>

      <footer className="site-footer"><span>魔法数学 · PLAY WITH NUMBERS</span><p>鸿沟为界，胜负由你落下的每一张牌决定。</p></footer>
    </main>
  );
}
