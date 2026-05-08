"use client"

import { useProjectStore } from "@/store/useProjectStore"
import { useAdminStore } from "@/store/useAdminStore"

export default function SelectedPhaseCard() {
  const { selectedPhases, pendingPhase, getSelectedOption, removePhase } = useProjectStore()
  const phases = useAdminStore((s) => s.phases)

  // Only show when no pending choice is active and there's a last confirmed phase
  if (pendingPhase || selectedPhases.length === 0) return null

  const lastPhaseId = selectedPhases[selectedPhases.length - 1]
  const phase = phases.find((p) => p.id === lastPhaseId)
  const option = getSelectedOption(lastPhaseId)
  if (!phase || !option) return null

  const stepNumber = phases.findIndex((p) => p.id === lastPhaseId) + 1

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-80">
      {/* Confirmed label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
            Step {String(stepNumber).padStart(2, "0")} Confirmed
          </span>
        </div>
      </div>

      <div
        className="rounded-2xl border overflow-hidden backdrop-blur-2xl"
        style={{
          borderColor: `${phase.color}45`,
          background: "linear-gradient(135deg, rgba(6,9,18,0.92) 0%, rgba(4,7,14,0.95) 100%)",
          boxShadow: `0 8px 40px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* Image */}
        <div className="w-full h-28 flex items-center justify-center border-b overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", borderColor: `${phase.color}25` }}>
          {option.image ? (
            <img src={option.image} alt={option.subtitle} className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="flex items-center gap-2 opacity-25">
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-3.5" style={{ background: "rgba(6,9,20,0.97)" }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{option.title}</p>
              <p className="text-sm font-bold text-white">{option.subtitle}</p>
            </div>
            {option.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/25 flex-shrink-0 ml-2">
                {option.badge}
              </span>
            )}
          </div>

          <ul className="space-y-0.5 mt-2 mb-3">
            {option.benefits.slice(0, 3).map((b) => (
              <li key={b} className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg className="w-3 h-3 flex-shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: `${phase.color}20` }}>
            <p className="text-lg font-black tabular-nums" style={{ color: phase.color }}>
              +${option.price.toLocaleString()}
            </p>
            <button
              onClick={() => removePhase(lastPhaseId)}
              className="text-[10px] text-gray-600 hover:text-red-400 transition-colors duration-200 underline underline-offset-2"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
