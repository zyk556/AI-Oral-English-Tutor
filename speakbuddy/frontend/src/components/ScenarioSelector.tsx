interface ScenarioSelectorProps {
  onSelect: (scenario: string) => void;
  currentScenario: string | null;
  currentContext?: string;
}

const scenarios = [
  { id: "interview", label: "Interview", icon: "💼", subtitle: "Job interview practice" },
  { id: "ordering", label: "Restaurant", icon: "🍽️", subtitle: "Food ordering practice" },
  { id: "meeting", label: "Meeting", icon: "👥", subtitle: "Business meeting practice" },
  { id: "directions", label: "Directions", icon: "🗺️", subtitle: "Ask for directions" },
  { id: "doctor", label: "Doctor", icon: "🏥", subtitle: "Visit a doctor" },
  { id: "airport", label: "Airport", icon: "✈️", subtitle: "Airport check-in" },
  { id: "hotel", label: "Hotel", icon: "🏨", subtitle: "Hotel check-in" },
  { id: "dating", label: "Dating", icon: "💕", subtitle: "Cafe date chat" },
];

export default function ScenarioSelector({
  onSelect,
  currentScenario,
  currentContext,
}: ScenarioSelectorProps) {
  return (
    <aside className="w-[290px] flex-shrink-0 py-4 pl-4 space-y-2.5 overflow-y-auto hidden md:block">
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
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 relative overflow-hidden"
            style={{
              background: isActive ? "rgba(91,108,255,0.08)" : "white",
              border: isActive
                ? "1px solid rgba(91,108,255,0.15)"
                : "1px solid rgba(0,0,0,0.04)",
              boxShadow: isActive
                ? "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)"
                : "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            {isActive && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                style={{ background: "linear-gradient(180deg, #5B6CFF, #7B61FF)" }}
              />
            )}
            <div className="text-2xl">{s.icon}</div>
            <div className="min-w-0">
              <div
                className="text-[14px] font-medium"
                style={{ color: isActive ? "var(--color-primary)" : "var(--color-text)" }}
              >
                {s.label}
              </div>
              <div className="text-[12px] leading-snug truncate" style={{ color: "var(--color-text-secondary)" }}>
                {isActive && currentContext ? currentContext : s.subtitle}
              </div>
              {isActive && currentContext && (
                <div className="text-[9px] mt-0.5 italic" style={{ color: "rgba(110,110,115,0.4)" }}>
                  For reference only
                </div>
              )}
            </div>
          </button>
        );
      })}
    </aside>
  );
}
