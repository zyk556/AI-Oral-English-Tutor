interface ScenarioSelectorProps {
  onSelect: (scenario: string) => void;
  currentScenario: string | null;
}

const scenarios = [
  {
    id: "interview",
    label: "Interview",
    icon: "💼",
    subtitle: "Job interview practice",
  },
  {
    id: "ordering",
    label: "Restaurant",
    icon: "🍽️",
    subtitle: "Food ordering practice",
  },
  {
    id: "meeting",
    label: "Meeting",
    icon: "👥",
    subtitle: "Business meeting practice",
  },
];

export default function ScenarioSelector({
  onSelect,
  currentScenario,
}: ScenarioSelectorProps) {
  return (
    <aside className="w-[280px] flex-shrink-0 py-4 pl-4 space-y-3 hidden md:block">
      <div
        className="text-xs font-semibold px-2 mb-2"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Scenarios
      </div>
      {scenarios.map((s) => {
        const isActive = currentScenario === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="w-full flex items-center gap-3 p-4 rounded-3xl text-left transition-all duration-200 relative overflow-hidden"
            style={{
              background: isActive ? "rgba(91,108,255,0.08)" : "white",
              border: isActive
                ? "1px solid rgba(91,108,255,0.15)"
                : "1px solid rgba(0,0,0,0.04)",
              boxShadow: isActive
                ? "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)"
                : "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            {/* 左侧高亮条 */}
            {isActive && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                style={{ background: "linear-gradient(180deg, #5B6CFF, #7B61FF)" }}
              />
            )}
            <div className="text-2xl">{s.icon}</div>
            <div>
              <div
                className="text-sm font-medium"
                style={{ color: isActive ? "var(--color-primary)" : "var(--color-text)" }}
              >
                {s.label}
              </div>
              <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                {s.subtitle}
              </div>
            </div>
          </button>
        );
      })}
    </aside>
  );
}
