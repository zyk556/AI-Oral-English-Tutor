import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import type { Evaluation } from "../store";
import { useStore } from "../store";

interface CorrectionCardProps {
  evaluation: Evaluation;
}

export default function CorrectionCard({ evaluation }: CorrectionCardProps) {
  const { selectedEvaluation, setSelectedEvaluation } = useStore();
  const { grammar, score } = evaluation;
  const hasCorrections = grammar.length > 0;

  const scoreColor = (v: number) =>
    v >= 9 ? "var(--color-success)" : v >= 7 ? "var(--color-warning)" : "var(--color-error)";

  const isSelected = selectedEvaluation === evaluation;

  return (
    <div className="mt-2 ml-12" style={{ animation: "float-in 0.3s ease" }}>
      <button
        onClick={() => setSelectedEvaluation(isSelected ? null : evaluation)}
        className="flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-200"
        style={{
          background: isSelected ? "rgba(91,108,255,0.08)" : "white",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
          border: isSelected ? "1px solid rgba(91,108,255,0.2)" : "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {hasCorrections ? (
          <FaExclamationTriangle size={12} style={{ color: "var(--color-warning)" }} />
        ) : (
          <FaCheckCircle size={12} style={{ color: "var(--color-success)" }} />
        )}
        <span className="text-[11px] font-semibold" style={{ color: scoreColor(score.overall) }}>
          {score.overall >= 9 ? "Excellent!" : score.overall >= 7 ? "Good Job!" : "Keep Going!"}
        </span>
        <span className="text-[11px] font-bold ml-auto" style={{ color: scoreColor(score.overall) }}>
          {score.overall}/10
        </span>
        {grammar.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,204,0,0.1)", color: "var(--color-warning)" }}>
            {grammar.length}
          </span>
        )}
      </button>
    </div>
  );
}
