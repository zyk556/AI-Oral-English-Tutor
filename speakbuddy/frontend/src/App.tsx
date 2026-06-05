import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { useWebSocket } from "./hooks/useWebSocket";
import ScenarioSelector from "./components/ScenarioSelector";
import ChatBubble from "./components/ChatBubble";
import RecordButton from "./components/RecordButton";
import { FaComments } from "react-icons/fa";

export default function App() {
  const { scenario, messages, connected } = useStore();
  const { sendAudio, setScenario } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 播放/停止音频
  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    // 如果正在播放同一个音频，停止它
    if (audioRef.current && playingId === messageId) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }

    // 停止当前播放
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 播放新音频
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(messageId);

    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      console.error("[Audio] Playback error");
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.play().catch((err) => {
      console.error("[Audio] Play failed:", err);
      setPlayingId(null);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 顶部标题栏 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaComments className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold text-gray-800">SpeakBuddy</h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-500">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4">
        {/* 场景选择 */}
        <div className="mb-4">
          <ScenarioSelector onSelect={setScenario} currentScenario={scenario} />
        </div>

        {/* 聊天消息列表 */}
        <div className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-inner min-h-[300px]">
          {!scenario && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FaComments size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Choose a scenario to start practicing</p>
            </div>
          )}
          {scenario && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-sm">Hold the microphone button and start speaking!</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isPlaying={playingId === msg.id}
              onPlayAudio={handlePlayAudio}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 录音按钮 */}
        <div className="flex justify-center py-2">
          <RecordButton
            onAudioData={sendAudio}
            disabled={!scenario || !connected}
          />
        </div>
      </main>
    </div>
  );
}
