# AGENTS.md

## 适用范围

本文件适用于仓库根目录及其全部子目录。若子目录以后增加更具体的 `AGENTS.md`，以距离目标文件最近的规则为准。

## 项目概览

- 这是“魔法数学 / MAGIC MATH”互动数学游戏网站，包含品牌首页、集中规则档案、合作联系页和多个可独立游玩的数学游戏。
- 项目使用 Next.js 16、React 19、TypeScript、vinext/Vite 和 Cloudflare Worker；生产环境由连接 GitHub `main` 分支的 Cloudflare 构建流程发布。
- 网站以简体中文为主，视觉语言为克制的红蓝科技与魔法融合风格。新增界面必须延续现有品牌系统，拒绝模板化和明显的 AI 生成感。
- 当前交互状态保存在 React 客户端 state 中，随机性来自 `Math.random()`；刷新页面会重置游戏，没有正在使用的外部业务 API 或持久化数据库。
- 源文件统一使用 UTF-8 与 LF。Node.js 使用 22 系列（最低 `22.13.0`），依赖管理器为 npm，并保留现有 `package-lock.json`。

## 目录与职责

- `app/page.tsx`：品牌首页及项目入口。
- `app/globals.css`：首页、导航、品牌视觉、响应式布局和全局动效。
- `app/layout.tsx`：根布局、站点元数据、图标和全局魔法棒光标。
- `app/components/`：Logo、导航、搜索、粒子字标、Shuffle 标题和星系入口等共享组件。
- `app/games/catalog.ts`：游戏目录、分组、标题、描述、路由和精选封面的单一数据源。
- `app/games/game-layout-shell.tsx` 与 `app/games/game-route.css`：游戏页面共享外壳和统一红蓝主题。
- `app/games/*/page.tsx`：各游戏规则逻辑、状态和主要 JSX；同目录 `game.css` 只作用于对应路由。
- `app/rules/`：统一规则档案；游戏页不再重复展示完整规则讲述。
- `app/contact/`：合作联系页。
- `tests/rendered-html.test.mjs`：构建后 Worker SSR、页面结构、视觉隔离和游戏规则回归测试。
- `worker/index.ts`：Cloudflare Worker 入口及图片优化处理。
- `vite.config.ts`：组合 vinext、Sites 打包插件与 Cloudflare Vite 插件，并配置可选绑定。
- `build/sites-vite-plugin.ts`：受版本控制的构建源代码，不是可删除的生成目录。
- `.openai/hosting.json`：Cloudflare/Sites 托管元数据；当前未启用 D1 或 R2。
- `db/`、`drizzle/` 与 `examples/d1/`：可选 D1/Drizzle 接入及示例，默认不在生产运行路径中。
- `public/`：品牌图标、视频和精选项目图像等静态资源。
- `dist/`、`.next/`、`.vinext/`、`.wrangler/`、`node_modules/`：生成内容或本地状态，禁止手工编辑或提交。

## 常用命令

- 安装依赖：`npm ci`。
- 本地开发：`npm run dev`。
- 生产构建：`npm run build`。
- 启动构建结果：`npm run start`。
- 静态检查：`npm run lint`。
- 完整测试：`npm test`。该命令会先重建 `dist/`，再运行 Node 测试。
- 生成 Drizzle 迁移：`npm run db:generate`，仅用于明确启用或修改 D1 schema 的任务。

Windows PowerShell 若因执行策略阻止 `npm.ps1`，使用 `npm.cmd` 执行相同命令。vinext 构建可能提示无法静态判定使用 `headers()` 的动态路由；构建退出码为 0 时，该提示本身不是失败。

## 实现约定

- 遵循现有 TypeScript/React 风格：严格类型、2 空格缩进、双引号、分号、尾随逗号和函数式组件。
- `@/*` 路径别名指向仓库根目录。
- 新增游戏时，先更新 `app/games/catalog.ts`，再添加独立路由、命名空间样式、规则档案内容和对应测试；首页入口、搜索和计数应继续从目录数据派生。
- 状态更新保持不可变；依赖旧值时使用函数式 setter。异步动画结束时传递已计算快照，避免读取陈旧 state。
- 用户可见规则必须与实际逻辑一致。完整说明集中维护在规则档案中，游戏页面只保留完成操作所必需的即时提示。
- 保留语义化按钮、键盘操作、禁用态与 `prefers-reduced-motion` 支持。调整布局时至少检查 1000px、800px 和 560px 三个现有断点。
- 中文正文使用完整中文字形字体栈，例如 `"Noto Sans SC", "Microsoft YaHei", sans-serif`；装饰标题可沿用现有品牌字体。
- 不要在源码中写入密钥或真实环境值；`.env*` 已被忽略。

## 世界杯风云规则不变量

修改 `app/games/world-cup/page.tsx` 的比赛逻辑前，应确认以下行为仍成立。若产品需求改变它们，必须同步修改实现、可见文案和回归测试：

- 每个正常回合包含双方各一次计划行动；只有第二个行动完成后才增加回合数。
- 准备阶段共五回合；常规赛上下半场各六回合；加时赛上下半场各三回合；初始点球阶段为五个完整回合，战平后进入突然死亡。
- 控制成功通常奖励两次额外行动；西班牙 Tiki-Taka 奖励三次。额外行动不占双方正常行动位置，且期间不能再次控制。
- 常规进攻概率为“进攻 − 防守 ÷ 1.3”；若对手已经防守，则为“进攻 − 防守”。点球概率为“进攻 − 防守 ÷ 1.5”。
- 防守状态保留到对手真正进攻；控制和额外行动不能清除。巴西技能生效时，对手不能选择防守。
- 控制概率为“己方控制 − 对方控制 ÷ 2”。概率统一使用 0–10 内部刻度并限制在该范围，再格式化为百分比。
- 能力值操作范围为 0–15。临时技能效果按完成的正常比赛回合衰减。
- 常规/加时比分与点球比分分开保存；点球获胜不能改写常规比赛比分。
- 常规时间战平进入加时，加时仍平进入点球；突然死亡只在双方完成同一轮罚球后判定。
- 球队技能使用次数由双方档位差决定：`1 + max(0, 己方档位 - 对方档位)`。

## Cloudflare、认证与数据库边界

- `.openai/hosting.json` 当前将 `d1` 和 `r2` 设为 `null`。除非任务明确要求持久化，否则保持无绑定和纯客户端运行方式。
- 若启用 D1，将 hosting 配置中的 `d1` 设为 `DB`，在 `db/schema.ts` 定义表，生成迁移，并为读写路径增加测试和错误处理。
- `app/chatgpt-auth.ts` 只接受同源相对 `returnTo`；不得放宽为外部 URL。
- `/signin-with-chatgpt`、`/signout-with-chatgpt` 和 `/callback` 由托管平台保留，不要创建同名应用路由。
- Worker 的 `ASSETS`、`IMAGES` 和可选 `DB` 绑定与配置相互依赖；修改时同步检查 `worker/index.ts`、`vite.config.ts` 和 hosting 配置。

## 测试与交付

- 文档或纯静态资源变更：至少检查文件内容、引用关系与 `git diff`。
- TypeScript、React 或 CSS 变更：运行 `npm run lint`。
- 游戏规则、阶段推进、技能、SSR、布局结构或构建配置变更：运行 `npm test`；测试已包含完整生产构建。
- 数据库 schema 变更：运行 `npm run db:generate`，检查生成 SQL，再运行 lint 和相关测试。
- 随机玩法测试不要依赖某次随机结果。优先测试公式、阶段边界、状态传递、按钮可用性和固定结构。
- 交付前运行 `git diff --check` 与 `git status --short`，不得提交生成目录、缓存、日志、密钥或无关格式化改动。

## 修改原则

- 先定位最小改动面，保留用户已有更改，不覆盖无关文件。
- 不只修改视觉文案而遗漏规则实现，也不只修改逻辑而遗漏规则档案和测试。
- 避免无任务依据的大规模重写。多个游戏页面共享既有视觉与交互约定，拆分前应先用测试固定行为。
- 引入新依赖前说明必要性；除非任务明确要求，不升级框架或重写锁文件。
