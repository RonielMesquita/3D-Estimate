"use client"

import { useAdminStore } from "@/store/useAdminStore"
import { useProjectStore } from "@/store/useProjectStore"

const SHORT: Record<string, string> = {
  piles:          "Piles",
  rebar_beams:    "Vergalhão",
  steel_mesh:     "Malha",
  floor_concrete: "Concreto",
  panels_gf:      "SCIP GF",
  slab_structure: "Laje L1",
  slab_concrete:  "Conc L1",
  panels_sf:      "SCIP 2F",
  scip_slab:      "Laje L2",
  shotcrete_l1:   "Tiro 2F",
  panels_tf:      "SCIP 3F",
  roof_panels:    "Teto",
  shotcrete_roof: "Tiro Rf",
}

export default function ProgressTracker() {
  const { selectedPhases, pendingPhase, openPhaseOptions } = useProjectStore()
  const phases = useAdminStore((s) => s.phases)

  return (
    <div className="flex items-start w-full select-none">
      {phases.map((phase, idx) => {
        const isCompleted = selectedPhases.includes(phase.id)
        const isPending   = pendingPhase === phase.id
        const isLast      = selectedPhases[selectedPhases.length - 1] === phase.id
        const isNotLast   = idx < phases.length - 1

        const circleClass = isCompleted
          ? isLast
            ? "bg-amber-400 text-gray-950 shadow-lg shadow-amber-500/40"
            : "bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/50"
          : isPending
          ? "bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/50"
          : "bg-white/[0.07] text-gray-400 ring-1 ring-white/10"

        const labelClass = isCompleted
          ? isLast ? "text-amber-400" : "text-cyan-400"
          : isPending ? "text-amber-400"
          : "text-gray-500"

        return (
          <div key={phase.id} className={`flex items-start ${isNotLast ? "flex-1 min-w-0" : ""}`}>
            {/* Circle + label */}
            <button
              onClick={() => openPhaseOptions(phase.id)}
              className="flex flex-col items-center gap-1.5 group flex-shrink-0"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300 group-hover:scale-110 ${circleClass}`}>
                {isCompleted && !isLast ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  String(idx + 1).padStart(2, "0")
                )}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap transition-colors duration-300 leading-tight text-center ${labelClass}`}>
                {SHORT[phase.id] ?? phase.name}
              </span>
            </button>

            {/* Flexible connector */}
            {isNotLast && (
              <div className={`flex-1 h-px mt-7 mx-1 transition-colors duration-500 ${
                isCompleted ? "bg-cyan-500/50" : "bg-white/[0.08]"
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
