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

test("server-renders the Arrow Maze game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>箭阵迷域｜魔法数学<\/title>/i);
  assert.match(html, /一次落点/);
  assert.match(html, /引爆整座迷域！/);
  assert.match(html, /数学思维小游戏/);
  assert.match(html, /选择迷域规模/);
  assert.match(html, /随机生成新迷域/);
  assert.match(html, /你只有一次点击机会/);
  assert.match(html, /每支箭击中该方向上最近的方格/);
  assert.match(html, /清空棋盘即胜利/);
  assert.match(html, /连锁轨迹/);
  assert.match(html, /一次机会，深思熟虑/);
  assert.match(html, /data-solution-count="[1-3]"/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});
