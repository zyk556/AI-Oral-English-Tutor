import { create } from "zustand";

// 评估数据类型
export interface Evaluation {
  corrected: string;
  grammar: Array<{ original: string; corrected: string; explanation: string }>;
  vocabulary: Array<{ suggestion: string; context: string }>;
  score: { fluency: number; grammar: number; vocabulary: number; overall: number };
  comment: string;
}

// 消息类型
export interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  audioUrl?: string;
  translation?: string;
  evaluation?: Evaluation;
  timestamp: number;
}

// 全局状态
interface AppState {
  scenario: string | null;
  setScenario: (scenario: string) => void;

  // 每个场景独立的消息历史
  chatHistories: Record<string, Message[]>;
  // 当前场景的消息（派生）
  messages: Message[];
  addUserMessage: (text: string) => void;
  addAIMessage: (text: string, translation?: string) => void;
  addEvaluation: (messageId: string, evaluation: Evaluation) => void;

  // 音频播放状态
  playingId: string | null;
  pausedId: string | null;
  setPlayingId: (id: string | null) => void;
  setPausedId: (id: string | null) => void;

  connected: boolean;
  setConnected: (connected: boolean) => void;

  // 纯听模式
  listenMode: boolean;
  setListenMode: (v: boolean) => void;

  // 语音设置
  voiceSettings: { voice: string; speed: number; volume: number };
  setVoiceSettings: (s: { voice?: string; speed?: number; volume?: number }) => void;
}

let messageCounter = 0;

export const useStore = create<AppState>((set, get) => ({
  scenario: null,
  setScenario: (scenario) => {
    const histories = get().chatHistories;
    const msgs = histories[scenario] || [];
    set({ scenario, messages: msgs });
    if (!histories[scenario]) {
      set({ chatHistories: { ...histories, [scenario]: [] } });
    }
  },

  chatHistories: {},
  messages: [],

  addUserMessage: (text) =>
    set((state) => {
      const key = state.scenario;
      if (!key) return state;
      const msg: Message = {
        id: `msg-${++messageCounter}`,
        role: "user",
        text,
        timestamp: Date.now(),
      };
      const updated = [...(state.chatHistories[key] || []), msg];
      return {
        chatHistories: { ...state.chatHistories, [key]: updated },
        messages: updated,
      };
    }),

  addAIMessage: (text, translation) =>
    set((state) => {
      const key = state.scenario;
      if (!key) return state;
      const msg: Message = {
        id: `msg-${++messageCounter}`,
        role: "ai",
        text,
        translation,
        timestamp: Date.now(),
      };
      const updated = [...(state.chatHistories[key] || []), msg];
      return {
        chatHistories: { ...state.chatHistories, [key]: updated },
        messages: updated,
      };
    }),

  addEvaluation: (messageId, evaluation) =>
    set((state) => {
      const key = state.scenario;
      if (!key) return state;
      const history = state.chatHistories[key] || [];
      const updated = history.map((m) =>
        m.id === messageId ? { ...m, evaluation } : m
      );
      return {
        chatHistories: { ...state.chatHistories, [key]: updated },
        messages: updated,
      };
    }),

  playingId: null as string | null,
  pausedId: null as string | null,
  setPlayingId: (id: string | null) => set({ playingId: id, pausedId: null }),
  setPausedId: (id: string | null) => set({ pausedId: id }),

  connected: false as boolean,
  setConnected: (connected) => set({ connected }),

  listenMode: false as boolean,
  setListenMode: (v) => set({ listenMode: v }),

  voiceSettings: { voice: "Chloe", speed: 1.0, volume: 1.0 },
  setVoiceSettings: (s: { voice?: string; speed?: number; volume?: number }) =>
    set((state) => ({
      voiceSettings: {
        voice: s.voice ?? state.voiceSettings.voice,
        speed: s.speed ?? state.voiceSettings.speed,
        volume: s.volume ?? state.voiceSettings.volume,
      },
    })),
}));
