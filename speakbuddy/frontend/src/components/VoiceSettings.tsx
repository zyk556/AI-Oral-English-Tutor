import { useState } from "react";
import { FaPlay, FaSpinner, FaTimes } from "react-icons/fa";

interface VoiceSettingsProps {
  voice: string;
  speed: number;
  volume: number;
  onChange: (s: { voice?: string; speed?: number; volume?: number }) => void;
  onPreview: (text: string) => Promise<string>;
}

const VOICES = [
  { id: "Chloe", label: "Chloe", gender: "F" },
  { id: "Mia", label: "Mia", gender: "F" },
  { id: "Milo", label: "Milo", gender: "M" },
  { id: "Dean", label: "Dean", gender: "M" },
];

const SPEED_OPTIONS = [
  { value: 0.8, label: "Slow" },
  { value: 1.0, label: "Normal" },
  { value: 1.2, label: "Fast" },
];

export default function VoiceSettings(props: VoiceSettingsProps) {
  const { onChange, onPreview } = props;
  const voice: string = props.voice || "Chloe";
  const speed: number = props.speed ?? 1.0;
  const volume: number = props.volume ?? 1.0;

  const [previewing, setPreviewing] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const handlePreview = async () => {
    if (previewing) return;
    setPreviewing(true);
    try {
      const url = await onPreview("Hello! This is a voice preview.");
      const audio = new Audio(url);
      audio.volume = volume;
      audio.playbackRate = speed;
      setAudioEl(audio);
      audio.onended = () => setAudioEl(null);
      await audio.play();
    } catch (err) {
      console.error("[Preview] Error:", err);
    } finally {
      setPreviewing(false);
    }
  };

  const stopPreview = () => {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      setAudioEl(null);
    }
  };

  return (
    <div
      className="p-4 rounded-3xl space-y-3"
      style={{
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
      }}
    >
      <div className="text-[11px] font-semibold" style={{ color: "var(--color-text)" }}>
        Voice
      </div>

      {/* 音色 - 按性别分组 */}
      <div className="space-y-2">
        {([["F", "Female"], ["M", "Male"]] as const).map(([gKey, gLabel]) => (
          <div key={gKey}>
            <div className="text-[10px] font-medium mb-1.5 px-1" style={{ color: "var(--color-text-secondary)" }}>
              {gLabel}
            </div>
            <div
              className="flex gap-2 p-2 rounded-xl"
              style={{ background: gKey === "F" ? "rgba(255,107,157,0.04)" : "rgba(91,108,255,0.04)" }}
            >
              {VOICES.filter((v) => v.gender === gKey).map((v) => {
                const isActive = voice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onChange({ voice: v.id })}
                    className="flex-1 py-2 rounded-xl text-[12px] font-medium transition-all duration-200"
                    style={{
                      background: isActive ? "rgba(91,108,255,0.1)" : "white",
                      color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                      border: isActive ? "1.5px solid var(--color-primary)" : "1.5px solid transparent",
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 语速 + 音量同一行 */}
      <div className="flex items-center gap-3">
        {/* 语速 */}
        <div className="flex p-0.5 rounded-xl flex-1" style={{ background: "var(--color-bg)" }}>
          {SPEED_OPTIONS.map((s) => {
            const isActive = speed === s.value;
            return (
              <button
                key={s.value}
                onClick={() => onChange({ speed: s.value })}
                className="flex-1 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
                style={{
                  background: isActive ? "white" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {/* 音量 */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
            className="flex-1 accent-[#5B6CFF] h-1"
          />
          <span className="text-[10px] w-7 text-right" style={{ color: "var(--color-primary)" }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* 试听 */}
      <button
        onClick={audioEl ? stopPreview : handlePreview}
        disabled={previewing}
        className="w-full py-2 rounded-xl text-[12px] font-semibold text-white transition-all duration-200 flex items-center justify-center gap-1.5"
        style={{
          background: audioEl ? "var(--color-error)" : "linear-gradient(135deg, #5B6CFF, #7B61FF)",
          opacity: previewing ? 0.7 : 1,
        }}
      >
        {previewing ? (
          <><FaSpinner className="animate-spin" size={11} /> Generating...</>
        ) : audioEl ? (
          <><FaTimes size={11} /> Stop</>
        ) : (
          <><FaPlay size={11} /> Preview</>
        )}
      </button>
    </div>
  );
}
