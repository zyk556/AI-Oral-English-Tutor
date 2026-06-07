import { FaExclamationTriangle, FaLightbulb, FaTimes } from "react-icons/fa";
import type { Evaluation } from "../store";

interface EvaluationPanelProps {
  evaluation: Evaluation;
  onClose: () => void;
}

export default function EvaluationPanel({ evaluation, onClose }: EvaluationPanelProps) {
  const { corrected, grammar, vocabulary, score, comment } = evaluation;

  const scoreColor = (v: number) =>
    v >= 9 ? "var(--color-success)" : v >= 7 ? "var(--color-warning)" : "var(--color-error)";

  return (
    <div
      className="p-5 rounded-3xl space-y-4"
      style={{
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        animation: "float-in 0.25s ease",
      }}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
          Evaluation
        </div>
        <button onClick={onClose} style={{ color: "var(--color-text-secondary)" }}>
          <FaTimes size={14} />
        </button>
      </div>

      {/* 四维评分 */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Fluency", value: score.fluency },
          { label: "Grammar", value: score.grammar },
          { label: "Vocab", value: score.vocabulary },
          { label: "Overall", value: score.overall },
        ].map((s) => (
          <div key={s.label} className="p-2.5 rounded-2xl" style={{ background: "var(--color-bg)" }}>
            <div className="text-[10px] mb-1" style={{ color: "var(--color-text-secondary)" }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: scoreColor(s.value) }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 纠正版本 */}
      {corrected && (
        <div className="p-3 rounded-2xl" style={{ background: "rgba(91,108,255,0.06)" }}>
          <div className="text-[10px] font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
            Corrected Version
          </div>
          <div className="text-[13px]" style={{ color: "var(--color-text)" }}>{corrected}</div>
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
            <div key={i} className="mb-2.5 pl-3 text-[13px]" style={{ borderLeft: "2px solid rgba(255,204,0,0.3)" }}>
              <div>
                <span style={{ color: "var(--color-error)", textDecoration: "line-through" }}>{g.original}</span>
                <span className="mx-1.5" style={{ color: "var(--color-text-secondary)" }}>→</span>
                <span className="font-medium" style={{ color: "var(--color-success)" }}>{g.corrected}</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{g.explanation}</div>
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
            <div key={i} className="mb-2.5 pl-3 text-[13px]" style={{ borderLeft: "2px solid rgba(123,97,255,0.2)" }}>
              <div className="font-medium" style={{ color: "var(--color-accent)" }}>{v.suggestion}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{v.context}</div>
            </div>
          ))}
        </div>
      )}

      {/* 总评 */}
      {comment && (
        <div className="p-3 rounded-2xl text-[13px] italic" style={{ background: "var(--color-bg)", color: "var(--color-text-secondary)" }}>
          💬 {comment}
        </div>
      )}
    </div>
  );
}
