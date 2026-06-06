import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { useWebSocket } from "./hooks/useWebSocket";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import ScenarioSelector from "./components/ScenarioSelector";
import ChatBubble from "./components/ChatBubble";
import VoiceSettings from "./components/VoiceSettings";
import { FaHeadphones, FaComment, FaMicrophone, FaSpinner, FaGlobe } from "react-icons/fa";

export default function App() {
  const {
    scenario, messages, connected, playingId, pausedId,
    setPlayingId, setPausedId, listenMode, setListenMode,
    voiceSettings, setVoiceSettings,
  } = useStore();
  const { sendText, setScenario, sendVoiceSettings, previewVoice } = useWebSocket();
  const { startListening, stopListening, isListening } = useSpeechRecognition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const prevScenarioRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const scenarioChanged = prevScenarioRef.current !== scenario;
    prevScenarioRef.current = scenario;
    if (scenarioChanged) return;
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "ai") {
        setProcessing(false);
        if (last.audioUrl) playAudio(last.id, last.audioUrl);
      }
    }
  }, [messages, scenario]);

  const playAudio = (messageId: string, audioUrl: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(messageId);
    setPausedId(null);
    audio.volume = voiceSettings.volume;
    audio.playbackRate = voiceSettings.speed;
    audio.onended = () => {
      setPlayingId(null);
      setPausedId(messageId);
      audioRef.current = null;
    };
    audio.play().catch(console.error);
  };

  const handlePause = (messageId: string) => {
    if (audioRef.current && playingId === messageId) {
      audioRef.current.pause();
      setPlayingId(null);
      setPausedId(messageId);
    }
  };

  const handleResume = (messageId: string) => {
    if (audioRef.current && pausedId === messageId) {
      audioRef.current.play().catch(console.error);
      setPlayingId(messageId);
      setPausedId(null);
    }
  };

  const handleReplay = (messageId: string, audioUrl: string) => {
    playAudio(messageId, audioUrl);
  };

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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* ===== 顶部导航栏 ===== */}
      <header
        className="sticky top-0 z-40 h-[72px] flex items-center justify-between px-6"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* 左侧 Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #5B6CFF, #7B61FF)" }}>
            S
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              SpeakBuddy AI
            </div>
            <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
              Your AI English Partner
            </div>
          </div>
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center gap-3">
          {/* 纯听模式 */}
          <button
            onClick={() => setListenMode(!listenMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              background: listenMode ? "rgba(91,108,255,0.1)" : "transparent",
              color: listenMode ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}
          >
            {listenMode ? <FaComment size={11} /> : <FaHeadphones size={11} />}
            {listenMode ? "Show Text" : "Listen Only"}
          </button>

          {/* 语言 */}
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <FaGlobe size={11} /> EN
          </div>

          {/* 连接状态 */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: connected ? "var(--color-success)" : "var(--color-error)" }}
            />
            <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
              {connected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* ===== 三栏主体 ===== */}
      <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
        {/* 左侧场景栏 */}
        <ScenarioSelector onSelect={setScenario} currentScenario={scenario} />

        {/* 中央聊天区 */}
        <main className="flex-1 flex flex-col min-w-0 px-4 py-4">
          {/* 场景提示卡 */}
          {scenario && (
            <div
              className="mb-4 p-4 rounded-3xl"
              style={{
                background: "linear-gradient(135deg, rgba(91,108,255,0.06), rgba(123,97,255,0.06))",
                border: "1px solid rgba(91,108,255,0.08)",
              }}
            >
              <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {scenario === "interview" ? "Interview Scenario" : scenario === "ordering" ? "Restaurant Scenario" : "Meeting Scenario"}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {scenario === "interview"
                  ? "You are an experienced interviewer. Ask professional questions naturally."
                  : scenario === "ordering"
                  ? "You are a friendly waiter. Take orders and suggest dishes."
                  : "You are a project manager. Lead the daily standup meeting."}
              </div>
            </div>
          )}

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto px-2" style={{ minHeight: 0 }}>
            {!scenario && (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--color-text-secondary)" }}>
                <div className="text-5xl mb-4 opacity-20">🎙️</div>
                <p className="text-sm">Choose a scenario to start practicing</p>
              </div>
            )}
            {scenario && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--color-text-secondary)" }}>
                <div className="text-5xl mb-4 opacity-20">💬</div>
                <p className="text-sm">Click the microphone and start speaking!</p>
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

          {/* 底部麦克风 Dock */}
          <div className="flex justify-center py-4">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleToggleRecording}
                disabled={disabled}
                className="relative w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-200 select-none"
                style={{
                  background: isListening
                    ? "var(--color-error)"
                    : disabled
                    ? "#C7C7CC"
                    : "linear-gradient(135deg, #5B6CFF, #7B61FF)",
                  transform: isListening ? "scale(1.1)" : "scale(1)",
                  boxShadow: isListening
                    ? "0 0 0 8px rgba(255,59,48,0.15)"
                    : "0 4px 16px rgba(91,108,255,0.35)",
                }}
              >
                {isListening && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ animation: "pulse-ring 1.5s infinite", background: "rgba(255,59,48,0.2)" }}
                  />
                )}
                {processing ? <FaSpinner className="animate-spin" size={22} /> : <FaMicrophone size={22} />}
              </button>
              <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                {!scenario
                  ? "Select a scenario"
                  : isListening
                  ? "Listening..."
                  : processing
                  ? "AI is thinking..."
                  : "Click to speak"}
              </span>
            </div>
          </div>
        </main>

        {/* 右侧辅助区 */}
        <aside className="w-[360px] flex-shrink-0 py-4 pr-4 space-y-4 overflow-y-auto hidden lg:block">
          {/* 语音设置面板 */}
          <VoiceSettings
            voice={voiceSettings.voice}
            speed={voiceSettings.speed}
            volume={voiceSettings.volume}
            onChange={(s) => { setVoiceSettings(s); sendVoiceSettings(s); }}
            onPreview={previewVoice}
          />

        </aside>
      </div>
    </div>
  );
}
