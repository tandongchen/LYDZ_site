import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Chu-Han Contention game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>楚汉之争｜玩家与 AI 的双人扑克牌战术游戏<\/title>/i);
  assert.match(html, /楚汉之争/);
  assert.match(html, /选择你的阵营/);
  assert.match(html, /博弈游戏/);
  assert.match(html, /智慧谋略/);
  assert.match(html, /扑克桌游/);
  assert.match(html, /选择难度/);
  assert.match(html, /初级/);
  assert.match(html, /高级/);
  assert.match(html, /乱世枭雄/);
  assert.match(html, /运筹帷幄/);
  assert.match(html, /列阵开战/);
  assert.match(html, /八战场，一套兵法/);
  assert.match(html, /同花顺/);
  assert.match(html, /大获全胜/);
  assert.match(html, /势如破竹/);
  assert.match(html, /边路突袭/);
  assert.match(html, /魔法数学/);
  assert.doesNotMatch(html, /直接宽松的策略|玩家目标胜率|计算路线与技能时机|挑战玩家胜率|纸牌兵法 · 双人对决|15–25 分钟|玩家 VS 我|御马狂飙|数字炸弹|codex-preview|SkeletonPreview/i);
});

test("keeps the AI rock-paper-scissors result visible until confirmation", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /aiOpeningTurn/);
  assert.match(source, /确认结果，继续开战/);
  assert.match(source, /phase:\s*"playing"/);
});

test("prevents Han swaps from using completed battlefields", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(field\.winner\) return;/);
  assert.match(source, /fieldA\.winner \|\| fieldB\.winner/);
  assert.match(source, /两个未结束战场/);
});

test("keeps a detailed, complete battle report including skills", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /game\.logs\.map/);
  assert.match(source, /第 \{log\.round\} 回合/);
  assert.match(source, /kind: "skill"/);
  assert.match(source, /出牌前发动/);
  assert.match(source, /进攻第 \$\{fieldIndex \+ 1\} 战场受阻/);
});

test("advanced AI prioritizes high-level formations and penalizes scattered formations", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /FORMATION_PRIORITY_SCORE/);
  assert.match(source, /1: -6400/);
  assert.match(source, /5: 15200/);
  assert.match(source, /formationPlanScore/);
  assert.match(source, /bestReachableFormation/);
});

test("uses Chu and Han army names in turn headings and battle reports", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /armyName\(game, game\.turn\).*行动/);
  assert.match(source, /armyName\(next, "ai"\).*向第/);
  assert.match(source, /armyName\(next, "player"\).*向第/);
  assert.doesNotMatch(source, /你方行动|我方行动/);
});

test("blocks imminent empty-lane captures and centers the hero title across the page", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /emptyLaneThreatScore/);
  assert.match(source, /urgentBlocks/);
  assert.match(source, /wouldEndGame/);
  assert.match(source, /className="hero-title-lockup"/);
  assert.match(styles, /\.hero-title-lockup\s*\{[^}]*width:\s*100%/s);
});

test("uses Chu and Han army names for rock-paper-scissors results", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /armyName\(current, "player"\).*赢了/);
  assert.match(source, /armyName\(current, "ai"\).*赢了/);
  assert.match(source, /<small>\{armyName\(game, "player"\)\}<\/small>/);
  assert.match(source, /<small>\{armyName\(game, "ai"\)\}<\/small>/);
  assert.doesNotMatch(source, /你赢了|我赢了/);
});
