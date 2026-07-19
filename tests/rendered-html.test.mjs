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

test("server-renders the revised World Cup Duel game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /世界杯风云/);
  assert.match(html, /魔法数学/);
  assert.match(html, /双人博弈/);
  assert.doesNotMatch(html, /魔法帽游戏实验室|双人游戏 · 第 04 期/);
  assert.doesNotMatch(html, /<div class="hero-tags"[^>]*>.*17 回合.*扑克牌增益.*<\/div>/s);
});

test("counts one round only after both scheduled actions", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(roundSlot === 0\)/);
  assert.match(source, /setRoundSlot\(1\)/);
  assert.match(source, /handleCompletedRound\(roundInPhase \+ 1/);
  assert.match(source, /双方各行动一次才完成一回合/);
  assert.match(source, /prepAction === 9/);
});

test("uses the revised control formula and keeps bonus actions outside scheduled slots", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /stats\[current\]\.control - stats\[rival\]\.control \/ 2/);
  assert.match(source, /finishAction\(success \? 2 : 0\)/);
  assert.match(source, /不占用双方的正常行动位置/);
  assert.match(source, /bonusTurns > 0/);
});

test("implements regular time, extra time, penalties, and sudden death", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /phase === "secondHalf" && completedRounds === 6/);
  assert.match(source, /phase === "extraFirstHalf" && completedRounds === 3/);
  assert.match(source, /phase === "extraSecondHalf" && completedRounds === 3/);
  assert.match(source, /phase === "penalties" && completedRounds === 5/);
  assert.match(source, /phase === "suddenDeath" && penaltySnapshot\.p1 !== penaltySnapshot\.p2/);
  assert.match(source, /beginActionPhase\(\s*"suddenDeath"/s);
});

test("uses the revised open-play and penalty attack formulas", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const \[penaltyScore, setPenaltyScore\]/);
  assert.match(source, /stats\[current\]\.attack - stats\[defender\]\.defense \/ 2/);
  assert.match(source, /stats\[current\]\.attack - stats\[defender\]\.defense \/ \(defended \? 1 : 1\.5\)/);
  assert.match(source, /进攻 − 防守 ÷ 1\.5/);
  assert.match(source, /进攻 − 防守 ÷ 2/);
  assert.match(source, /className="penalty-scoreboard"/);
  assert.match(source, /disabled=\{!canAct \|\| penaltyPlay\}/);
  assert.match(source, /点球比分独立于常规及加时赛比分/);
});

test("formats fractional probabilities without long decimal noise", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function formatChance/);
  assert.match(source, /value\.toFixed\(2\)/);
  assert.match(source, /function formatPercent/);
  assert.match(source, /percent\.toFixed\(1\)/);
  assert.doesNotMatch(source, /\$\{chance \* 10\}%/);
});

test("uses a readable vertical match-report timeline", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
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
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.pitch-status strong\s*\{[^}]*font-family:\s*"Noto Sans SC",\s*"Microsoft YaHei",\s*sans-serif/s);
  assert.match(styles, /\.battle-log h3\s*\{[^}]*font-family:\s*"Noto Sans SC",\s*"Microsoft YaHei",\s*sans-serif/s);
});

test("carries a second-action defense into the next round", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const roundResolver = source.match(/function handleCompletedRound[\s\S]*?function advanceScheduledAction/)?.[0] ?? "";
  assert.match(source, /setDefenseReady\(\(previous\) => \(\{ \.\.\.previous, \[current\]: true \}\)\)/);
  assert.match(source, /\[otherPlayer\(current\)\]: false/);
  assert.doesNotMatch(roundResolver, /setDefenseReady/);
  assert.match(source, /防守待生效/);
});

test("keeps ability and probability limits", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Math\.max\(0, Math\.min\(10, value\)\)/);
  assert.match(source, /stats\[player\]\[key\] >= 15/);
  assert.match(source, /stats\[player\]\[key\] <= 0/);
});

test("offers all three team tiers with the revised ability values", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const TEAM_TIERS/);
  assert.match(source, /label: "一档"/);
  assert.match(source, /label: "二档"/);
  assert.match(source, /label: "三档"/);
  assert.match(source, /argentina:.*attack: 7, defense: 7, control: 8/);
  assert.match(source, /spain:.*attack: 6, defense: 8, control: 8/);
  assert.match(source, /capeVerde:.*attack: 4, defense: 8, control: 5/);
  assert.match(source, /egypt:.*attack: 6, defense: 5, control: 6/);
  assert.match(source, /<optgroup key=\{tier\.label\}/);
  assert.match(source, /className="team-catalog"/);
});

test("keeps the scoreboard clear of the pitch and draws standard goal areas", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const stadium = source.match(/<div className=\{`stadium[\s\S]*?\{teamZone\("p2", "bottom"\)\}/)?.[0] ?? "";
  assert.match(stadium, /className="scoreboard-rail"[\s\S]*className="football-pitch"/);
  assert.match(source, /className="goal-box top-goal-box"/);
  assert.match(source, /className="goal-box bottom-goal-box"/);
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.goal\s*\{[\s\S]*repeating-linear-gradient/);
  assert.match(styles, /\.scoreboard\s*\{[^}]*display:\s*flex/);
  assert.doesNotMatch(styles, /\.scoreboard\s*\{[^}]*position:\s*absolute/);
});

test("plays a goal and net-impact animation for the scoring side", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function triggerGoalEffect\(scorer: PlayerId\)/);
  assert.match(source, /if \(goal\) triggerGoalEffect\(current\)/);
  assert.match(source, /className="goal-shot-ball"/);
  assert.match(source, /className="goal-net-impact"/);
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /@keyframes goal-shot-down/);
  assert.match(styles, /@keyframes goal-shot-up/);
  assert.match(styles, /@keyframes net-burst-down/);
  assert.match(styles, /@keyframes net-burst-up/);
});

test("keeps hero copy clear of the right-side illustration at medium widths", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /@media \(max-width: 1000px\)[\s\S]*?\.hero-copy\s*\{\s*width:\s*52%/);
  assert.match(styles, /@media \(max-width: 1000px\)[\s\S]*?\.hero-description\s*\{\s*max-width:\s*400px/);
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*?\.hero-art\s*\{\s*right:\s*-170px/);
});
