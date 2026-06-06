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
  addAIMessage: (text: string, audioUrl?: string) => void;
  addEvaluation: (messageId: string, evaluation: Evaluation) => void;

  // 音频播放状态
  playingId: string | null;
  pausedId: string | null;
  setPlayingId: (id: string | null) => void;
  setPausedId: (id: string | null) => void;

  connected: boolean;
  setConnected: (connected: boolean) => void;
}

let messageCounter = 0;

export const useStore = create<AppState>((set, get) => ({
  scenario: null,
  setScenario: (scenario) => {
    const histories = get().chatHistories;
    // 切换场景时，加载该场景的历史（新场景则为空数组）
    const msgs = histories[scenario] || [];
    set({
      scenario,
      messages: msgs,
      chatHistories: histories[scenario]
        ? histories
        : { ...histories, [scenario]: [] },
    });
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

  addAIMessage: (text, audioUrl) =>
    set((state) => {
      const key = state.scenario;
      if (!key) return state;
      const msg: Message = {
        id: `msg-${++messageCounter}`,
        role: "ai",
        text,
        audioUrl,
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
}));
