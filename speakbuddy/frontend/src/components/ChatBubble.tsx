import React from "react";
import { FaPlay, FaPause, FaRobot, FaUser } from "react-icons/fa";
import type { Message } from "../store";
import CorrectionCard from "./CorrectionCard";

interface ChatBubbleProps {
  message: Message;
  isPlaying: boolean;
  onPlayAudio: (messageId: string, audioUrl: string) => void;
}

export default function ChatBubble({
  message,
  isPlaying,
  onPlayAudio,
}: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-2 mb-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* 头像 */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
          isUser ? "bg-blue-500" : "bg-gray-500"
        }`}
      >
        {isUser ? <FaUser size={14} /> : <FaRobot size={14} />}
      </div>

      {/* 消息区域 */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* 气泡 */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-blue-500 text-white rounded-tr-md"
              : "bg-gray-200 text-gray-800 rounded-tl-md"
          }`}
        >
          <p>{message.text}</p>

          {/* 播放按钮 */}
          {!isUser && message.audioUrl && (
            <button
              onClick={() => onPlayAudio(message.id, message.audioUrl!)}
              className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isPlaying
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              {isPlaying ? (
                <>
                  <FaPause size={10} /> Stop
                </>
              ) : (
                <>
                  <FaPlay size={10} /> Play
                </>
              )}
            </button>
          )}
        </div>

        {/* 纠错卡片（仅 AI 消息，折叠展示） */}
        {!isUser && message.evaluation && (
          <CorrectionCard evaluation={message.evaluation} />
        )}
      </div>
    </div>
  );
}
