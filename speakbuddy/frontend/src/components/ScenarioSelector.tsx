import React from "react";
import { FaBriefcase, FaUtensils, FaUsers } from "react-icons/fa";

interface ScenarioSelectorProps {
  onSelect: (scenario: string) => void;
  currentScenario: string | null;
}

const scenarios = [
  {
    id: "interview",
    label: "Job Interview",
    icon: FaBriefcase,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    id: "ordering",
    label: "Restaurant Order",
    icon: FaUtensils,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    id: "meeting",
    label: "Team Meeting",
    icon: FaUsers,
    color: "bg-purple-500 hover:bg-purple-600",
  },
];

export default function ScenarioSelector({
  onSelect,
  currentScenario,
}: ScenarioSelectorProps) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {scenarios.map((s) => {
        const Icon = s.icon;
        const isActive = currentScenario === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium transition-all duration-200 shadow-md ${
              isActive
                ? `${s.color} ring-2 ring-offset-2 ring-gray-400 scale-105`
                : `${s.color} opacity-80 hover:opacity-100 hover:scale-105`
            }`}
          >
            <Icon size={18} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
