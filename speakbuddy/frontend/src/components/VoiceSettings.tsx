import { useState } from "react";
import { FaPlay, FaSpinner, FaTimes } from "react-icons/fa";

interface VoiceSettingsProps {
  voice: string;
  speed: number;
  volume: number;
  onChange: (s: { voice?: string; speed?: number; volume?: number }) => void;
  onPreview: (text: string) => Promise<string>;
}

const VOICES: Array<{ id: string; label: string; gender: string }> = [
  { id: "Chloe", label: "Chloe", gender: "Female" },
  { id: "Mia", label: "Mia", gender: "Female" },
  { id: "Milo", label: "Milo", gender: "Male" },
  { id: "Dean", label: "Dean", gender: "Male" },
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
      const url = await onPreview("Hello! This is a preview of the selected voice.");
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
      className="p-5 rounded-3xl space-y-5"
      style={{
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
      }}
    >
      <div className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
        Voice Settings
      </div>

      {/* 音色选择 - 头像卡片 */}
      <div className="grid grid-cols-2 gap-2">
        {VOICES.map((v) => {
          const isActive = voice === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onChange({ voice: v.id })}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200"
              style={{
                background: isActive ? "rgba(91,108,255,0.08)" : "var(--color-bg)",
                border: isActive ? "1.5px solid var(--color-primary)" : "1.5px solid transparent",
                boxShadow: isActive ? "0 0 0 3px rgba(91,108,255,0.1)" : "none",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: isActive ? "linear-gradient(135deg, #5B6CFF, #7B61FF)" : "#C7C7CC" }}
              >
                {v.label[0]}
              </div>
              <div className="text-[11px] font-medium" style={{ color: isActive ? "var(--color-primary)" : "var(--color-text)" }}>
                {v.label}
              </div>
              <div className="text-[9px]" style={{ color: "var(--color-text-secondary)" }}>
                {v.gender}
              </div>
            </button>
          );
        })}
      </div>

      {/* 语速 Segmented Control */}
      <div>
        <div className="text-[11px] font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
          Speed
        </div>
        <div className="flex p-1 rounded-2xl" style={{ background: "var(--color-bg)" }}>
          {SPEED_OPTIONS.map((s) => {
            const isActive = speed === s.value;
            return (
              <button
                key={s.value}
                onClick={() => onChange({ speed: s.value })}
                className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? "white" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                  boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 音量 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-secondary)" }}>Volume</span>
          <span className="text-[11px] font-semibold" style={{ color: "var(--color-primary)" }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
          className="w-full accent-[#5B6CFF]"
        />
      </div>

      {/* 试听 */}
      <button
        onClick={audioEl ? stopPreview : handlePreview}
        disabled={previewing}
        className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: audioEl ? "var(--color-error)" : "linear-gradient(135deg, #5B6CFF, #7B61FF)",
          boxShadow: audioEl ? "0 4px 12px rgba(255,59,48,0.25)" : "0 4px 12px rgba(91,108,255,0.3)",
          opacity: previewing ? 0.7 : 1,
        }}
      >
        {previewing ? (
          <><FaSpinner className="animate-spin" size={13} /> Generating...</>
        ) : audioEl ? (
          <><FaTimes size={13} /> Stop Preview</>
        ) : (
          <><FaPlay size={13} /> Preview Voice</>
        )}
      </button>
    </div>
  );
}
