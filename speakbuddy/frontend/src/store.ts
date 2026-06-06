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

  messages: Message[];
  addUserMessage: (text: string) => void;
  addAIMessage: (text: string, audioUrl?: string) => void;
  addEvaluation: (messageId: string, evaluation: Evaluation) => void;
  clearMessages: () => void;

  connected: boolean;
  setConnected: (connected: boolean) => void;
}

let messageCounter = 0;

export const useStore = create<AppState>((set) => ({
  scenario: null,
  setScenario: (scenario) => set({ scenario }),

  messages: [],
  addUserMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg-${++messageCounter}`,
          role: "user",
          text,
          timestamp: Date.now(),
        },
      ],
    })),
  addAIMessage: (text, audioUrl) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg-${++messageCounter}`,
          role: "ai",
          text,
          audioUrl,
          timestamp: Date.now(),
        },
      ],
    })),
  addEvaluation: (messageId, evaluation) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, evaluation } : m
      ),
    })),
  clearMessages: () => set({ messages: [] }),

  connected: false,
  setConnected: (connected) => set({ connected }),
}));
