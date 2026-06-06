import React, { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
} from "react-icons/fa";
import type { Evaluation } from "../store";

interface CorrectionCardProps {
  evaluation: Evaluation;
}

export default function CorrectionCard({ evaluation }: CorrectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { corrected, grammar, vocabulary, score, comment } = evaluation;
  const hasCorrections = grammar.length > 0 || vocabulary.length > 0;
  const overallColor =
    score.overall >= 8
      ? "text-green-600 bg-green-50 border-green-200"
      : score.overall >= 6
      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
      : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="mt-2 ml-10">
      {/* 折叠状态：一行摘要 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80 ${overallColor}`}
      >
        {hasCorrections ? (
          <FaExclamationTriangle size={12} />
        ) : (
          <FaCheckCircle size={12} />
        )}
        <span>Score: {score.overall}/10</span>
        {grammar.length > 0 && (
          <span className="opacity-70">| {grammar.length} correction{grammar.length > 1 ? "s" : ""}</span>
        )}
        {expanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
      </button>

      {/* 展开状态：详细评估 */}
      {expanded && (
        <div className="mt-2 p-3 bg-white rounded-xl shadow-md border border-gray-100 text-xs space-y-3 max-w-md">
          {/* 评分 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Fluency", value: score.fluency },
              { label: "Grammar", value: score.grammar },
              { label: "Vocab", value: score.vocabulary },
              { label: "Overall", value: score.overall },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-gray-400 text-[10px]">{s.label}</div>
                <div
                  className={`text-lg font-bold ${
                    s.value >= 8
                      ? "text-green-500"
                      : s.value >= 6
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* 纠正后的完整句子 */}
          {corrected && (
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-blue-400 text-[10px] font-medium mb-1">
                Corrected version
              </div>
              <div className="text-gray-700">{corrected}</div>
            </div>
          )}

          {/* 语法纠错 */}
          {grammar.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-gray-500 font-medium mb-1.5">
                <FaExclamationTriangle size={10} className="text-orange-400" />
                Grammar
              </div>
              {grammar.map((g, i) => (
                <div key={i} className="mb-1.5 pl-2 border-l-2 border-orange-200">
                  <div>
                    <span className="text-red-500 line-through">{g.original}</span>
                    <span className="mx-1 text-gray-400">→</span>
                    <span className="text-green-600 font-medium">{g.corrected}</span>
                  </div>
                  <div className="text-gray-400 text-[10px] mt-0.5">
                    {g.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 词汇建议 */}
          {vocabulary.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-gray-500 font-medium mb-1.5">
                <FaLightbulb size={10} className="text-yellow-400" />
                Vocabulary
              </div>
              {vocabulary.map((v, i) => (
                <div key={i} className="mb-1.5 pl-2 border-l-2 border-yellow-200">
                  <div className="text-blue-600 font-medium">{v.suggestion}</div>
                  <div className="text-gray-400 text-[10px]">{v.context}</div>
                </div>
              ))}
            </div>
          )}

          {/* 总评 */}
          {comment && (
            <div className="bg-gray-50 rounded-lg p-2 text-gray-600 italic text-[11px]">
              💬 {comment}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
