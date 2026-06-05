import React, { useRef, useCallback, useState } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";

interface RecordButtonProps {
  onAudioData: (data: ArrayBuffer) => void;
  disabled: boolean;
}

export default function RecordButton({
  onAudioData,
  disabled,
}: RecordButtonProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      // 每 200ms 收集一次音频数据
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          onAudioData(buffer);
        }
      };

      mediaRecorder.start(200); // 200ms timeslice
      setRecording(true);
      console.log("[Record] Started recording");
    } catch (err) {
      console.error("[Record] Failed to start recording:", err);
    }
  }, [disabled, onAudioData]);

  // 停止录音
  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      console.log("[Record] Stopped recording");
    }
    // 释放麦克风
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={() => {
          if (recording) stopRecording();
        }}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl shadow-lg transition-all duration-200 select-none ${
          recording
            ? "bg-red-500 scale-110 animate-pulse shadow-red-300"
            : disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 hover:scale-105 active:scale-95"
        }`}
      >
        {recording ? <FaStop size={22} /> : <FaMicrophone size={22} />}
      </button>
      <p className="text-xs text-gray-500 select-none">
        {disabled
          ? "Select a scenario first"
          : recording
          ? "Release to stop"
          : "Hold to speak"}
      </p>
    </div>
  );
}
