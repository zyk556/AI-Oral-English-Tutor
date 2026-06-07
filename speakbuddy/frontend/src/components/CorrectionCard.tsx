import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaExclamationTriangle, FaLightbulb } from "react-icons/fa";
import type { Evaluation } from "../store";

interface CorrectionCardProps {
  evaluation: Evaluation;
}

export default function CorrectionCard({ evaluation }: CorrectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { corrected, grammar, vocabulary, score, comment } = evaluation;
  const hasCorrections = grammar.length > 0 || vocabulary.length > 0;

  const scoreColor = (v: number) =>
    v >= 9 ? "var(--color-success)" : v >= 7 ? "var(--color-warning)" : "var(--color-error)";

  return (
    <div className="mt-2 ml-10" style={{ animation: "float-in 0.3s ease" }}>
      {/* 折叠态 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-200"
        style={{
          background: "white",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {hasCorrections ? (
          <FaExclamationTriangle size={13} style={{ color: "var(--color-warning)" }} />
        ) : (
          <FaCheckCircle size={13} style={{ color: "var(--color-success)" }} />
        )}
        <span className="text-xs font-semibold" style={{ color: scoreColor(score.overall) }}>
          {score.overall >= 9 ? "👏 Excellent!" : score.overall >= 7 ? "👍 Good Job!" : "💪 Keep Going!"}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] font-medium" style={{ color: scoreColor(score.overall) }}>
            {score.overall}/10
          </span>
          {grammar.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,204,0,0.1)", color: "var(--color-warning)" }}>
              {grammar.length} correction{grammar.length > 1 ? "s" : ""}
            </span>
          )}
          {expanded ? <FaChevronUp size={10} style={{ color: "var(--color-text-secondary)" }} /> : <FaChevronDown size={10} style={{ color: "var(--color-text-secondary)" }} />}
        </div>
      </button>

      {/* 展开态 */}
      {expanded && (
        <div
          className="mt-2 p-5 rounded-3xl space-y-5"
          style={{
            background: "white",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
            animation: "float-in 0.2s ease",
          }}
        >
          {/* 四维评分 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Fluency", value: score.fluency },
              { label: "Grammar", value: score.grammar },
              { label: "Vocab", value: score.vocabulary },
              { label: "Overall", value: score.overall },
            ].map((s) => (
              <div key={s.label} className="p-2 rounded-2xl" style={{ background: "var(--color-bg)" }}>
                <div className="text-[10px] mb-1" style={{ color: "var(--color-text-secondary)" }}>{s.label}</div>
                <div className="text-lg font-bold" style={{ color: scoreColor(s.value) }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* 纠正版本 */}
          {corrected && (
            <div className="p-3 rounded-2xl" style={{ background: "rgba(91,108,255,0.06)" }}>
              <div className="text-[10px] font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
                Corrected Version
              </div>
              <div className="text-xs" style={{ color: "var(--color-text)" }}>{corrected}</div>
            </div>
          )}

          {/* 语法纠错 */}
          {grammar.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FaExclamationTriangle size={11} style={{ color: "var(--color-warning)" }} />
                <span className="text-[11px] font-semibold" style={{ color: "var(--color-text)" }}>Grammar</span>
              </div>
              {grammar.map((g, i) => (
                <div key={i} className="mb-2 pl-3 text-xs" style={{ borderLeft: "2px solid rgba(255,204,0,0.3)" }}>
                  <div>
                    <span style={{ color: "var(--color-error)", textDecoration: "line-through" }}>{g.original}</span>
                    <span className="mx-1.5" style={{ color: "var(--color-text-secondary)" }}>→</span>
                    <span className="font-medium" style={{ color: "var(--color-success)" }}>{g.corrected}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{g.explanation}</div>
                </div>
              ))}
            </div>
          )}

          {/* 词汇建议 */}
          {vocabulary.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FaLightbulb size={11} style={{ color: "var(--color-accent)" }} />
                <span className="text-[11px] font-semibold" style={{ color: "var(--color-text)" }}>Vocabulary</span>
              </div>
              {vocabulary.map((v, i) => (
                <div key={i} className="mb-2 pl-3 text-xs" style={{ borderLeft: "2px solid rgba(123,97,255,0.2)" }}>
                  <div className="font-medium" style={{ color: "var(--color-accent)" }}>{v.suggestion}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{v.context}</div>
                </div>
              ))}
            </div>
          )}

          {/* 总评 */}
          {comment && (
            <div className="p-3 rounded-2xl text-xs italic" style={{ background: "var(--color-bg)", color: "var(--color-text-secondary)" }}>
              💬 {comment}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
