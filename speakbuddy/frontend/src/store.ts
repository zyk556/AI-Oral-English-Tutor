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
// 随机语境库
const CONTEXTS: Record<string, string[]> = {
  interview: [
    "You're interviewing at a top tech startup for a senior frontend role. The interviewer asks about your experience with React and system design.",
    "You're in a final-round behavioral interview at a fintech company. They want to hear about a time you led a difficult project.",
    "You're interviewing for a product manager role at a gaming company. They're testing how you think about user experience.",
    "You're in a screening call with an HR recruiter for a backend engineer position at a cloud computing firm.",
    "You're interviewing at a healthcare AI company. The interviewer wants to know how you handle ambiguous requirements.",
    "You're in a panel interview at an e-commerce giant. They're asking about scalability and performance optimization.",
  ],
  ordering: [
    "You're at a cozy Italian trattoria. You want to order pasta, a glass of red wine, and ask about today's special.",
    "You're at a busy Japanese ramen shop. You want to customize your ramen toppings and ask about spice levels.",
    "You're at an upscale French bistro for a date night. You need recommendations for appetizers and dessert.",
    "You're at a taco truck parked near the beach. You want to order a few tacos and ask what's freshest.",
    "You're at a trendy brunch spot on a Sunday morning. You want pancakes, coffee, and have a dietary allergy to mention.",
    "You're at a sushi bar sitting at the counter. You want to try the chef's omakase and ask about the fish today.",
  ],
  meeting: [
    "It's Monday morning standup. You need to report that your feature is 80% done but blocked by a third-party API issue.",
    "You're in a sprint retrospective. You want to suggest improving code review turnaround time.",
    "You're presenting a new feature demo to the team. You need to explain the technical architecture and gather feedback.",
    "You're in a 1-on-1 with your manager discussing your career growth and wanting to take on more responsibility.",
    "You're in a cross-team sync meeting. Another team needs your API endpoint changes by end of week.",
    "You're in an incident review meeting. A production bug caused downtime yesterday and you need to explain what happened.",
  ],
};

function getRandomContext(scenario: string): string {
  const list = CONTEXTS[scenario] || CONTEXTS["interview"];
  return list[Math.floor(Math.random() * list.length)];
}

interface AppState {
  scenario: string | null;
  scenarioContext: string;
  scenarioContexts: { [key: string]: string | undefined };
  setScenario: (scenario: string) => void;
  refreshContext: () => void;

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
  scenarioContext: "",
  scenarioContexts: {},
  setScenario: (scenario) => {
    const state = get();
    const histories = state.chatHistories;
    const msgs = histories[scenario] || [];
    // 保留已有语境，首次才随机
    const existing: string | undefined = state.scenarioContexts[scenario];
    const ctx = existing ?? getRandomContext(scenario);
    set({
      scenario,
      messages: msgs,
      scenarioContext: ctx,
      scenarioContexts: { ...state.scenarioContexts, [scenario]: ctx },
    });
    if (!histories[scenario]) {
      set({ chatHistories: { ...histories, [scenario]: [] } });
    }
  },
  refreshContext: () => {
    const s = get().scenario;
    if (s) {
      const ctx = getRandomContext(s);
      set({
        scenarioContext: ctx,
        scenarioContexts: { ...get().scenarioContexts, [s]: ctx },
      });
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
