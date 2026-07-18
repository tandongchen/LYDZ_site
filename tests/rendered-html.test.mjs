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

test("server-renders the Wild Horse Race game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-CN"/i);
  assert.match(html, /<title>御马狂飙｜2 人 \/ 4 人扑克牌赛马游戏<\/title>/i);
  assert.match(html, /御马狂飙/);
  assert.match(html, /选择你的比赛阵容/);
  assert.match(html, /双马对决/);
  assert.match(html, /四马争霸/);
  assert.match(html, /交换红马与黑马/);
  assert.match(html, /系统会自动洗牌/);
  assert.match(html, /发牌开赛/);
  assert.match(html, /一副牌，两种赛制/);
  assert.match(html, /手动揭晓关卡/);
  assert.match(html, /由玩家点击赛道上的关卡牌手动翻开/);
  assert.match(html, /率先越线夺冠/);
  assert.match(html, /魔法数学/);
  assert.match(html, />博弈</);
  assert.doesNotMatch(html, /约 10 分钟|数字炸弹|codex-preview|SkeletonPreview/i);
});
