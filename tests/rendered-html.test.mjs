import assert from "node:assert/strict";
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

test("server-renders the Number Bomb game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>数字炸弹｜多人猜数字派对游戏<\/title>/i);
  assert.match(html, /召集你的队伍/);
  assert.match(html, /选择参加人数/);
  assert.match(html, /每位玩家代表一支队伍/);
  assert.match(html, /魔法数学/);
  assert.match(html, /格兰芬多/);
  assert.match(html, /斯莱特林/);
  assert.match(html, /拉文克劳/);
  assert.match(html, /赫奇帕奇/);
  assert.match(html, /埋下炸弹/);
  assert.match(html, /别猜中它/);
  assert.match(html, /让范围越来越小/);
  assert.match(html, /2—4 名玩家/);
  assert.doesNotMatch(html, /数字实验室|NO\. 03|NUMBER BOMB · 2026/);
  assert.match(html, /缩小范围/);
  assert.match(html, /猜中系统随机生成的秘密数字/);
  assert.doesNotMatch(html, /层叠消融|目标图形|codex-preview|SkeletonPreview/i);
});
