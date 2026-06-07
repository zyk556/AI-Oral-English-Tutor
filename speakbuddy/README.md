# SpeakBuddy AI — 英语口语陪练

一个基于浏览器的 AI 英语口语练习工具。用户选择对话场景，通过语音与 AI 进行实时英语对话，系统提供语法纠错、词汇建议、四维评分和中文翻译。

## 功能特性

- **8 个对话场景**：面试、餐厅、会议、问路、看病、机场、酒店、约会
- **浏览器语音识别**：点击麦克风开始录音，再点停止，支持长时间思考
- **AI 对话回复**：小米 MiMo 大模型根据场景生成自然对话
- **语音合成**：MiMo TTS 将 AI 回复转成语音，支持 4 种英文音色
- **双角色 LLM**：一次调用同时生成对话回复 + 英语评估
- **语法纠错**：逐条列出语法错误，附纠正和解释
- **词汇建议**：推荐更好的用词表达
- **四维评分**：流畅度、语法、词汇、综合（1-10 分）
- **中文翻译**：AI 回复自动翻译为中文
- **纯听模式**：隐藏文字，纯听力练习，可临时查看字幕
- **难度选择**：Easy / Mid / Hard 三档，调整 AI 用词复杂度
- **现场查词**：左下角词典卡片，输入单词即查词性 + 中文释义
- **语音设置**：4 种音色（Chloe/Mia/Milo/Dean）、3 档语速、音量调节、试听
- **多场景独立记录**：每个场景独立保存聊天历史，切换不丢失
- **随机语境**：每次选择场景随机生成沉浸式背景设定

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS v4 + Zustand |
| 后端 | Hono + Node.js (tsx) + WebSocket |
| AI | 小米 MiMo API（对话 + ASR + TTS） |
| 语音识别 | 浏览器 Web Speech API（免费） |

## 项目结构

```
speakbuddy/
├── backend/
│   ├── server.ts              # WebSocket 服务 + LLM/TTS 调用 + 静态文件服务
│   ├── .env                   # MIMO_API_KEY
│   ├── .env.example           # 环境变量模板
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── vite.config.ts         # Vite + Tailwind + WebSocket/API 代理
│   ├── index.html
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── index.css          # Apple 设计系统 + 动画
│       ├── App.tsx            # 三栏布局主界面
│       ├── store.ts           # Zustand 全局状态
│       ├── hooks/
│       │   ├── useWebSocket.ts          # WebSocket 通信
│       │   └── useSpeechRecognition.ts  # 浏览器语音识别
│       └── components/
│           ├── ScenarioSelector.tsx  # 场景选择网格
│           ├── ChatBubble.tsx        # 聊天气泡 + 音频控制
│           ├── CorrectionCard.tsx    # 评分气泡（折叠）
│           ├── EvaluationPanel.tsx   # 评分详情面板（右侧展开）
│           ├── VoiceSettings.tsx     # 语音设置面板
│           └── DictionaryCard.tsx    # 查词卡片
└── README.md
```

## 快速开始

### 1. 申请 API Key

前往 [小米 MiMo 开放平台](https://platform.xiaomimimo.com) 注册并获取 API Key。

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入你的 MIMO_API_KEY
```

### 3. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 4. 启动

```bash
# 终端 1 - 后端
cd backend
npm run dev

# 终端 2 - 前端（开发模式）
cd frontend
npm run dev
```

打开 http://localhost:5173

### 5. 生产部署

```bash
# 打包前端到 backend/public
cd frontend
npm run build
cp -r dist ../backend/public

# 启动后端（自动服务前端静态文件）
cd ../backend
npm run dev
```

### 6. 公网访问（临时）

```bash
npx cloudflared tunnel --url http://localhost:3000
```

会生成一个 `https://xxx.trycloudflare.com` 公网地址。

=
## 环境变量

```
# .env
MIMO_API_KEY=你的小米MiMo API Key
```

## License

MIT
