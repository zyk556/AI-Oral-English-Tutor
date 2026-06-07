import { useState } from "react";
import { FaSearch, FaSpinner } from "react-icons/fa";

interface DictResult {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: string[];
  }>;
}

export default function DictionaryCard() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const word = query.trim().toLowerCase();
    if (!word) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!resp.ok) throw new Error("Word not found");
      const data = await resp.json();
      const entry = data[0];
      setResult({
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || "",
        meanings: entry.meanings.map((m: any) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: m.definitions.slice(0, 3).map((d: any) => d.definition),
        })),
      });
    } catch {
      setError("Word not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-4 rounded-2xl"
      style={{
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div className="text-[11px] font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
        Dictionary
      </div>

      {/* 搜索框 */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "var(--color-bg)" }}
      >
        <FaSearch size={12} style={{ color: "var(--color-text-secondary)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Look up a word..."
          className="flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: "var(--color-text)" }}
        />
      </div>

      {/* 结果 */}
      {loading && (
        <div className="flex justify-center py-3">
          <FaSpinner className="animate-spin" size={14} style={{ color: "var(--color-primary)" }} />
        </div>
      )}

      {error && (
        <div className="text-[11px] mt-2 text-center" style={{ color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
              {result.word}
            </span>
            {result.phonetic && (
              <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                {result.phonetic}
              </span>
            )}
          </div>
          {result.meanings.map((m, i) => (
            <div key={i}>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: "rgba(91,108,255,0.08)", color: "var(--color-primary)" }}
              >
                {m.partOfSpeech}
              </span>
              {m.definitions.map((d, j) => (
                <div key={j} className="text-[11px] mt-0.5 pl-2" style={{ color: "var(--color-text-secondary)" }}>
                  • {d}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
