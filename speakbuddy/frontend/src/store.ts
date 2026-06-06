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

  connected: boolean;
  setConnected: (connected: boolean) => void;
}

let messageCounter = 0;

export const useStore = create<AppState>((set, get) => ({
  scenario: null,
  setScenario: (scenario) => {
    set({ scenario });
    // 切换场景时，如果该场景还没有历史，初始化空数组
    if (!get().chatHistories[scenario]) {
      set((state) => ({
        chatHistories: { ...state.chatHistories, [scenario]: [] },
      }));
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

  connected: false,
  setConnected: (connected) => set({ connected }),
}));
