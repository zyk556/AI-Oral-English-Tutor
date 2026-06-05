import { create } from "zustand";

// 消息类型
export interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  audioUrl?: string;
  timestamp: number;
}

// 全局状态
interface AppState {
  // 场景
  scenario: string | null;
  setScenario: (scenario: string) => void;

  // 消息列表
  messages: Message[];
  addUserMessage: (text: string) => void;
  addAIMessage: (text: string, audioUrl?: string) => void;
  clearMessages: () => void;

  // 连接状态
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // 录音状态
  recording: boolean;
  setRecording: (recording: boolean) => void;

  // 播放中的消息 ID
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
}

let messageCounter = 0;

export const useStore = create<AppState>((set) => ({
  // 场景
  scenario: null,
  setScenario: (scenario) => set({ scenario }),

  // 消息列表
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
  clearMessages: () => set({ messages: [] }),

  // 连接状态
  connected: false,
  setConnected: (connected) => set({ connected }),

  // 录音状态
  recording: false,
  setRecording: (recording) => set({ recording }),

  // 播放中的消息 ID
  playingAudioId: null,
  setPlayingAudioId: (id) => set({ playingAudioId: id }),
}));
