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

test("server-renders the Nim game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>尼姆博弈｜魔法数学<\/title>/i);
  assert.match(html, /最后一朵花/);
  assert.match(html, /决定胜负！/);
  assert.match(html, /双人数学策略小游戏/);
  assert.match(html, /布置这一桌小花/);
  assert.match(html, /谁先开始/);
  assert.match(html, /随机开一局/);
  assert.match(html, /一次只能从同一堆拿花/);
  assert.match(html, /取走桌上最后一朵花的人立即获胜/);
  assert.match(html, /行动记录/);
  assert.match(html, /每一次选择都至关重要/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});
