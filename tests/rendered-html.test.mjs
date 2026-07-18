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

test("uses a separate penalty score and the attack minus defense over three formula", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const \[penaltyScore, setPenaltyScore\]/);
  assert.match(source, /stats\[current\]\.attack - stats\[defender\]\.defense \/ 3/);
  assert.match(source, /className="penalty-scoreboard"/);
  assert.match(source, /disabled=\{!canAct \|\| penaltyPlay\}/);
  assert.match(source, /点球比分独立于常规及加时赛比分/);
});

test("keeps ability and probability limits", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Math\.max\(0, Math\.min\(10, value\)\)/);
  assert.match(source, /stats\[player\]\[key\] >= 15/);
  assert.match(source, /stats\[player\]\[key\] <= 0/);
});
