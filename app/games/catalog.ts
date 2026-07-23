export type GameCatalogItem = {
  id: string;
  number: string;
  slug: string;
  href: `/games/${string}`;
  title: string;
  category: string;
  description: string;
  accent: "red" | "blue" | "gold";
};

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
  },
] as const;

export const gameCountLabel = String(GAME_CATALOG.length).padStart(2, "0");
