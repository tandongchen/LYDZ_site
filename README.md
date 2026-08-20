<div align="center">
  <img src="./public/favicon.svg" width="112" alt="Magic Math M² Logo" />

  <h1>MAGIC MATH / 魔法数学</h1>

  <p><strong>Mathematics, made playable.</strong></p>

  <p>
    <a href="https://lydz-site.tandongchen499.workers.dev/">在线体验</a>
  </p>
</div>

## 关于项目

魔法数学是一个由游戏设计师持续创作的互动数学项目。它关注的不是把题目搬到屏幕上，而是把计算、逻辑、博弈与概率重新组织成可以操作、观察和反复推演的游戏规则。

这个仓库保存网站与互动作品的实现，也记录设计概念如何经过视觉、动效和程序逻辑，最终成为可以亲手体验的数字作品。

## 设计理念

- **规则驱动**：从清晰而有张力的规则出发，让选择本身构成游戏体验。
- **反馈可见**：通过即时反馈呈现抽象关系，让玩家能够观察、试错并形成自己的判断。
- **魔法与科技并存**：以克制的红蓝视觉、空间层次和动态细节，建立独立而统一的品牌语言。

## 技术基础

| 领域 | 实现 |
| --- | --- |
| 应用框架 | Next.js 16、React 19、TypeScript |
| 构建系统 | vinext、Vite |
| 动效 | GSAP、CSS Animation |
| 运行环境 | Cloudflare Workers |
| 状态管理 | React 客户端状态 |

当前版本不依赖外部业务 API 或持久化数据库。交互状态保存在浏览器会话中，刷新后会重新开始。

## 本地开发

需要 Node.js 22（最低 `22.13.0`），并使用仓库中的 `package-lock.json` 安装确定版本的依赖。

```bash
npm ci
npm run dev
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 生成生产构建 |
| `npm run start` | 启动已经生成的生产版本 |
| `npm run lint` | 执行代码静态检查 |
| `npm test` | 构建项目并运行服务器渲染与规则回归测试 |

## 部署

生产环境部署在 Cloudflare Workers。GitHub 仓库的 `main` 分支与 Cloudflare 构建流程连接，合并到 `main` 后会触发新的生产构建与发布。

部署使用 `npm run build` 生成 Worker 与静态资源产物。当前托管配置未启用 D1 或 R2 绑定。

## 项目状态

项目处于持续迭代阶段。视觉语言、交互方式和规则设计会随着新的实验逐步完善，但始终以清晰、可玩和可验证为核心。

## 版权与使用

本项目目前未采用开源许可证。源代码、游戏规则、品牌视觉与相关内容保留全部权利；如需引用、改编或用于商业项目，请先通过邮件取得书面授权。

## 联系

如果你有游戏灵感、规则构想、玩法问题或合作计划，欢迎通过邮件联系：

- [1224106085@qq.com](mailto:1224106085@qq.com)
- [tandongchen499@gmail.com](mailto:tandongchen499@gmail.com)
