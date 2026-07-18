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

test("server-renders the World Cup Duel game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>世界杯风云｜本地双人足球策略游戏<\/title>/i);
  assert.match(html, /世界杯风云/);
  assert.match(html, /选择对阵球队/);
  assert.match(html, /玩家一/);
  assert.match(html, /玩家二/);
  assert.match(html, /进攻/);
  assert.match(html, /防守/);
  assert.match(html, /控制/);
  assert.match(html, /阿根廷/);
  assert.match(html, /西班牙/);
  assert.match(html, /法国/);
  assert.match(html, /英格兰/);
  assert.match(html, /葡萄牙/);
});

test("implements all three probability formulas and their limits", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /stats\[current\]\.attack - stats\[defender\]\.defense \/ \(defended \? 1 : 2\)/);
  assert.match(source, /stats\[current\]\.control - stats\[rival\]\.control/);
  assert.match(source, /Math\.max\(0, Math\.min\(10, value\)\)/);
  assert.match(source, /chance \/ 10/);
});

test("keeps the requested 5 plus 6 plus 6 round structure", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /prepTurn === 4/);
  assert.match(source, /nextTurn === 6/);
  assert.match(source, /nextTurn >= 12/);
  assert.match(source, /otherPlayer\(firstHalfStarter\)/);
});

test("supports red and black card allocation and halftime points", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /setBoostLeft\(card\.red \? 2 : 1\)/);
  assert.match(source, /setSabotageLeft\(card\.red \? 0 : 1\)/);
  assert.match(source, /setHalftimePoints\(3\)/);
  assert.match(source, /stats\[player\]\[key\] >= 15/);
  assert.match(source, /stats\[player\]\[key\] <= 0/);
});

test("grants two control turns and disables repeated control", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /finishMatchAction\(success \? 2 : 0\)/);
  assert.match(source, /bonusTurns > 0/);
  assert.match(source, /额外回合禁用/);
});
