# SpeakBuddy AI

> AI 英语口语陪练 — 选场景、开口说、即时纠错

### 🔗 [体验：ai-oral-english-tutor-production.up.railway.app](https://ai-oral-english-tutor-production.up.railway.app)

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
