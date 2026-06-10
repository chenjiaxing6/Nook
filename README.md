# Nook · 隅

> 一个基于 Tauri、Vue 3 和 TypeScript 构建的本地桌面效率工作台。

## 项目简介

Nook · 隅是一个面向个人使用的桌面端效率工具。它把常用的工作流放在一个轻量的本地应用里：你可以管理待办、查看日历、记录 Markdown 笔记、追踪完成历史，也可以通过插件扩展专注计时、效率洞察等能力。

项目采用本地优先设计。浏览器开发环境下数据会存储在 `localStorage`，Tauri 桌面环境下会迁移并写入本地 SQLite 数据库。

## 主要功能

- 工作台仪表盘：支持添加、移除、拖动和缩放小组件。
- 待办事项：按日期管理任务，记录完成状态和完成时间。
- 日历视图：查看月份、节假日、调休信息和当天任务。
- Markdown 笔记：支持笔记搜索、文件夹/树结构管理和富文本 Markdown 编辑体验。
- 完成记录：集中查看已完成任务，回顾近期进展。
- 插件系统：内置专注计时器和效率洞察插件，支持安装、启用和停用。
- 设置中心：管理主题、外观和开发者模式。
- 数据库视图：开发者模式下可查看和调试本地 SQLite 数据。
- 自动构建：通过 GitHub Actions 构建 macOS、Windows 和 Linux 桌面安装包。

## 技术栈

- 前端框架：Vue 3、TypeScript、Vite
- 桌面运行时：Tauri 2、Rust
- 状态管理：Pinia
- 路由：Vue Router
- Markdown 编辑：Vditor、marked、highlight.js
- 图表：Chart.js、vue-chartjs
- 本地数据库：SQLite、rusqlite
- 自动构建：GitHub Actions、tauri-apps/tauri-action

## 快速开始

### 环境要求

- Node.js 22 或更高版本
- npm
- Rust stable
- Tauri 2 所需系统依赖

Linux 开发环境需要安装 WebKitGTK 等依赖，具体可参考 Tauri 官方文档。

### 安装依赖

```bash
npm install
```

### 启动 Web 开发环境

```bash
npm run dev
```

默认 Vite 端口为 `1420`。

### 启动 Tauri 桌面开发环境

```bash
npm run tauri dev
```

### 构建前端

```bash
npm run build
```

### 构建桌面应用

```bash
npm run tauri build
```

构建产物会生成在 `src-tauri/target/` 下。

## 常用脚本

```bash
npm run dev       # 启动 Vite 开发服务
npm run build     # TypeScript 检查并构建前端
npm run preview   # 预览前端生产构建
npm run tauri     # 调用 Tauri CLI
```

## 目录结构

```text
.
├── .github/workflows/       # GitHub Actions 自动构建配置
├── mockups/                 # 设计稿和实验页面
├── public/                  # 静态资源
├── src/                     # Vue 前端源码
│   ├── components/          # 通用组件
│   ├── data/                # 节假日等静态数据
│   ├── plugins/             # 插件注册与插件组件
│   ├── stores/              # Pinia 状态管理
│   ├── views/               # 页面视图
│   ├── App.vue              # 应用主壳
│   ├── main.ts              # 前端入口
│   ├── router.ts            # 路由配置
│   └── storage.ts           # 本地存储封装
└── src-tauri/               # Tauri / Rust 桌面端源码
    ├── src/                 # Rust 命令和数据库逻辑
    ├── icons/               # 应用图标
    ├── Cargo.toml           # Rust 依赖配置
    └── tauri.conf.json      # Tauri 应用配置
```

## 数据存储

项目通过 `src/storage.ts` 统一读写数据：

- Web 开发环境：使用 `localStorage`
- Tauri 桌面环境：使用 Rust 命令写入 SQLite

桌面端首次读取时会尝试从旧的 `localStorage` 数据迁移到 SQLite，减少开发和桌面环境之间的数据断层。

## 插件说明

插件位于 `src/plugins/`，当前内置：

- `productivity-insights`：效率洞察，汇总待办、完成记录和最近笔记。
- `focus-timer`：专注计时器，支持专注、短休息、长休息计时。

新增插件时，需要导出符合 `Plugin` 类型的配置，并在 `src/plugins/index.ts` 中注册。

## 自动构建

仓库包含 GitHub Actions workflow：

```text
.github/workflows/build.yml
```

触发条件：

- push 到 `main` 或 `master`
- pull request 到 `main` 或 `master`
- 推送 `v*` tag
- 手动触发 workflow

推送 tag 时会自动创建 GitHub Release，并上传 macOS、Windows、Linux 的 Tauri 构建产物。也可以在 GitHub Actions 页面手动触发构建。

## 开发备注

- 开发者模式快捷键：`Cmd/Ctrl + Shift + D`
- 开发者模式开启后，会显示数据库视图。
- `src-tauri/Cargo.lock` 应提交到仓库，以保证桌面构建依赖稳定。

## License

目前未指定开源协议。如需公开分发，建议补充合适的 License 文件。
