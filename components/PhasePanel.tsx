"use client"

import { useAdminStore } from "@/store/useAdminStore"
import { useProjectStore } from "@/store/useProjectStore"

export default function PhasePanel() {
  const { selectedPhases, pendingPhase, openPhaseOptions, resetProject } = useProjectStore()
  const phases = useAdminStore((s) => s.phases)
  const categories = [...new Set(phases.map((p) => p.category))]

  return (
    <div className="flex flex-col h-full bg-[#080d1a] border-r border-white/[0.06]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-cyan-400 uppercase">
            Construction Timeline
          </span>
        </div>
        <p className="text-gray-600 text-xs mt-1">
          {selectedPhases.length} of {phases.length} steps added
        </p>
      </div>

      {/* Phase list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {categories.map((cat) => {
          const catPhases = phases.filter((p) => p.category === cat)
          return (
            <div key={cat}>
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-2 px-1">
                {cat}
              </p>
              <div className="space-y-1.5">
                {catPhases.map((phase) => {
                  const stepNum = phases.findIndex((p) => p.id === phase.id) + 1
                  const isActive   = selectedPhases.includes(phase.id)
                  const isPending  = pendingPhase === phase.id
                  const isLast     = selectedPhases[selectedPhases.length - 1] === phase.id

                  let bg = "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                  let numColor = "bg-white/5 text-gray-600"
                  let titleColor = "text-gray-400"
                  let priceColor = "text-gray-600"

                  if (isPending) {
                    bg = "bg-amber-500/5 border-amber-500/30"
                    numColor = "bg-amber-500/20 text-amber-400"
                    titleColor = "text-amber-300"
                    priceColor = "text-amber-400"
                  } else if (isLast) {
                    bg = "border-amber-400/40 shadow-lg shadow-amber-900/10"
                    numColor = "bg-amber-400 text-gray-950"
                    titleColor = "text-white"
                    priceColor = "text-amber-400"
                  } else if (isActive) {
                    bg = "bg-cyan-500/5 border-cyan-500/20"
                    numColor = "bg-cyan-500/20 text-cyan-400"
                    titleColor = "text-cyan-300"
                    priceColor = "text-cyan-400"
                  }

                  return (
                    <button
                      key={phase.id}
                      onClick={() => openPhaseOptions(phase.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${bg}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${numColor}`}>
                          {isActive && !isLast ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : String(stepNum).padStart(2, "0")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold leading-tight truncate transition-colors ${titleColor}`}>
                            {phase.name}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{phase.duration} days</p>
                        </div>
                        <p className={`text-xs font-bold tabular-nums flex-shrink-0 transition-colors ${priceColor}`}>
                          ${(phase.price / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={resetProject}
          className="w-full py-2 rounded-lg text-xs font-medium text-gray-500 border border-white/[0.06] hover:bg-white/5 hover:text-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Project
        </button>
      </div>
    </div>
  )
}
