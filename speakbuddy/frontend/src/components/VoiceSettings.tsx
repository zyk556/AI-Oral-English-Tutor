import { useState } from "react";
import { createPortal } from "react-dom";
import { FaCog, FaTimes, FaPlay, FaSpinner } from "react-icons/fa";

interface VoiceSettingsProps {
  voice: string;
  speed: number;
  volume: number;
  onChange: (s: { voice?: string; speed?: number; volume?: number }) => void;
  onPreview: (text: string) => Promise<string>;
}

const VOICES: Array<{ id: string; label: string }> = [
  { id: "Chloe", label: "Chloe (Female)" },
  { id: "Mia", label: "Mia (Female)" },
  { id: "Milo", label: "Milo (Male)" },
  { id: "Dean", label: "Dean (Male)" },
];

const SPEED_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0.8, label: "Slow" },
  { value: 1.0, label: "Normal" },
  { value: 1.2, label: "Fast" },
];

export default function VoiceSettings(props: VoiceSettingsProps) {
  const { onChange, onPreview } = props;
  const voice: string = props.voice || "Chloe";
  const speed: number = props.speed ?? 1.0;
  const volume: number = props.volume ?? 1.0;
  const [open, setOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const handlePreview = async () => {
    if (previewing) return;
    setPreviewing(true);
    try {
      const url = await onPreview("Hello! This is a preview of the selected voice. How does it sound?");
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

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl p-5 w-80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Voice Settings</h3>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={16} />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Voice</label>
          <select
            value={voice}
            onChange={(e) => onChange({ voice: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Speed: {speed}x</label>
          <div className="flex gap-2">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => onChange({ speed: s.value })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  speed === s.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>

        <button
          onClick={audioEl ? stopPreview : handlePreview}
          disabled={previewing}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            audioEl
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {previewing ? (
            <><FaSpinner className="animate-spin" size={12} /> Generating...</>
          ) : audioEl ? (
            <><FaTimes size={12} /> Stop Preview</>
          ) : (
            <><FaPlay size={12} /> Preview Voice</>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
      >
        <FaCog size={12} /> Voice
      </button>
      {open && createPortal(modal, document.body)}
    </>
  );
}
