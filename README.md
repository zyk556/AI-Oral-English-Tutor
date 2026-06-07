# SpeakBuddy AI

> AI 英语口语陪练 — 选场景、开口说、即时纠错

### 🔗 [体验：ai-oral-english-tutor-production.up.railway.app](https://ai-oral-english-tutor-production.up.railway.app)

### 🎬 Demo 视频链接
- [哔哩哔哩](https://www.bilibili.com/video/BV1rjEh6qEjD/?vd_source=686c6175dd8a22dcc828d6452f09e2b3)
- [夸克网盘](https://pan.quark.cn/s/07c240927951?pwd=MTdU)

---

## ✨ 功能一览

| 功能 | 说明 |
|------|------|
| 🎭 8 个场景 | 面试 · 餐厅 · 会议 · 问路 · 看病 · 机场 · 酒店 · 约会 |
| 🎙️ 语音对话 | 点击麦克风说话，AI 实时回复 + 语音播报 |
| 📝 语法纠错 | 逐条标注错误，附纠正版本和语法解释 |
| 💡 词汇建议 | 推荐更地道的用词表达 |
| ⭐ 四维评分 | 流畅度 · 语法 · 词汇 · 综合（1-10 分） |
| 🌐 中文翻译 | AI 回复自动翻译，点击展开 |
| 🎧 纯听模式 | 隐藏文字，纯听力训练 |
| 📊 难度选择 | Easy / Mid / Hard 三档 |
| 📖 现场查词 | 左下角词典，即输即查 |
| 🔊 语音设置 | 4 种音色 · 3 档语速 · 音量调节 · 试听 |

## 🛠️ 技术栈

```
前端  React 18 + TypeScript + Vite + Tailwind CSS + Zustand
后端  Hono + Node.js + WebSocket
AI   小米 MiMo API（对话 + 语音合成）
语音  浏览器 Web Speech API
```

## 📦 依赖说明

### 前端依赖

| 依赖 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS v4 | 样式系统 |
| Zustand | 全局状态管理 |
| react-icons | 图标库 |

### 后端依赖

| 依赖 | 用途 |
|------|------|
| Hono | Web 框架 + WebSocket |
| @hono/node-server | Node.js HTTP 适配 |
| @hono/node-ws | WebSocket 支持 |
| tsx | TypeScript 运行时 |
| dotenv | 环境变量加载 |

### 外部 API

| 服务 | 用途 |
|------|------|
| 小米 MiMo API | 大语言模型对话、语音合成 |
| Dictionary API (dictionaryapi.dev) | 英文单词查询（免费） |

### 原创功能部分

以下功能为本项目原创设计与实现：

1. **双角色 LLM 架构** — 一次对话调用同时生成对话回复和英语评估，评估 prompt 设计为返回结构化 JSON（语法纠错、词汇建议、四维评分）
2. **三栏 Apple 风格界面** — 左侧场景选择 + 中央对话区 + 右侧评分/设置面板，采用毛玻璃、圆角卡片、渐变色等 Apple 设计语言
3. **折叠式纠错卡片** — 评分以折叠气泡展示，点击展开详情到右侧面板，延迟纠错不打断对话流
4. **场景随机语境系统** — 每个场景内置 6 个随机背景设定，首次选择生成，支持手动刷新
5. **多场景独立记录** — 按场景隔离聊天历史，切换场景不丢失对话
6. **浏览器语音 + AI 闭环** — Web Speech API 语音识别 → MiMo 对话 → MiMo TTS 播报，全链路无需第三方语音服务
7. **实时查词卡片** — 左下角词典组件，调用免费 Dictionary API + MiMo 翻译，即输即查中英释义

## 📁 项目结构

```
speakbuddy/
├── backend/
│   ├── server.ts          # WebSocket + AI 调用 + 静态文件服务
│   ├── .env.example       # 环境变量模板
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx              # 主界面
    │   ├── store.ts             # 全局状态
    │   ├── hooks/               # WebSocket + 语音识别
    │   └── components/          # UI 组件
    └── vite.config.ts
```

## 📄 License

MIT
