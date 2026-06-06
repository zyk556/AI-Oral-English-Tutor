import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../store";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

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
      // 二进制消息 = AI 语音音频 (wav)
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buffer) => {
          const blob = new Blob([buffer], { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(blob);
          const state = useStore.getState();
          const lastMsg = state.messages[state.messages.length - 1];
          if (lastMsg && lastMsg.role === "ai" && !lastMsg.audioUrl) {
            useStore.setState((s) => ({
              messages: s.messages.map((m) =>
                m.id === lastMsg.id ? { ...m, audioUrl } : m
              ),
            }));
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
            console.log("[WebSocket] User text:", msg.text);
            addUserMessage(msg.text);
            break;
          case "ai_text":
            console.log("[WebSocket] AI text:", msg.text);
            addAIMessage(msg.text);
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
  }, [setConnected, addUserMessage, addAIMessage, setStoreScenario]);

  // 发送识别文本给后端
  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "user_speech", text }));
    }
  }, []);

  // 设置场景
  const setScenario = useCallback((scenario: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "set_scenario", scenario }));
    }
    useStore.getState().clearMessages();
  }, []);

  return { sendText, setScenario };
}
