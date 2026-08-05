import type { Metadata } from "next";
import Link from "next/link";
import { MagicMathLogo } from "../components/magic-math-logo";
import { StudioNav } from "../components/studio-nav";

export const metadata: Metadata = {
  title: "规则详解｜魔法数学",
  description: "集中阅读魔法数学九款游戏的完整玩法、目标、公式与关键策略。",
};

type RuleStep = {
  title: string;
  detail: string;
};

type RuleEntry = {
  id: string;
  number: string;
  title: string;
  english: string;
  category: string;
  href: `/games/${string}`;
  intro: string;
  steps: readonly RuleStep[];
  note: string;
};

const RULE_ARCHIVE: readonly RuleEntry[] = [
  {
    id: "number-merge",
    number: "01",
    title: "数字消消乐",
    english: "NUMBER MERGE",
    category: "计算 · 组合",
    href: "/games/number-merge",
    intro: "用“相加再减一”的规则合并数字，直到棋盘只留下最终结果。",
    steps: [
      { title: "设定数列", detail: "输入起点与终点，生成一段连续整数；终点必须大于起点，最多生成 100 个数。" },
      { title: "选择两个数", detail: "先点击一个数字，再点击另一个数字，两个数字将作为本轮合并对象。" },
      { title: "合成新数", detail: "把选中的两个数相加，再减去 1；原来的两个数消失，新结果加入棋盘。" },
      { title: "完成挑战", detail: "不断重复合并，直到棋盘中只剩一个数字，即可看到最终答案。" },
    ],
    note: "例如 2 与 4 合并：2 + 4 − 1 = 5。尝试更换合并顺序，观察最终数字是否改变。",
  },
  {
    id: "number-claim",
    number: "02",
    title: "数字抢位战",
    english: "NUMBER CLAIM",
    category: "心算 · 先机",
    href: "/games/number-claim",
    intro: "两位玩家轮流抢占连续数字，用对节奏与余数的判断率先占领终点。",
    steps: [
      { title: "设定终点", detail: "输入一个大于 3 的数字，生成从 1 到终点的完整抢位棋盘。" },
      { title: "决定先手", detail: "A、B 两位玩家商量谁先开始，再开启对局。" },
      { title: "按顺序抢位", detail: "从 1 开始，每轮只能选择接下来的 1 个或 2 个连续数字，确认后交换玩家。" },
      { title: "抢到终点", detail: "谁先把终点数字收入自己的颜色，谁就立即获胜。" },
    ],
    note: "先手与后手并不对称。留意每轮总共推进 3 格时的局面，尝试找到稳定的必胜节奏。",
  },
  {
    id: "nim",
    number: "03",
    title: "尼姆博弈",
    english: "NIM DUEL",
    category: "博弈 · 取舍",
    href: "/games/nim",
    intro: "从多堆花中轮流取走任意数量，用局面控制把最后一朵留给自己的回合。",
    steps: [
      { title: "选择花堆", detail: "每回合必须从仍有花朵的一堆中选择一堆。" },
      { title: "决定数量", detail: "至少取走 1 朵，也可以一次取空整堆，但不能跨越两堆取花。" },
      { title: "确认并换人", detail: "确认数量后完成本回合，立即轮到另一位玩家。" },
      { title: "最后一朵定胜负", detail: "取走桌面上最后一朵花的玩家获胜。" },
    ],
    note: "不要只看花朵总数。每次行动后，各堆数量形成的组合才是决定局面的关键。",
  },
  {
    id: "arrow-maze",
    number: "04",
    title: "箭阵迷域",
    english: "ARROW MAZE",
    category: "方向 · 路径",
    href: "/games/arrow-maze",
    intro: "只选择一次起点，让箭头沿最近目标自动连锁，尝试一击清空整张棋盘。",
    steps: [
      { title: "只选一次起点", detail: "棋盘静止时，任选一个仍存在的方格点击；每局只有这一次主动选择。" },
      { title: "沿箭头寻找目标", detail: "每支箭会击中该方向上最近的方格；该方向没有目标时停止。" },
      { title: "触发自动连锁", detail: "被击中的方格继续释放自己的箭头，多条路径可以同时延伸。" },
      { title: "清空棋盘", detail: "连锁结束后没有方格留下则挑战成功；仍有方格存在则本局失败。" },
    ],
    note: "优先寻找“没有其他格子指向它”的方格，它通常更适合作为连锁起点。",
  },
  {
    id: "layered-fusion",
    number: "05",
    title: "层叠消融",
    english: "LAYERED FUSION",
    category: "空间 · 消除",
    href: "/games/layered-fusion",
    intro: "拖动黑色图形进行奇偶叠加，用黑白消融关系拼出目标轮廓。",
    steps: [
      { title: "选择图形数量", detail: "选择 3-5 块图形，系统会从分级题库生成一道必定可解的目标。" },
      { title: "移动图形", detail: "按住答题区中的黑色图形，将它拖到新的位置；整体位置不影响最终判定。" },
      { title: "观察消融", detail: "同一区域叠一层为黑、叠两层变白、叠三层再次恢复黑色。" },
      { title: "完成匹配", detail: "最终黑白轮廓与目标形状一致时即为完成。" },
    ],
    note: "先找到目标中最完整的大轮廓，再用其他图形挖掉白色缺口，通常更容易接近答案。",
  },
  {
    id: "number-bomb",
    number: "06",
    title: "数字炸弹",
    english: "NUMBER BOMB",
    category: "区间 · 猜测",
    href: "/games/number-bomb",
    intro: "多人轮流在不断缩小的区间内猜数，避开系统隐藏的秘密数字。",
    steps: [
      { title: "组建队伍", detail: "选择 2-4 名玩家，每人代表一支队伍，按既定顺序轮流猜数。" },
      { title: "提交猜测", detail: "当前玩家只能在屏幕显示的有效区间内输入整数。" },
      { title: "缩小范围", detail: "猜错后，系统会根据秘密数字更新上限或下限，下一位继续在新区间内猜测。" },
      { title: "避开炸弹", detail: "猜中系统秘密数字的玩家引爆炸弹，并输掉本轮。" },
    ],
    note: "每一次猜测既是在搜集信息，也是在给下一位玩家制造风险。",
  },
  {
    id: "horse-race",
    number: "07",
    title: "御马狂飙",
    english: "HORSE RACING",
    category: "概率 · 竞速",
    href: "/games/horse-race",
    intro: "用扑克牌推进赛马，穿越五道隐藏关卡，让自己的马率先越过终点。",
    steps: [
      { title: "选马与铺赛道", detail: "双人版用大小王作为红、蓝两匹马；四人版用四张 A 代表四种花色。随机抽 5 张牌背面朝上排成赛道。" },
      { title: "翻牌向前冲", detail: "双人版按红蓝颜色前进；四人版按红桃、方块、黑桃、梅花的具体花色前进。每翻一张，对应马匹前进 1 格。" },
      { title: "揭晓关卡", detail: "第 1-4 关要等所有马完全越过后才能翻开；第 5 关只需所有马到达。对应颜色或花色的马后退 1 格。" },
      { title: "率先越线", detail: "继续翻牌并处理关卡，任何一匹马率先越过第 5 张赛道牌、抵达终点即获胜。" },
    ],
    note: "牌堆概率决定平均速度，隐藏关卡则会改变领先优势；短暂领先并不等于最终胜利。",
  },
  {
    id: "chu-han",
    number: "08",
    title: "楚汉之争",
    english: "CHU-HAN DUEL",
    category: "布局 · 对弈",
    href: "/games/chu-han",
    intro: "在八座战场排布三张牌阵，比较阵型强度，并通过多条胜利路线结束战局。",
    steps: [
      { title: "打一张，补一张", detail: "每回合向未占领且己方未满三张牌的战场出牌，然后自动从牌堆补一张。" },
      { title: "阵型强弱", detail: "阵型从强到弱依次为：同花顺、同点数、顺子、同花、散阵；相同阵型先比点数和，再比较成阵顺序。" },
      { title: "主动进攻", detail: "对方满阵时正面比较；对方零张时直接夺取；一至两张时检验其理论最强阵型。主动进攻不占用出牌。" },
      { title: "赢下战局", detail: "占领任意四场、连续占领相邻三场，或占领最左/最右连续两场，均可立即获胜。" },
      { title: "牌尽继续", detail: "抽牌堆耗尽后仍可继续打手牌；所有战场没有空位时跳过出牌，但依然可以发起进攻。" },
    ],
    note: "局部最强不一定带来全局胜利。先判断自己最接近哪条胜利路线，再分配关键牌。",
  },
  {
    id: "world-cup",
    number: "09",
    title: "世界杯风云",
    english: "WORLD CUP DUEL",
    category: "策略 · 概率",
    href: "/games/world-cup",
    intro: "从准备加点到常规赛、加时赛和点球大战，用攻防、控制与球队技能完成整场对决。",
    steps: [
      { title: "五回合准备", detail: "每回合双方各抽一张牌。红牌令本队任一能力 +2；黑牌令本队任一能力 +1，并令对手任一能力 −1。能力值保持在 0-15。" },
      { title: "上下半场", detail: "常规赛上下半场各 6 个完整回合；每个回合必须由双方各完成一次计划行动。上半场后手在下半场先行动。" },
      { title: "中场加点", detail: "双方各加 3 点。领先者先加；平分时进攻次数更多者先加；仍相同则上半场先手先加。" },
      { title: "加时赛", detail: "常规时间战平进入加时赛，上下半场各 3 个完整回合。" },
      { title: "点球大战", detail: "加时仍平时双方各罚 5 球，只能选择进攻；点球比分与常规、加时比分分开记录。" },
      { title: "突然死亡", detail: "五轮点球后仍平，每个完整回合双方各罚一球；只有双方完成同一轮且比分不同，才决出胜负。" },
    ],
    note: "球队技能使用次数为 1 + max(0, 己方档位 − 对方档位)。技能发动不占用当前计划行动。",
  },
];

const TEAM_SKILLS = [
  ["ARG", "阿根廷 · 绝境之师", "常规或加时最后三个回合可用：进攻 +1.5，持续两个回合。"],
  ["ESP", "西班牙 · Tiki-Taka", "下一次控制必定成功，并获得三次额外行动。"],
  ["FRA", "法国 · 三驾马车", "对手进攻未进后可用：进攻 +2、防守 −1，持续两个回合。"],
  ["ENG", "英格兰 · 一字长蛇", "常规最后四回合或加时可用：75% 防守 +3、进攻 −1；25% 防守 −2。"],
  ["POR", "葡萄牙 · 攻防一体", "复制对手当前进攻、防守、控制，持续一个回合。"],
  ["NED", "荷兰 · 铜墙铁壁", "防守 +2、进攻 −2，持续一个回合。"],
  ["BEL", "比利时 · 高空轰炸", "进攻 +1，并令对方防守 −0.5，持续一个回合。"],
  ["BRA", "巴西 · 边路突击", "令对手两个回合内不能使用防守。"],
  ["NOR", "挪威 · 中路爆破", "进攻 +1，持续两个回合。"],
  ["COL", "哥伦比亚 · 势均力敌", "选择一项能力与对手同步，持续两个回合；对手变化时同步变化。"],
  ["GER", "德国 · 速战速决", "仅上半场可用：进攻依次 +0.4、+0.8、+1.2，持续三个回合。"],
  ["MAR", "摩洛哥 · 长驱直入", "若进攻低于对手，则将进攻提升至与对手持平，持续两个回合。"],
  ["USA", "美国 · 声东击西", "任意调换自己的进攻、防守、控制数值，持续一个回合。"],
  ["ECU", "厄瓜多尔 · 固若金汤", "令对手进攻 −1，持续一个回合。"],
] as const;

export default function RulesArchivePage() {
  return (
    <main className="rules-archive-page" id="top">
      <StudioNav />

      <section className="rules-hero studio-frame" aria-labelledby="rules-hero-title">
        <div className="rules-hero-copy">
          <p className="rules-kicker">RULE ARCHIVE · GAMES</p>
          <h1 id="rules-hero-title">
            遵循规则{" "}
            <span>or 创造规则</span>
          </h1>
          <p>挑战自我</p>
        </div>
        <div className="rules-hero-mark" aria-hidden="true">
          <MagicMathLogo variant="hero" />
          <span>PLAY / THINK / DISCOVER</span>
        </div>
        <div className="rules-hero-meta">
          <span>魔法数学</span>
          <span>完整规则 · 随时查阅</span>
        </div>
      </section>

      <div className="rules-layout studio-frame">
        <aside className="rules-index" aria-label="九个游戏规则目录">
          <div>
            <small>QUICK INDEX</small>
            <strong>规则目录</strong>
          </div>
          <nav>
            {RULE_ARCHIVE.map((game) => (
              <a href={`#${game.id}`} key={game.id}>
                <span>{game.number}</span>
                <b>{game.title}</b>
                <i aria-hidden="true">↘</i>
              </a>
            ))}
          </nav>
        </aside>

        <section className="rules-list" aria-label="游戏规则详解">
          {RULE_ARCHIVE.map((game) => (
            <article className="rules-entry" id={game.id} key={game.id}>
              <header>
                <div className="rules-entry-number">{game.number}</div>
                <div>
                  <small>{game.english} · {game.category}</small>
                  <h2>{game.title}</h2>
                  <p>{game.intro}</p>
                </div>
                <Link href={game.href}>进入游戏 <span aria-hidden="true">↗</span></Link>
              </header>

              <ol className="rules-steps">
                {game.steps.map((step, index) => (
                  <li key={step.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{step.title}</strong><p>{step.detail}</p></div>
                  </li>
                ))}
              </ol>

              <div className="rules-note"><span aria-hidden="true">✦</span><p>{game.note}</p></div>

              {game.id === "world-cup" ? (
                <details className="skill-archive" open>
                  <summary>
                    <span><small>TEAM SKILLS / 14</small><strong>球队专属技能</strong></span>
                    <i>展开 / 收起</i>
                  </summary>
                  <div>
                    {TEAM_SKILLS.map(([code, name, detail]) => (
                      <article key={code}>
                        <b>{code}</b>
                        <div><strong>{name}</strong><p>{detail}</p></div>
                      </article>
                    ))}
                  </div>
                </details>
              ) : null}
            </article>
          ))}
        </section>
      </div>

      <footer className="rules-footer studio-frame">
        <Link href="/#projects">返回游戏档案</Link>
        <span>MAGIC MATH · RULE ARCHIVE</span>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </main>
  );
}
