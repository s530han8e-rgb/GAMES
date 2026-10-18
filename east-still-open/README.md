# 东区仍在开放

浏览器互动叙事推理游戏，使用 React、TypeScript 和 Vite。当前版本：`0.2.0-demo.20261014.3`，包含正式起始封面及既有局部动画。

中文叙事、英文行动、调查、证据、有限推论、两条互斥路线、最终通信及三个结局已接通。全程无声，采用预写内容和浏览器本地存档，无运行时 AI、账号、支付或在线聊天。

这是持续维护的可玩 Demo，`releaseApproved` 仍为 `false`。真人时长、文化审核、行动主导感及英文负担尚待真人验证；Windows 实机及其他未实测平台也不能视为验收通过。路线跑通不等于全部需求最终通过。

## 本地开发

使用 Node.js 24 LTS 和 npm，在本文件所在目录依次执行：

```sh
npm ci
npm run dev -- --port 5174 --strictPort
```

正常游戏：<http://127.0.0.1:5174/>。开发专用审核页：<http://127.0.0.1:5174/review/>。审核展示状态与真实游戏存档分离，正式构建不包含审核模块或目录入口。

## 构建与本地试玩

```sh
npm run build
npm run demo
```

构建位于 `dist/`。本地试玩服务默认使用 4176 端口；被占用时会选择后续空闲端口，以启动输出显示的地址为准。保持服务运行，网页才能打开。`127.0.0.1` 地址仅供当前电脑访问。

本仓库不携带 Node 可执行文件。Windows/Mac 的独立试玩包另外交付，不要直接将源码目录内的启动文件视为已附运行组件的独立安装包。

## 检查

```sh
npm run check:types
npm test
npm run check:full
```

规则测试中的构建检查需要先执行 `npm run build`。完整检查使用 Playwright 和已安装的 Google Chrome，会检查正常流程、路线、结局、重试、存档恢复及代表界面；结果写入本地 `checks/`。测试程序可能包含剧情答案，不应在第一遍试玩前发给参与者。

`npm run check:watch` 开启本地保存检查，`npm run check:stop` 停止。GAMES 仓库根目录已准备提交自动检查流程，检查游戏目录的 push、pull request，并允许手动触发。云端是否通过以 Actions 实际结果为准。

## 文件范围

- `src/`：游戏、界面、正式素材配置、预写内容及开发审核组件。
- `public/art/formal/`：已选正式素材；`public/art/covers/`：独立起始封面。
- `public/fonts/`：字体授权；字体依赖由 `package-lock.json` 固定。
- `scripts/`、`tests/`：本地服务和可复现检查程序。

不纳入仓库：原始研究文档、身份参考板、历史图片候选、试玩 ZIP、便携运行组件、恢复包、生成的构建、依赖目录及测试截图/日志。游戏运行依赖的 `src/data/rpd.json` 保留，它包含预写内容及制作约束；项目所有者已明确确认将这些游戏文件公开存放在 GAMES/east-still-open 中；原始研究文档仍不纳入。

## 使用与发布边界

游戏剧情、美术和研究相关内容没有因此被授予开源许可。字体遵循各自随附授权；其他依赖遵循其原有许可证。本目录已按项目所有者确认公开存放，但尚未部署为在线试玩网站，也不代表真人体验、文化审核或最终发布验收完成。网站部署仍须另行确认。

## 提交自动检查

入口：[GAMES Actions](https://github.com/s530han8e-rgb/GAMES/actions/workflows/east-still-open-tests.yml)。本项目目录或检查流程变更时自动运行；不自动修改游戏、不部署网站、也不调用 AI。

本地同等检查：`npm run check:ci`，随后 `npm run check:ci-report`。需要已安装 Google Chrome；云端使用标准 Ubuntu 24.04、Node.js 24 和 Chrome，不能代表 Windows/macOS 实机或全浏览器通过。

摘要列出各阶段结果和失败位置；Actions 日志保存完整命令输出。附件最多 8 MiB、六张代表截图、保留一天；未收录项列在 attachment-index.json。截图和几何断言不能自动裁定美术、文化或真人体验。报告仅含模拟游戏状态和截图。

公开仓库标准运行器执行时间按 GitHub 当前政策免费；附件存储仍受账号额度约束，不上传完整历史截图、构建或试玩包，不开启依赖缓存。参见 [GitHub Actions 计费说明](https://docs.github.com/en/billing/concepts/product-billing/github-actions)。
