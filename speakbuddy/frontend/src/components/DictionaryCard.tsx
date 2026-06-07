import { useState } from "react";
import { FaSearch, FaSpinner } from "react-icons/fa";

interface Meaning {
  pos: string;
  defs: string[];
}

const POS_MAP: Record<string, string> = {
  noun: "n.",
  verb: "v.",
  adjective: "adj.",
  adverb: "adv.",
  preposition: "prep.",
  conjunction: "conj.",
  pronoun: "pron.",
  interjection: "interj.",
  determiner: "det.",
  "proper noun": "n.",
};

export default function DictionaryCard() {
  const [query, setQuery] = useState("");
  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [meanings, setMeanings] = useState<Meaning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setLoading(true);
    setError("");
    setMeanings([]);
    setWord("");

    try {
      // 1. 查词典
      const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${q}`);
      if (!resp.ok) throw new Error("not found");
      const data = await resp.json();
      const entry = data[0];
      const rawPhonetic = entry.phonetic || entry.phonetics?.[0]?.text || "";
      setWord(entry.word);
      setPhonetic(rawPhonetic);

      // 收集英文释义
      const enMeanings: Meaning[] = entry.meanings.map((m: any) => ({
        pos: POS_MAP[m.partOfSpeech] || m.partOfSpeech + ".",
        defs: m.definitions.slice(0, 2).map((d: any) => d.definition),
      }));

      // 2. 批量翻译成中文（用后端 MiMo）
      const allDefs = enMeanings.flatMap((m) => m.defs);
      const translateResp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: entry.word, definitions: allDefs }),
      });

      if (translateResp.ok) {
        const translated = await translateResp.json();
        // translated.definitions 是中文释义数组
        let idx = 0;
        const result: Meaning[] = enMeanings.map((m) => ({
          pos: m.pos,
          defs: m.defs.map(() => translated.definitions[idx++] || ""),
        }));
        setMeanings(result);
      } else {
        // 翻译失败，显示英文
        setMeanings(enMeanings);
      }
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

      {word && meanings.length > 0 && (
        <div className="mt-2 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
              {word}
            </span>
            {phonetic && (
              <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                {phonetic}
              </span>
            )}
          </div>
          {meanings.map((m, i) => (
            <div key={i}>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: "rgba(91,108,255,0.08)", color: "var(--color-primary)" }}
              >
                {m.pos}
              </span>
              {m.defs.map((d, j) => (
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
