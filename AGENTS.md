# AGENTS.md

## 适用范围

本文件适用于仓库根目录及其全部子目录。若将来某个子目录新增更具体的 `AGENTS.md`，以离目标文件最近的规则为准。

## 项目概览

- 这是一个中文本地双人世界杯策略游戏。玩家选择国家队，通过准备阶段加点、进攻、防守、控制和球队技能完成常规赛、加时赛与点球大战。
- 运行栈为 Next.js 16、React 19、TypeScript、vinext/Vite，以及 Cloudflare Worker。部署元数据由 `.openai/hosting.json` 和 `build/sites-vite-plugin.ts` 打包到 `dist/.openai/`。
- 当前游戏完全在浏览器内运行：状态保存在 React state 中，随机性来自 `Math.random()`，刷新页面会重置比赛；没有正在使用的持久化或外部 API。
- `package.json` 的名称和 `README.md` 仍带有 starter 痕迹。判断现有产品行为时，以 `app/page.tsx`、`app/globals.css` 和 `tests/rendered-html.test.mjs` 为准。
- 用户界面、比赛日志、规则说明和元数据均以简体中文为主，源文件必须保持 UTF-8 编码。

## 目录与职责

- `app/page.tsx`：核心客户端页面。球队资料、阶段状态机、概率公式、技能效果、比赛日志和主要 JSX 都在这里。
- `app/globals.css`：整站视觉样式、球场、记分牌、动画和响应式规则。
- `app/layout.tsx`：根布局和基于请求 Host 的 Open Graph/Twitter 元数据；当前使用 `/og-world-cup.png`。
- `app/chatgpt-auth.ts`：可选的 ChatGPT 登录辅助函数，当前首页未启用登录。
- `tests/rendered-html.test.mjs`：先加载构建后的 Worker 验证 SSR，再检查关键源码和 CSS 不变量。
- `worker/index.ts`：vinext 的 Cloudflare Worker 入口，并处理 `/_vinext/image` 图片优化。
- `vite.config.ts`：组合 vinext、Sites 打包插件与 Cloudflare Vite 插件，并模拟可选 D1/R2 绑定。
- `build/sites-vite-plugin.ts`：这是受版本控制的构建源代码，不是可随意删除的生成目录。
- `db/`：可选 D1/Drizzle 接入。`db/schema.ts` 当前刻意为空。
- `examples/d1/`：D1 示例代码，不属于当前游戏运行路径；除非明确启用数据库，否则不要把示例接入生产页面。
- `public/`：静态图标和分享图。
- `drizzle/`：Drizzle 迁移元数据；仅在真正修改数据库 schema 时更新。
- `dist/`、`.next/`、`.vinext/`、`.wrangler/`、`node_modules/`：生成内容或本地状态，不要手工编辑或提交。

## 环境与常用命令

- 要求 Node.js `>=22.13.0`，依赖管理器为 npm；保留并使用现有 `package-lock.json`。
- 安装依赖：`npm ci`（仅在依赖缺失或锁文件需要验证时运行）。
- 本地开发：`npm run dev`。
- 生产构建：`npm run build`。
- 启动构建结果：`npm run start`。
- 静态检查：`npm run lint`。
- 完整测试：`npm test`。该命令会先重建 `dist/`，再运行 Node 测试。
- 生成 Drizzle 迁移：`npm run db:generate`，仅用于有意启用或修改 D1 schema 的任务。

在 Windows PowerShell 中，如果执行策略阻止 `npm.ps1`，使用 `npm.cmd` 执行相同命令。

vinext 构建可能提示它暂时无法静态判定使用 `headers()` 的动态路由；只要构建退出码为 0，这条提示本身不是失败。

## 实现约定

- 遵循现有 TypeScript/React 风格：严格类型、2 空格缩进、双引号、分号、尾随逗号和函数式组件。
- 使用 `@/*` 路径别名时，它指向仓库根目录。
- `app/page.tsx` 顶部的类型和常量是游戏规则的集中定义。新增球队时同步更新 `TeamId`、`TEAM_DATA`、`TEAM_TIERS`；新增技能时同步更新 `TEAM_SKILLS`、激活逻辑、效果计算、界面说明和测试。
- 保持状态更新不可变，依赖旧值时使用函数式 setter。异步动画结束时，把已计算的比分快照传给阶段推进函数，避免读取陈旧 state。
- 概率统一使用 0–10 的内部刻度，通过 `clampChance()` 限制，再由 `formatChance()` 和 `formatPercent()` 输出；不要直接拼接浮点数。
- 新增用户可见规则时，同时维护现场状态文案、比赛日志、公式面板和下方规则说明，避免界面显示与实际计算不一致。
- 保留语义化按钮、禁用态和 `prefers-reduced-motion` 支持。调整布局时至少检查 1000px、800px 和 560px 三个现有断点。
- 中文正文优先使用完整中文字形字体栈，例如 `"Noto Sans SC", "Microsoft YaHei", sans-serif`；装饰标题可沿用现有书法/衬线字体。
- 不要把密钥或环境值写入源码；`.env*` 已被忽略。

## 游戏规则不变量

修改比赛逻辑前，应确认下列行为仍然成立；若产品需求确实改变它们，要同时修改实现、可见文案和测试：

- 每个正常回合包含双方各一次计划行动；只有第二个行动完成后才增加回合数。
- 准备阶段共五回合；常规赛上下半场各六回合；加时赛上下半场各三回合；初始点球阶段为五个完整回合，战平后进入突然死亡。
- 控制成功通常奖励两次额外行动；西班牙 Tiki-Taka 奖励三次。额外行动不占用双方的正常行动位置，且期间不能再次控制。
- 常规进攻概率为“进攻 − 防守 ÷ 1.3”；若对手已经防守，则为“进攻 − 防守”。点球概率为“进攻 − 防守 ÷ 1.5”。
- 防守状态一直保留到对手真正选择进攻；控制和额外行动不能清除它。巴西技能生效时，对手不能选择防守。
- 控制概率为“己方控制 − 对方控制 ÷ 2”。所有概率结果限制在 0–10，对应 0%–100%。
- 能力值操作范围为 0–15。临时技能效果按完成的正常比赛回合衰减。
- 常规/加时比分与点球比分分开保存；点球获胜不能改写常规比赛比分。
- 常规时间战平进入加时，加时仍平进入点球，突然死亡只在双方完成同一轮罚球后判定。
- 球队技能使用次数由双方档位差决定：`1 + max(0, 己方档位 - 对方档位)`。

## Cloudflare、认证与数据库边界

- `.openai/hosting.json` 当前将 `d1` 和 `r2` 设为 `null`。除非任务明确要求持久化，否则保持无绑定状态和纯客户端游戏。
- 若启用 D1，将 hosting 配置中的 `d1` 设为 `DB`，在 `db/schema.ts` 定义表，生成迁移，并为读写路径增加测试和错误处理。
- `app/chatgpt-auth.ts` 已校验同源相对 `returnTo`。不要放宽为外部 URL，以免引入开放重定向。
- `/signin-with-chatgpt`、`/signout-with-chatgpt` 和 `/callback` 由托管平台保留；不要在应用中创建同名路由。
- 使用逐请求身份头的页面必须在服务端读取身份，并标记为动态渲染；身份只代表登录，不自动证明工作区成员资格。
- Worker 的 `ASSETS`、`IMAGES` 和可选 `DB` 绑定名称与配置相互依赖，修改任一处时同步检查 `worker/index.ts`、`vite.config.ts` 和 hosting 配置。

## 测试与交付要求

- 文档或纯静态资源变更：至少确认文件内容和 `git diff`。
- TypeScript、React 或 CSS 变更：运行 `npm run lint`。
- 游戏规则、阶段推进、技能、SSR、布局结构或构建配置变更：运行 `npm test`；测试已包含完整构建。
- 数据库 schema 变更：运行 `npm run db:generate`，检查生成 SQL，再运行 lint 和相关测试。
- `tests/rendered-html.test.mjs` 有意使用正则守护函数名、公式、中文文案和 CSS 结构。重构这些区域时不要机械绕过断言；先确认不变量，再让测试准确表达新的预期。
- 随机玩法不要写依赖某次随机结果的脆弱测试。优先测试公式、阶段边界、状态传递、按钮可用性和固定的源码结构；若新增可测试逻辑，考虑先提取纯函数。
- 交付前检查 `git diff --check` 和 `git status --short`，不要把 `dist/`、缓存、日志或无关格式化改动带入提交。

## 修改原则

- 先定位最小改动面，保留用户已有的未提交更改，不覆盖无关文件。
- 不要仅修改视觉文案而遗漏规则实现，也不要仅修改公式而遗漏界面说明和回归测试。
- 避免无任务依据的大规模重写。`app/page.tsx` 虽然较大，但阶段推进函数之间共享大量状态；拆分前应先用现有测试固定行为。
- 引入新依赖前说明必要性；除非任务明确要求，不升级框架或重写锁文件。
