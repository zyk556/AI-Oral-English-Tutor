import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../store";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const previewResolveRef = useRef<((url: string) => void) | null>(null);
  const previewWaitingRef = useRef(false);

  const {
    setConnected,
    addUserMessage,
    addAIMessage,
    addEvaluation,
    setScenario: setStoreScenario,
  } = useStore();

  useEffect(() => {
    // 公网地址时用当前域名，本地用 Vite 代理
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("[WebSocket] Disconnected");
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Error:", err);
    };

    ws.onmessage = (event) => {
      // 二进制消息 = AI 语音音频 (wav)
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buffer) => {
          const blob = new Blob([buffer], { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(blob);

          // 如果有等待中的试听请求，返回音频 URL
          if (previewWaitingRef.current && previewResolveRef.current) {
            previewResolveRef.current(audioUrl);
            previewResolveRef.current = null;
            previewWaitingRef.current = false;
            return;
          }

          const state = useStore.getState();
          const lastMsg = state.messages[state.messages.length - 1];
          if (lastMsg && lastMsg.role === "ai" && !lastMsg.audioUrl) {
            useStore.setState((s) => {
              const key = s.scenario;
              const updatedMessages = s.messages.map((m) =>
                m.id === lastMsg.id ? { ...m, audioUrl } : m
              );
              return {
                messages: updatedMessages,
                chatHistories: key
                  ? { ...s.chatHistories, [key]: updatedMessages }
                  : s.chatHistories,
              };
            });
          }
        });
        return;
      }

      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "ready":
            console.log("[WebSocket] Server ready:", msg.message);
            break;
          case "scenario_set":
            console.log("[WebSocket] Scenario set:", msg.scenario);
            setStoreScenario(msg.scenario);
            break;
          case "user_text":
            addUserMessage(msg.text);
            break;
          case "ai_text":
            addAIMessage(msg.text, msg.translation);
            break;
          case "ai_evaluation":
            // 将评估数据附加到最后一条 AI 消息
            const evalState = useStore.getState();
            const lastAI = [...evalState.messages]
              .reverse()
              .find((m) => m.role === "ai");
            if (lastAI) {
              addEvaluation(lastAI.id, msg.evaluation);
            }
            break;
          case "error":
            console.error("[WebSocket] Server error:", msg.message);
            addAIMessage("Sorry, something went wrong. Please try again.");
            break;
          default:
            console.warn("[WebSocket] Unknown message type:", msg.type);
        }
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [setConnected, addUserMessage, addAIMessage, addEvaluation, setStoreScenario]);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "user_speech", text }));
    }
  }, []);

  const setScenario = useCallback((scenario: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "set_scenario", scenario }));
    }
    setStoreScenario(scenario);
  }, [setStoreScenario]);

  const sendDifficulty = useCallback((difficulty: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "difficulty", difficulty }));
    }
  }, []);

  const sendVoiceSettings = useCallback((settings: { voice?: string; speed?: number; volume?: number }) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "voice_settings", settings }));
    }
  }, []);

  const previewVoice = useCallback((text: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      previewResolveRef.current = resolve;
      previewWaitingRef.current = true;
      ws.send(JSON.stringify({ type: "preview_voice", text }));
      // 10 秒超时
      setTimeout(() => {
        if (previewWaitingRef.current) {
          previewResolveRef.current = null;
          previewWaitingRef.current = false;
          reject(new Error("Preview timeout"));
        }
      }, 10000);
    });
  }, []);

  return { sendText, setScenario, sendDifficulty, sendVoiceSettings, previewVoice };
}
