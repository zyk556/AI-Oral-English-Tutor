import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { useWebSocket } from "./hooks/useWebSocket";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import ScenarioSelector from "./components/ScenarioSelector";
import ChatBubble from "./components/ChatBubble";
import VoiceSettings from "./components/VoiceSettings";
import { FaComments, FaMicrophone, FaSpinner, FaHeadphones, FaComment } from "react-icons/fa";

export default function App() {
  const { scenario, messages, connected, playingId, pausedId, setPlayingId, setPausedId, listenMode, setListenMode, voiceSettings, setVoiceSettings } = useStore();
  const { sendText, setScenario, sendVoiceSettings, previewVoice } = useWebSocket();
  const { startListening, stopListening, isListening } = useSpeechRecognition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const prevScenarioRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 监听后端回复，收到后取消 processing 状态 + 自动播放语音
  // 切换场景时不自动播放
  useEffect(() => {
    const scenarioChanged = prevScenarioRef.current !== scenario;
    prevScenarioRef.current = scenario;

    if (scenarioChanged) return; // 切场景，跳过自动播放

    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "ai") {
        setProcessing(false);
        if (last.audioUrl) {
          playAudio(last.id, last.audioUrl);
        }
      }
    }
  }, [messages, scenario]);

  // 播放音频
  const playAudio = (messageId: string, audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(messageId);
    setPausedId(null);
    audio.volume = voiceSettings.volume;
    audio.playbackRate = voiceSettings.speed;
    audio.onended = () => {
      setPlayingId(null);
      setPausedId(messageId); // 播放完毕，标记为暂停态（可重播）
      audioRef.current = null;
    };
    audio.play().catch(console.error);
  };

  // 暂停
  const handlePause = (messageId: string) => {
    if (audioRef.current && playingId === messageId) {
      audioRef.current.pause();
      setPlayingId(null);
      setPausedId(messageId);
    }
  };

  // 继续播放
  const handleResume = (messageId: string) => {
    if (audioRef.current && pausedId === messageId) {
      audioRef.current.play().catch(console.error);
      setPlayingId(messageId);
      setPausedId(null);
    }
  };

  // 重头播放
  const handleReplay = (messageId: string, audioUrl: string) => {
    playAudio(messageId, audioUrl);
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
            {/* 语音设置 */}
            <VoiceSettings
              voice={voiceSettings.voice}
              speed={voiceSettings.speed}
              volume={voiceSettings.volume}
              onChange={(s) => {
                setVoiceSettings(s);
                sendVoiceSettings(s);
              }}
              onPreview={previewVoice}
            />
            {/* 纯听模式切换 */}
            <button
              onClick={() => setListenMode(!listenMode)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                listenMode
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {listenMode ? <FaComment size={12} /> : <FaHeadphones size={12} />}
              {listenMode ? "Show Text" : "Listen Only"}
            </button>
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
                Click the microphone button and start speaking!
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isPlaying={playingId === msg.id}
              isPaused={pausedId === msg.id}
              listenMode={listenMode}
              onPause={() => handlePause(msg.id)}
              onResume={() => handleResume(msg.id)}
              onReplay={() => handleReplay(msg.id, msg.audioUrl!)}
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
