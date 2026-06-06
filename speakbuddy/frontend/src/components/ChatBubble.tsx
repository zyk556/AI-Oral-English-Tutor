import React from "react";
import { FaRedo, FaPause, FaPlay, FaRobot, FaUser } from "react-icons/fa";
import type { Message } from "../store";
import CorrectionCard from "./CorrectionCard";

interface ChatBubbleProps {
  message: Message;
  isPlaying: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
}

export default function ChatBubble({
  message,
  isPlaying,
  isPaused,
  onPause,
  onResume,
  onReplay,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const hasAudio = !isUser && message.audioUrl;

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

          {/* 两个按钮：暂停/继续 + 重播 */}
          {hasAudio && (
            <div className="mt-2 flex items-center gap-2">
              {/* 暂停 / 继续 */}
              {isPlaying ? (
                <button
                  onClick={onPause}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                >
                  <FaPause size={10} /> Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                >
                  <FaPlay size={10} /> Play
                </button>
              )}
              {/* 重播 */}
              <button
                onClick={onReplay}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
              >
                <FaRedo size={10} /> Replay
              </button>
            </div>
          )}
        </div>

        {/* 纠错卡片 */}
        {!isUser && message.evaluation && (
          <CorrectionCard evaluation={message.evaluation} />
        )}
      </div>
    </div>
  );
}
