import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { useWebSocket } from "./hooks/useWebSocket";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import ScenarioSelector from "./components/ScenarioSelector";
import ChatBubble from "./components/ChatBubble";
import { FaComments, FaMicrophone, FaSpinner } from "react-icons/fa";

export default function App() {
  const { scenario, messages, connected } = useStore();
  const { sendText, setScenario } = useWebSocket();
  const { startListening, stopListening, isListening } = useSpeechRecognition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 监听后端回复，收到后取消 processing 状态
  useEffect(() => {
    if (processing && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "ai") {
        setProcessing(false);
      }
    }
  }, [messages, processing]);

  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    if (audioRef.current && playingId === messageId) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(messageId);
    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };
    audio.play().catch(console.error);
  };

  // 点击切换录音
  const handleToggleRecording = () => {
    if (!scenario || !connected || processing) return;
    if (isListening) {
      stopListening();
    } else {
      startListening((text: string) => {
        if (text.trim()) {
          sendText(text);
          setProcessing(true);
        }
      });
    }
  };

  const disabled = !scenario || !connected || processing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
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
        <div className="mb-4">
          <ScenarioSelector onSelect={setScenario} currentScenario={scenario} />
        </div>

        <div className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-inner min-h-[300px]">
          {!scenario && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FaComments size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Choose a scenario to start practicing</p>
            </div>
          )}
          {scenario && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-sm">
                Hold the microphone button and start speaking!
              </p>
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
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            onClick={handleToggleRecording}
            disabled={disabled}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl shadow-lg transition-all duration-200 select-none ${
              isListening
                ? "bg-red-500 scale-110 animate-pulse shadow-red-300"
                : processing
                ? "bg-yellow-500 cursor-wait"
                : disabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 hover:scale-105 active:scale-95"
            }`}
          >
            {processing ? (
              <FaSpinner className="animate-spin" size={22} />
            ) : (
              <FaMicrophone size={22} />
            )}
          </button>
          <p className="text-xs text-gray-500 select-none">
            {!scenario
              ? "Select a scenario first"
              : isListening
              ? "Click to stop"
              : processing
              ? "AI is thinking..."
              : "Click to speak"}
          </p>
        </div>
      </main>
    </div>
  );
}
