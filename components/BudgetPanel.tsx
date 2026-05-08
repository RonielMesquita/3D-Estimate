"use client"

import { useProjectStore } from "@/store/useProjectStore"
import { useShallow } from "zustand/react/shallow"
import { useAdminStore } from "@/store/useAdminStore"
import { generateProposalPDF } from "@/utils/generatePDF"

export default function BudgetPanel() {
  const { selectedPhases, selectedVariants, showAll } = useProjectStore(
    useShallow((s) => ({
      selectedPhases:   s.selectedPhases,
      selectedVariants: s.selectedVariants,
      showAll:          s.showAll,
    }))
  )
  const phases = useAdminStore((s) => s.phases)

  const activePhases = showAll ? phases : phases.filter((p) => selectedPhases.includes(p.id))

  const total = selectedPhases.reduce((sum, phaseId) => {
    const phase = phases.find((p) => p.id === phaseId)
    if (!phase) return sum
    const variantId = selectedVariants[phaseId]
    const option = variantId ? phase.options.find((o) => o.id === variantId) : phase.options[0]
    return sum + (option?.price ?? phase.price)
  }, 0)

  const days  = activePhases.reduce((sum, p) => sum + parseInt(p.duration), 0)
  const weeks = Math.ceil(days / 5)
  const pct   = Math.round((selectedPhases.length / phases.length) * 100)

  return (
    <div className="flex flex-col h-full border-l border-white/[0.08]" style={{ background: "rgba(8,12,24,1)" }}>

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.10]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-[0.15em] text-emerald-400 uppercase">
              Budget Summary
            </span>
          </div>
          <span className="text-xs text-gray-500 font-semibold">
            {selectedPhases.length}/{phases.length} phases
          </span>
        </div>
      </div>

      {/* Total Investment */}
      <div className="px-5 py-5 border-b border-white/[0.10]" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Total Investment</p>
        <p className="text-4xl font-black tabular-nums leading-none" style={{ color: total > 0 ? "#f59e0b" : "#374151" }}>
          ${total.toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-1.5">USD</span>
        </p>

        {days > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl px-3 py-2.5 border" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.20)" }}>
              <p className="text-[9px] text-emerald-600 uppercase tracking-wider font-semibold">Duration</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{days} days</p>
            </div>
            <div className="rounded-xl px-3 py-2.5 border" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.20)" }}>
              <p className="text-[9px] text-emerald-600 uppercase tracking-wider font-semibold">Timeline</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{weeks} weeks</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-gray-500">Project completion</span>
            <span className="text-white font-bold">{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #f59e0b, #10b981)" }}
            />
          </div>
        </div>
      </div>

      {/* Selection summary */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activePhases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm font-semibold">No phases selected</p>
              <p className="text-gray-600 text-xs mt-1">Click "Build Next Phase" to start</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] px-1 mb-3">
              Selected Phases
            </p>
            {activePhases.map((phase, i) => {
              const varId = selectedVariants[phase.id]
              const opt   = varId ? phase.options.find((o) => o.id === varId) : phase.options[0]
              return (
                <div
                  key={phase.id}
                  className="flex items-start gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: `${phase.color}30`,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: phase.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-200 leading-tight truncate">
                      {String(i + 1).padStart(2, "0")} {phase.name}
                    </p>
                    {opt && (
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{opt.subtitle}</p>
                    )}
                  </div>
                  <p className="text-sm font-black tabular-nums flex-shrink-0" style={{ color: phase.color }}>
                    ${(opt?.price ?? phase.price).toLocaleString()}
                  </p>
                </div>
              )
            })}

            {/* Subtotal line */}
            <div className="mt-3 pt-3 border-t border-white/[0.10] flex justify-between items-center px-1">
              <span className="text-xs text-gray-500 font-semibold">Subtotal</span>
              <span className="text-base font-black text-amber-400 tabular-nums">${total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 py-4 border-t border-white/[0.10]">
        <button
          disabled={activePhases.length === 0}
          onClick={() => generateProposalPDF(activePhases, total, days)}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 hover:scale-[1.02] active:scale-100"
          style={{
            background: activePhases.length > 0
              ? "linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)"
              : "rgba(255,255,255,0.05)",
            boxShadow: activePhases.length > 0 ? "0 4px 24px rgba(29,78,216,0.35)" : undefined,
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Proposal PDF
        </button>
        <p className="text-center text-[10px] text-gray-600 mt-2">Prices are indicative estimates</p>
      </div>
    </div>
  )
}
