import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../store";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const pendingAudioChunks = useRef<ArrayBuffer[]>([]);
  const lastAIId = useRef<string | null>(null);

  const {
    setConnected,
    addUserMessage,
    addAIMessage,
    setScenario: setStoreScenario,
  } = useStore();

  // 建立 WebSocket 连接
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
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
      // 二进制消息 = AI 语音音频 (mp3)
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buffer) => {
          const blob = new Blob([buffer], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(blob);
          // 为最后一条 AI 消息附加音频 URL
          const state = useStore.getState();
          const lastMsg = state.messages[state.messages.length - 1];
          if (lastMsg && lastMsg.role === "ai" && !lastMsg.audioUrl) {
            // 直接更新 store 中最后一条消息的 audioUrl
            useStore.setState((s) => ({
              messages: s.messages.map((m) =>
                m.id === lastMsg.id ? { ...m, audioUrl } : m
              ),
            }));
          }
        });
        return;
      }

      // 文本消息 = JSON
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
            console.log("[WebSocket] User text:", msg.text);
            addUserMessage(msg.text);
            break;
          case "ai_text":
            console.log("[WebSocket] AI text:", msg.text);
            addAIMessage(msg.text);
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
  }, [setConnected, addUserMessage, addAIMessage, setStoreScenario]);

  // 发送音频数据
  const sendAudio = useCallback((data: ArrayBuffer) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }, []);

  // 设置场景
  const setScenario = useCallback((scenario: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "set_scenario", scenario }));
    }
    // 清空消息列表
    useStore.getState().clearMessages();
  }, []);

  return { sendAudio, setScenario };
}
