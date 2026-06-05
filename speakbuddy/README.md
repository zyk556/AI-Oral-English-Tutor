# SpeakBuddy - AI English Speaking Practice

A browser-based English speaking practice tool. Users select a conversation scenario (Interview / Restaurant / Meeting), hold to speak, and have a real-time voice conversation with AI. The system provides speech recognition, AI responses, and text-to-speech playback.

## Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand
**Backend:** Hono + Bun + Deepgram (STT) + OpenAI (Chat + TTS)

## Project Structure

```
speakbuddy/
├── backend/
│   ├── server.ts          # WebSocket server with Deepgram + OpenAI integration
│   ├── .env               # API keys (fill in your own)
│   └── package.json
├── frontend/
│   ├── vite.config.ts     # Vite config with Tailwind + WebSocket proxy
│   ├── index.html
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx            # Main UI: scenario selector + chat + record button
│   │   ├── store.ts           # Zustand global state
│   │   ├── index.css          # Tailwind import
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts  # WebSocket connection management
│   │   └── components/
│   │       ├── ScenarioSelector.tsx  # Scenario selection buttons
│   │       ├── ChatBubble.tsx        # Chat message bubble
│   │       └── RecordButton.tsx      # Hold-to-record microphone button
│   └── package.json
└── README.md
```

## Setup

### Prerequisites
- [Bun](https://bun.sh/) (or Node.js 18+)
- Deepgram API key ([get one here](https://deepgram.com/))
- OpenAI API key ([get one here](https://platform.openai.com/))

### 1. Configure API Keys

Edit `backend/.env` and fill in your API keys:

```
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
```

### 2. Install Dependencies

```bash
# Backend
cd backend
bun install

# Frontend
cd ../frontend
bun install
```

### 3. Run the App

```bash
# Terminal 1 - Start backend
cd backend
bun run dev

# Terminal 2 - Start frontend
cd frontend
bun run dev
```

Open http://localhost:5173 in your browser.

## How It Works

1. **Select a Scenario** - Choose from Interview, Restaurant, or Meeting
2. **Hold to Speak** - Press and hold the microphone button to record
3. **AI Responds** - Your speech is transcribed via Deepgram, GPT-4o-mini generates a reply, and TTS reads it back
4. **Chat History** - All messages appear as chat bubbles with optional audio playback

## WebSocket Protocol

| Direction | Message | Format |
|-----------|---------|--------|
| Client → Server | Set scenario | `{ type: "set_scenario", scenario: "interview" }` |
| Client → Server | Audio data | Binary (webm/opus, 200ms chunks) |
| Server → Client | Ready | `{ type: "ready", message: "Connected" }` |
| Server → Client | User transcript | `{ type: "user_text", text: "..." }` |
| Server → Client | AI reply text | `{ type: "ai_text", text: "..." }` |
| Server → Client | Scenario set | `{ type: "scenario_set", scenario: "..." }` |
| Server → Client | AI voice | Binary (mp3) |

## License

MIT
