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

test("server-renders the Parity Fusion game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>层叠消融｜魔法数学<\/title>/i);
  assert.match(html, /把重叠，变成/);
  assert.match(html, /选择图形个数/);
  assert.match(html, /随机生成新目标/);
  assert.match(html, /目标图形/);
  assert.match(html, /答题区域/);
  assert.match(html, /整体位置不同也能判定成功/);
  assert.match(html, /位置不限/);
  assert.match(html, /黑白无间道/);
  assert.match(html, /奇数层保留黑色，偶数层消成白色/);
  assert.match(html, /选择 1—5 块图形/);
  assert.match(html, /藏在重叠里的数学/);
  assert.match(html, /方向键可微调/);
  assert.doesNotMatch(html, /叠一叠，消一消/);
  assert.doesNotMatch(html, /箭阵迷域|codex-preview|SkeletonPreview|react-loading-skeleton/i);
});
