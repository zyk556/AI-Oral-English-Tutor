interface ScenarioSelectorProps {
  onSelect: (scenario: string) => void;
  currentScenario: string | null;
}

const scenarios = [
  { id: "interview", label: "Interview", icon: "💼", subtitle: "Job interview" },
  { id: "ordering", label: "Restaurant", icon: "🍽️", subtitle: "Order food" },
  { id: "meeting", label: "Meeting", icon: "👥", subtitle: "Standup meeting" },
  { id: "directions", label: "Directions", icon: "🗺️", subtitle: "Ask the way" },
  { id: "doctor", label: "Doctor", icon: "🏥", subtitle: "See a doctor" },
  { id: "airport", label: "Airport", icon: "✈️", subtitle: "Check-in" },
  { id: "hotel", label: "Hotel", icon: "🏨", subtitle: "Hotel check-in" },
  { id: "dating", label: "Dating", icon: "💕", subtitle: "Cafe date" },
];

export default function ScenarioSelector({
  onSelect,
  currentScenario,
}: ScenarioSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {scenarios.map((s) => {
        const isActive = currentScenario === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200"
            style={{
              background: isActive ? "rgba(91,108,255,0.08)" : "white",
              border: isActive
                ? "1px solid rgba(91,108,255,0.15)"
                : "1px solid rgba(0,0,0,0.04)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <div className="text-2xl">{s.icon}</div>
            <div className="min-w-0">
              <div
                className="text-[14px] font-medium"
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
    </div>
  );
}
