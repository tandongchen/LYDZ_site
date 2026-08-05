import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(new URL(pathname, "http://localhost"), { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the magic mathematics studio and all game links", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /魔法数学/);
  assert.match(html, /把数学规则/);
  assert.match(html, /变成.*可玩的世界/s);
  assert.match(html, /class="hero-video"/);
  assert.match(html, /data-shadow="MAGIC MATH"/);
  assert.match(html, /magic-math-logo/);
  assert.match(html, /magic-wand-cursor/);
  assert.doesNotMatch(html, /brand-hat-crown/);
  assert.match(html, /派对·社交/);
  assert.match(html, /策略·博弈/);
  assert.match(html, /逻辑·解谜/);
  assert.match(html, /启动全域征程/);
  assert.match(html, /精选项目档案/);
  assert.match(html, /打开全站搜索/);
  assert.match(html, /id="contact"/);
  assert.match(html, /游戏规则详解/);
  assert.match(html, /href="\/rules"/);
  assert.match(html, /href="\/contact"/);

  const games = [
    ["数字消消乐", "/games/number-merge"],
    ["数字抢位战", "/games/number-claim"],
    ["尼姆博弈", "/games/nim"],
    ["箭阵迷域", "/games/arrow-maze"],
    ["层叠消融", "/games/layered-fusion"],
    ["数字炸弹", "/games/number-bomb"],
    ["御马狂飙", "/games/horse-race"],
    ["楚汉之争", "/games/chu-han"],
    ["世界杯风云", "/games/world-cup"],
  ];

  for (const [title, href] of games) {
    assert.match(html, new RegExp(title));
    assert.match(html, new RegExp(`href="${href}"`));
  }
});

test("keeps the magic wand cursor above the global search overlay", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const cursorLayer = Number(styles.match(/\.magic-wand-cursor\s*\{[^}]*z-index:\s*(\d+)/s)?.[1]);
  const searchLayer = Number(styles.match(/\.site-search-overlay\s*\{[^}]*z-index:\s*(\d+)/s)?.[1]);

  assert.ok(Number.isFinite(cursorLayer));
  assert.ok(Number.isFinite(searchLayer));
  assert.ok(cursorLayer > searchLayer);
});

test("server-renders the collaboration contact page", async () => {
  const response = await render("/contact");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /让一个灵感/);
  assert.match(html, /成为下一套规则/);
  assert.match(html, /1224106085@qq\.com/);
  assert.match(html, /tandongchen499@gmail\.com/);
  assert.match(html, /新的游戏/);
  assert.match(html, /新的规则|有趣的规则/);
});

test("server-renders the complete nine-game rule archive", async () => {
  const response = await render("/rules");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /RULE ARCHIVE/);
  assert.match(html, /遵循规则/);
  assert.match(html, /or 创造规则/);
  assert.match(html, /挑战自我/);
  assert.doesNotMatch(html, /09 GAMES/);
  assert.match(html, /游戏规则详解/);

  for (const title of [
    "数字消消乐",
    "数字抢位战",
    "尼姆博弈",
    "箭阵迷域",
    "层叠消融",
    "数字炸弹",
    "御马狂飙",
    "楚汉之争",
    "世界杯风云",
  ]) {
    assert.match(html, new RegExp(title));
  }

  assert.doesNotMatch(html, /概率公式/);
  assert.doesNotMatch(html, /进攻 − 防守 ÷ 1\.3/);
  assert.match(html, /球队专属技能/);
  assert.match(html, /Tiki-Taka/);
});

test("uses the same large game-title structure for the first two games", async () => {
  const mergeSource = await readFile(new URL("../app/games/number-merge/page.tsx", import.meta.url), "utf8");
  const claimSource = await readFile(new URL("../app/games/number-claim/page.tsx", import.meta.url), "utf8");

  for (const source of [mergeSource, claimSource]) {
    assert.match(source, /<h1 className="game-name"/);
    assert.match(source, /<p className="hero-lead">/);
    assert.match(source, /<p className="hero-description">/);
  }
});

test("server-renders every game route", async () => {
  const games = [
    ["数字消消乐", "/games/number-merge"],
    ["数字抢位战", "/games/number-claim"],
    ["尼姆博弈", "/games/nim"],
    ["箭阵迷域", "/games/arrow-maze"],
    ["层叠消融", "/games/layered-fusion"],
    ["数字炸弹", "/games/number-bomb"],
    ["御马狂飙", "/games/horse-race"],
    ["楚汉之争", "/games/chu-han"],
    ["世界杯风云", "/games/world-cup"],
  ];

  for (const [title, pathname] of games) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    const gameId = pathname.split("/").at(-1);
    assert.match(html, new RegExp(title), pathname);
    assert.match(html, /返回魔法数学/, pathname);
    assert.match(html, /magic-math-logo/, pathname);
    assert.match(html, new RegExp(`game-route-${gameId}`), pathname);
    assert.doesNotMatch(html, /rules-(?:card|section)/, pathname);
  }
});

test("shares the red-blue game theme and removes standalone rule narration", async () => {
  const styles = await readFile(new URL("../app/games/game-route.css", import.meta.url), "utf8");
  assert.match(styles, /--red:\s*#ef4058/);
  assert.match(styles, /--blue:\s*#246cff/);
  assert.match(styles, /backdrop-filter:\s*blur/);

  const routes = [
    "number-merge",
    "number-claim",
    "nim",
    "arrow-maze",
    "layered-fusion",
    "number-bomb",
    "horse-race",
    "chu-han",
    "world-cup",
  ];

  for (const route of routes) {
    const source = await readFile(new URL(`../app/games/${route}/page.tsx`, import.meta.url), "utf8");
    assert.match(source, /<MagicMathLogo \/>/, route);
    assert.doesNotMatch(source, /className="rules-(?:card|section)"/, route);
  }
});

test("keeps every game stylesheet inside its route namespace", async () => {
  const routes = [
    "number-merge",
    "number-claim",
    "nim",
    "arrow-maze",
    "layered-fusion",
    "number-bomb",
    "horse-race",
    "chu-han",
    "world-cup",
  ];
  const sharedStyles = await readFile(new URL("../app/games/game-route.css", import.meta.url), "utf8");

  assert.match(sharedStyles, /^\.game-route-scope\s*\{/m);
  assert.doesNotMatch(sharedStyles, /^(?::root|html|body)\b/m);

  for (const route of routes) {
    const layout = await readFile(new URL(`../app/games/${route}/layout.tsx`, import.meta.url), "utf8");
    const styles = await readFile(new URL(`../app/games/${route}/game.css`, import.meta.url), "utf8");
    const scope = `game-route-${route}`;

    assert.match(layout, new RegExp(`gameId="${route}"`), route);
    assert.match(styles, new RegExp(`\\.${scope}(?:[\\s,.:[#]|$)`), route);
    assert.doesNotMatch(styles, /^(?::root|html|body|\.hero-title-lockup)\b/m, route);
  }
});

test("counts one round only after both scheduled actions", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(roundSlot === 0\)/);
  assert.match(source, /setRoundSlot\(1\)/);
  assert.match(source, /handleCompletedRound\(roundInPhase \+ 1/);
  assert.match(source, /双方各行动一次才完成一回合/);
  assert.match(source, /prepAction === 9/);
});

test("uses the revised control formula and keeps bonus actions outside scheduled slots", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /effectiveStats\[current\]\.control - effectiveStats\[rival\]\.control \/ 2/);
  assert.match(source, /finishAction\(success \? awardedTurns : 0\)/);
  assert.match(source, /不占用双方的正常行动位置/);
  assert.match(source, /bonusTurns > 0/);
});

test("implements regular time, extra time, penalties, and sudden death", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /phase === "secondHalf" && completedRounds === 6/);
  assert.match(source, /phase === "extraFirstHalf" && completedRounds === 3/);
  assert.match(source, /phase === "extraSecondHalf" && completedRounds === 3/);
  assert.match(source, /phase === "penalties" && completedRounds === 5/);
  assert.match(source, /phase === "suddenDeath" && penaltySnapshot\.p1 !== penaltySnapshot\.p2/);
  assert.match(source, /beginActionPhase\(\s*"suddenDeath"/s);
});

test("uses the revised open-play and penalty attack formulas", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const \[penaltyScore, setPenaltyScore\]/);
  assert.match(source, /effectiveStats\[current\]\.attack - effectiveStats\[defender\]\.defense \/ 1\.5/);
  assert.match(source, /effectiveStats\[current\]\.attack -\s*effectiveStats\[defender\]\.defense \/ \(defended \? 1 : 1\.3\)/);
  assert.doesNotMatch(source, /defended \? 1 : 1\.5/);
  assert.doesNotMatch(source, /点球进球率 = 进攻 − 对方防守 ÷ 2/);
  assert.match(source, /className="penalty-scoreboard"/);
  assert.match(source, /className="defense-action" disabled=\{!canAct \|\| penaltyPlay/);
});

test("formats fractional probabilities without long decimal noise", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function formatChance/);
  assert.match(source, /value\.toFixed\(2\)/);
  assert.match(source, /function formatPercent/);
  assert.match(source, /percent\.toFixed\(1\)/);
  assert.doesNotMatch(source, /\$\{chance \* 10\}%/);
});

test("uses a readable vertical match-report timeline", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/games/world-cup/game.css", import.meta.url), "utf8");
  assert.match(styles, /\.log-list\s*\{[^}]*display:\s*grid;[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /\.log-list article\s*\{[^}]*grid-template-columns:\s*34px minmax\(0,\s*1fr\)/s);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(styles, /\.log-list\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(source, /className=\{log\.tone === "goal" \? "log-goal"/);
  assert.match(styles, /\.football-pitch > \.goal\s*\{/);
  assert.doesNotMatch(styles, /(^|\n)\.goal\s*\{/);
  assert.match(styles, /\.log-list article\.log-goal > span/);
});

test("uses a complete Chinese font for live match text", async () => {
  const styles = await readFile(new URL("../app/games/world-cup/game.css", import.meta.url), "utf8");
  assert.match(styles, /\.pitch-status strong\s*\{[^}]*font-family:\s*"Noto Sans SC",\s*"Microsoft YaHei",\s*sans-serif/s);
  assert.match(styles, /\.battle-log h3\s*\{[^}]*font-family:\s*"Noto Sans SC",\s*"Microsoft YaHei",\s*sans-serif/s);
});

test("carries a second-action defense into the next round", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  const roundResolver = source.match(/function handleCompletedRound[\s\S]*?function advanceScheduledAction/)?.[0] ?? "";
  const actionFinisher = source.match(/function finishAction[\s\S]*?function attack/)?.[0] ?? "";
  const controlAction = source.match(/function control\(\)[\s\S]*?function confirmHalftime/)?.[0] ?? "";
  assert.match(source, /setDefenseReady\(\(previous\) => \(\{ \.\.\.previous, \[current\]: true \}\)\)/);
  assert.match(source, /\[defender\]: false/);
  assert.doesNotMatch(roundResolver, /setDefenseReady/);
  assert.doesNotMatch(actionFinisher, /setDefenseReady/);
  assert.doesNotMatch(controlAction, /setDefenseReady/);
  assert.doesNotMatch(source, /\[otherPlayer\(current\)\]: false/);
  assert.match(source, /防守待生效/);
  assert.match(source, /防守会一直保留到对手真正选择进攻/);
});

test("keeps ability and probability limits", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Math\.max\(0, Math\.min\(10, value\)\)/);
  assert.match(source, /stats\[player\]\[key\] >= 15/);
  assert.match(source, /stats\[player\]\[key\] <= 0/);
});

test("offers all three team tiers with the revised ability values", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const TEAM_TIERS/);
  assert.match(source, /label: "一档"/);
  assert.match(source, /label: "二档"/);
  assert.match(source, /label: "三档"/);
  assert.match(source, /argentina:.*attack: 7, defense: 7, control: 10/);
  assert.match(source, /spain:.*attack: 6, defense: 8, control: 10/);
  assert.match(source, /france:.*attack: 8, defense: 6, control: 8/);
  assert.match(source, /england:.*attack: 7, defense: 7, control: 9/);
  assert.match(source, /capeVerde:.*attack: 4, defense: 8, control: 5/);
  assert.match(source, /egypt:.*attack: 6, defense: 5, control: 6/);
  assert.match(source, /<optgroup key=\{tier\.label\}/);
});

test("allocates skill uses from the tier gap", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function tierForTeam\(team: TeamId\)/);
  assert.match(source, /function skillUsesForTeam\(team: TeamId, opponent: TeamId\)/);
  assert.match(source, /1 \+ Math\.max\(0, tierForTeam\(team\) - tierForTeam\(opponent\)\)/);
  assert.match(source, /p1: skillUsesForTeam\(teams\.p1, teams\.p2\)/);
  assert.match(source, /p2: skillUsesForTeam\(teams\.p2, teams\.p1\)/);
  assert.match(source, /className="skill-action"/);
  assert.match(source, /技能已用尽/);
});

test("implements all fourteen announced team skills", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /argentina:[\s\S]*name: "绝境之师"/);
  assert.match(source, /spain:[\s\S]*name: "Tiki-Taka"/);
  assert.match(source, /france:[\s\S]*name: "三驾马车"/);
  assert.match(source, /england:[\s\S]*name: "一字长蛇"/);
  assert.match(source, /portugal:[\s\S]*name: "攻防一体"/);
  assert.match(source, /netherlands:[\s\S]*name: "铜墙铁壁"/);
  assert.match(source, /belgium:[\s\S]*name: "高空轰炸"/);
  assert.match(source, /attackDelta: 1\.5/);
  assert.match(source, /const tikiTaka = tikiTakaReady\[current\]/);
  assert.match(source, /const awardedTurns = tikiTaka \? 3 : 2/);
  assert.match(source, /teams\[defender\] === "france"/);
  assert.match(source, /function englandSkillSucceeds\(\)[\s\S]*Math\.random\(\) < 0\.75/);
  assert.match(source, /const defensiveSuccess = englandSkillSucceeds\(\)/);
  assert.match(source, /overrideStats: copyStats\(effectiveStats\[rival\]\)/);
  assert.match(source, /opponentDefenseDelta: -0\.5/);
  assert.match(source, /brazil:[\s\S]*name: "边路突击"/);
  assert.match(source, /norway:[\s\S]*name: "中路爆破"/);
  assert.match(source, /colombia:[\s\S]*name: "势均力敌"/);
  assert.match(source, /germany:[\s\S]*name: "速战速决"/);
  assert.match(source, /morocco:[\s\S]*name: "长驱直入"/);
  assert.match(source, /usa:[\s\S]*name: "声东击西"/);
  assert.match(source, /ecuador:[\s\S]*name: "固若金汤"/);
  assert.match(source, /blocksOpponentDefense: true/);
  assert.match(source, /progressiveAttackStep: 0\.4/);
  assert.match(source, /opponentAttackDelta: -1/);
});

test("expires temporary skill effects by completed rounds", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function tickSkillEffects\(\)/);
  assert.match(source, /previous\.p1\.roundsLeft - 1/);
  assert.match(source, /if \(isOpenPlayPhase\(phase\)\) tickSkillEffects\(\)/);
  assert.match(source, /baseEffectiveStatsFor\(player: PlayerId\)/);
  assert.match(source, /Math\.min\(\s*15,/s);
});

test("supports Colombia linked stats and USA ability permutations", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/games/world-cup/game.css", import.meta.url), "utf8");
  assert.match(source, /const \[pendingSkillChoice, setPendingSkillChoice\]/);
  assert.match(source, /function chooseColombiaStat\(key: StatKey\)/);
  assert.match(source, /linkedStat: key/);
  assert.match(source, /effectiveStats\.p1\[skillEffects\.p1\.linkedStat\] = baseEffectiveStats\.p2/);
  assert.match(source, /function chooseUsaPermutation\(order: StatKey\[\]\)/);
  assert.match(source, /const STAT_PERMUTATIONS/);
  assert.match(source, /className="pitch-panel skill-choice-panel"/);
  assert.match(styles, /\.skill-choice-grid\s*\{/);
});

test("blocks defense while Brazil's skill is active", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const defenseBlocked = Boolean\(skillEffects\[otherPlayer\(player\)\]\?\.blocksOpponentDefense\)/);
  assert.match(source, /className="defense-action" disabled=\{!canAct \|\| penaltyPlay \|\| tikiTakaReady\[player\] \|\| defenseBlocked\}/);
  assert.match(source, /防守键被封锁/);
});

test("keeps the scoreboard clear of the pitch and draws standard goal areas", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  const stadium = source.match(/<div className=\{`stadium[\s\S]*?\{teamZone\("p2", "bottom"\)\}/)?.[0] ?? "";
  assert.match(stadium, /className="scoreboard-rail"[\s\S]*className="football-pitch"/);
  assert.match(source, /className="goal-box top-goal-box"/);
  assert.match(source, /className="goal-box bottom-goal-box"/);
  const styles = await readFile(new URL("../app/games/world-cup/game.css", import.meta.url), "utf8");
  assert.match(styles, /\.goal\s*\{[\s\S]*repeating-linear-gradient/);
  assert.match(styles, /\.scoreboard\s*\{[^}]*display:\s*flex/);
  assert.doesNotMatch(styles, /\.scoreboard\s*\{[^}]*position:\s*absolute/);
});

test("plays a goal and net-impact animation for the scoring side", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function triggerGoalEffect\(scorer: PlayerId\)/);
  assert.match(source, /if \(goal\) triggerGoalEffect\(current\)/);
  assert.match(source, /className="goal-shot-ball"/);
  assert.match(source, /className="goal-net-impact"/);
  const styles = await readFile(new URL("../app/games/world-cup/game.css", import.meta.url), "utf8");
  assert.match(styles, /@keyframes game-route-world-cup-goal-shot-down/);
  assert.match(styles, /@keyframes game-route-world-cup-goal-shot-up/);
  assert.match(styles, /@keyframes game-route-world-cup-net-burst-down/);
  assert.match(styles, /@keyframes game-route-world-cup-net-burst-up/);
});

test("keeps hero copy clear of the right-side illustration at medium widths", async () => {
  const styles = await readFile(new URL("../app/games/world-cup/game.css", import.meta.url), "utf8");
  assert.match(styles, /@media \(max-width: 1000px\)[\s\S]*?\.hero-copy\s*\{\s*width:\s*52%/);
  assert.match(styles, /@media \(max-width: 1000px\)[\s\S]*?\.hero-description\s*\{\s*max-width:\s*400px/);
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*?\.hero-art\s*\{\s*right:\s*-170px/);
});

test("uses the revised Chinese footer copy", async () => {
  const source = await readFile(new URL("../app/games/world-cup/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<footer className="site-footer">[\s\S]*<span>魔法数学<\/span>[\s\S]*<p>角逐美加墨<\/p>/);
  assert.doesNotMatch(source, /MAGIC MATH|把规则变成一场看得见的比赛/);
});
