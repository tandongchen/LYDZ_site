export type GameGroupId = "party" | "strategy" | "thinking";

export type GameCatalogItem = {
  id: string;
  number: string;
  slug: string;
  href: `/games/${string}`;
  title: string;
  category: string;
  description: string;
  accent: "red" | "blue" | "gold";
  group: GameGroupId;
  cover?: `/${string}`;
};

export const GAME_GROUPS = [
  {
    id: "party",
    title: "派对·社交",
    english: "PARTY & SOCIAL",
    description: "快速上手，在交流、猜测与即时反馈中点燃现场。",
    tone: "red",
  },
  {
    id: "strategy",
    title: "策略·博弈",
    english: "STRATEGY & DUEL",
    description: "阅读对手、分配资源，让每个选择改变最终局势。",
    tone: "blue",
  },
  {
    id: "thinking",
    title: "逻辑·解谜",
    english: "LOGIC & PUZZLE",
    description: "拆解结构、验证假设，在安静推演中找到唯一出口。",
    tone: "violet",
  },
] as const satisfies readonly {
  id: GameGroupId;
  title: string;
  english: string;
  description: string;
  tone: "red" | "blue" | "violet";
}[];

export const GAME_CATALOG: readonly GameCatalogItem[] = [
  {
    id: "number-merge",
    number: "01",
    slug: "number-merge",
    href: "/games/number-merge",
    title: "数字消消乐",
    category: "计算 · 组合",
    description: "配对数字与运算，把棋盘一步步清空。",
    accent: "red",
    group: "party",
  },
  {
    id: "number-claim",
    number: "02",
    slug: "number-claim",
    href: "/games/number-claim",
    title: "数字抢位战",
    category: "心算 · 先机",
    description: "抢下关键数字，让终点先一步落入你的手中。",
    accent: "blue",
    group: "party",
  },
  {
    id: "nim",
    number: "03",
    slug: "nim",
    href: "/games/nim",
    title: "尼姆博弈",
    category: "博弈 · 取舍",
    description: "看穿石堆规律，把最后一步留给对手。",
    accent: "gold",
    group: "strategy",
  },
  {
    id: "arrow-maze",
    number: "04",
    slug: "arrow-maze",
    href: "/games/arrow-maze",
    title: "箭阵迷域",
    category: "方向 · 路径",
    description: "顺着箭头推演，找到迷阵中的唯一出口。",
    accent: "red",
    group: "thinking",
    cover: "/featured-arrow-maze.jpg",
  },
  {
    id: "layered-fusion",
    number: "05",
    slug: "layered-fusion",
    href: "/games/layered-fusion",
    title: "层叠消融",
    category: "空间 · 消除",
    description: "观察结构与连锁，让每一层精准消融。",
    accent: "blue",
    group: "thinking",
    cover: "/featured-layered-fusion.jpg",
  },
  {
    id: "number-bomb",
    number: "06",
    slug: "number-bomb",
    href: "/games/number-bomb",
    title: "数字炸弹",
    category: "区间 · 猜测",
    description: "收紧数字区间，在爆炸之前锁定答案。",
    accent: "gold",
    group: "party",
  },
  {
    id: "horse-race",
    number: "07",
    slug: "horse-race",
    href: "/games/horse-race",
    title: "御马狂飙",
    category: "概率 · 竞速",
    description: "权衡速度与风险，策马抢占终点先机。",
    accent: "red",
    group: "party",
  },
  {
    id: "chu-han",
    number: "08",
    slug: "chu-han",
    href: "/games/chu-han",
    title: "楚汉之争",
    category: "布局 · 对弈",
    description: "排兵布阵，以局部交换赢得全盘胜势。",
    accent: "blue",
    group: "strategy",
    cover: "/featured-chu-han.jpg",
  },
  {
    id: "world-cup",
    number: "09",
    slug: "world-cup",
    href: "/games/world-cup",
    title: "世界杯风云",
    category: "策略 · 概率",
    description: "调度攻防与技能，推演一场冠军决战。",
    accent: "gold",
    group: "strategy",
    cover: "/featured-world-cup.jpg",
  },
] as const;

export const gameCountLabel = String(GAME_CATALOG.length).padStart(2, "0");
