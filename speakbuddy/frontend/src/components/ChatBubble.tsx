import { useState } from "react";
import { FaRedo, FaPause, FaPlay, FaRobot, FaUser, FaEye, FaLanguage } from "react-icons/fa";
import type { Message } from "../store";
import CorrectionCard from "./CorrectionCard";

interface ChatBubbleProps {
  message: Message;
  isPlaying: boolean;
  isPaused: boolean;
  listenMode: boolean;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
}

export default function ChatBubble({
  message,
  isPlaying,
  listenMode,
  onPause,
  onResume,
  onReplay,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const hasAudio = !isUser && message.audioUrl;
  const hasTranslation = !isUser && !!message.translation;
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // 纯听模式 AI 消息
  if (!isUser && listenMode && !showSubtitle) {
    return (
      <div className="flex items-start gap-3 mb-4" style={{ animation: "float-in 0.3s ease" }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
          style={{ background: "var(--color-text-secondary)" }}
        >
          <FaRobot size={13} />
        </div>
        <div className="max-w-[75%] flex flex-col">
          <div
            className="px-6 py-4 rounded-3xl rounded-tl-lg flex items-center gap-2"
            style={{ background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)" }}
          >
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--color-text-secondary)", animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--color-text-secondary)", animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--color-text-secondary)", animationDelay: "300ms" }} />
          </div>
          <button
            onClick={() => setShowSubtitle(true)}
            className="mt-1.5 ml-3 flex items-center gap-1 text-[11px] transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <FaEye size={10} /> Tap to view subtitles
          </button>
          {hasAudio && (
            <div className="mt-2 ml-3 flex items-center gap-2">
              {isPlaying ? (
                <button onClick={onPause} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: "rgba(255,59,48,0.1)", color: "var(--color-error)" }}>
                  <FaPause size={10} /> Pause
                </button>
              ) : (
                <button onClick={onResume} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: "rgba(91,108,255,0.1)", color: "var(--color-primary)" }}>
                  <FaPlay size={10} /> Play
                </button>
              )}
              <button onClick={onReplay} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{ background: "rgba(52,199,89,0.1)", color: "var(--color-success)" }}>
                <FaRedo size={10} /> Replay
              </button>
            </div>
          )}
          {hasTranslation && (
            <div className="mt-2 ml-3">
              <button onClick={() => setShowTranslation(!showTranslation)}
                className="flex items-center gap-1 text-[11px] transition-colors"
                style={{ color: "var(--color-accent)" }}>
                <FaLanguage size={12} /> {showTranslation ? "Hide Translation" : "Show Translation"}
              </button>
              {showTranslation && (
                <div className="mt-1.5 px-3 py-2 rounded-2xl text-xs" style={{ background: "rgba(123,97,255,0.06)", color: "var(--color-text)" }}>
                  {message.translation}
                </div>
              )}
            </div>
          )}
          {message.evaluation && <CorrectionCard evaluation={message.evaluation} />}
        </div>
      </div>
    );
  }

  // 正常模式
  return (
    <div
      className={`flex items-start gap-3 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "float-in 0.3s ease" }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
        style={{
          background: isUser
            ? "linear-gradient(135deg, #5B6CFF, #7B61FF)"
            : "var(--color-text-secondary)",
        }}
      >
        {isUser ? <FaUser size={13} /> : <FaRobot size={13} />}
      </div>

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className="px-6 py-4 text-[15px] leading-relaxed"
          style={{
            borderRadius: isUser ? "24px 24px 8px 24px" : "24px 24px 24px 8px",
            background: isUser
              ? "linear-gradient(135deg, #5B6CFF, #7B61FF)"
              : "white",
            color: isUser ? "white" : "var(--color-text)",
            boxShadow: isUser
              ? "0 4px 12px rgba(91,108,255,0.25)"
              : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p>{message.text}</p>

          {hasAudio && (
            <div className="mt-2 flex items-center gap-2">
              {isPlaying ? (
                <button onClick={onPause} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: isUser ? "rgba(255,255,255,0.2)" : "rgba(255,59,48,0.1)", color: isUser ? "white" : "var(--color-error)" }}>
                  <FaPause size={10} /> Pause
                </button>
              ) : (
                <button onClick={onResume} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: isUser ? "rgba(255,255,255,0.2)" : "rgba(91,108,255,0.1)", color: isUser ? "white" : "var(--color-primary)" }}>
                  <FaPlay size={10} /> Play
                </button>
              )}
              <button onClick={onReplay} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{ background: isUser ? "rgba(255,255,255,0.2)" : "rgba(52,199,89,0.1)", color: isUser ? "white" : "var(--color-success)" }}>
                <FaRedo size={10} /> Replay
              </button>
            </div>
          )}
        </div>

        {/* 翻译 */}
        {!isUser && hasTranslation && (
          <div className="mt-1.5 ml-3">
            <button onClick={() => setShowTranslation(!showTranslation)}
              className="flex items-center gap-1 text-[11px] transition-colors"
              style={{ color: "var(--color-accent)" }}>
              <FaLanguage size={12} /> {showTranslation ? "Hide Translation" : "Show Translation"}
            </button>
            {showTranslation && (
              <div className="mt-1.5 px-3 py-2 rounded-2xl text-xs" style={{ background: "rgba(123,97,255,0.06)", color: "var(--color-text)" }}>
                {message.translation}
              </div>
            )}
          </div>
        )}

        {/* 纠错卡片 */}
        {!isUser && message.evaluation && (
          <CorrectionCard evaluation={message.evaluation} />
        )}
      </div>
    </div>
  );
}
