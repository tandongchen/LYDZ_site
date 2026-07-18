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

test("server-renders the Chu-Han Contention game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>楚汉之争｜玩家与 AI 的双人扑克牌战术游戏<\/title>/i);
  assert.match(html, /楚汉之争/);
  assert.match(html, /选择你的阵营/);
  assert.match(html, /乱世枭雄/);
  assert.match(html, /运筹帷幄/);
  assert.match(html, /列阵开战/);
  assert.match(html, /八战场，一套兵法/);
  assert.match(html, /同花顺/);
  assert.match(html, /大获全胜/);
  assert.match(html, /势如破竹/);
  assert.match(html, /边路突袭/);
  assert.match(html, /魔法数学/);
  assert.match(html, /纸牌兵法 · 双人对决/);
  assert.doesNotMatch(html, /御马狂飙|数字炸弹|codex-preview|SkeletonPreview/i);
});
