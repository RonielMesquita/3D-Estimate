"use client"

import { Phase } from "@/types/project"
import { useProjectStore } from "@/store/useProjectStore"

interface Props {
  phase: Phase
}

export default function PhaseButton({ phase }: Props) {
  const { openPhaseOptions, isPhaseActive } = useProjectStore()
  const active = isPhaseActive(phase.id)

  return (
    <button
      onClick={() => openPhaseOptions(phase.id)}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 group ${
        active
          ? "border-opacity-80 bg-opacity-15 shadow-lg"
          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
      }`}
      style={
        active
          ? {
              borderColor: phase.color,
              backgroundColor: `${phase.color}18`,
              boxShadow: `0 0 12px ${phase.color}30`,
            }
          : {}
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200"
            style={{
              backgroundColor: active ? phase.color : "#4b5563",
              boxShadow: active ? `0 0 8px ${phase.color}` : "none",
            }}
          />
          <div>
            <p
              className="text-sm font-medium leading-tight"
              style={{ color: active ? phase.color : "#e5e7eb" }}
            >
              {phase.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{phase.duration} days</p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-sm font-semibold tabular-nums"
            style={{ color: active ? phase.color : "#9ca3af" }}
          >
            ${phase.price.toLocaleString()}
          </p>
          <div
            className={`mt-1 text-xs px-1.5 py-0.5 rounded text-center transition-all duration-200 ${
              active ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundColor: `${phase.color}30`, color: phase.color }}
          >
            ACTIVE
          </div>
        </div>
      </div>
    </button>
  )
}
