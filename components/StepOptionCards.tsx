"use client"

import { useProjectStore } from "@/store/useProjectStore"
import { useAdminStore } from "@/store/useAdminStore"

export default function StepOptionCards() {
  const { pendingPhase, confirmVariant } = useProjectStore()
  const phases = useAdminStore((s) => s.phases)

  if (!pendingPhase) return null

  const phase = phases.find((p) => p.id === pendingPhase)
  if (!phase) return null

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 w-80">
      {/* Step label */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: phase.color }} />
        <span className="text-xs font-semibold uppercase tracking-widest drop-shadow-lg" style={{ color: phase.color }}>
          {phase.category}
        </span>
      </div>
      <h3 className="text-white font-bold text-base leading-tight -mt-2 mb-1 drop-shadow-lg">{phase.name}</h3>

      {phase.options.map((option) => (
        <button
          key={option.id}
          onClick={() => confirmVariant(phase.id, option.id)}
          className="group relative text-left rounded-2xl border overflow-hidden transition-all duration-300
            backdrop-blur-2xl border-white/20
            hover:border-amber-400/60 hover:-translate-y-1"
          style={{
            boxShadow: "0 8px 40px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Recommended badge */}
          {/* Recommended badge */}
          {option.badge && (
            <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400/25 text-amber-300 border border-amber-400/40">
              {option.badge}
            </div>
          )}

          {/* Image area */}
          <div
            className="w-full h-32 flex items-center justify-center border-b border-white/10 overflow-hidden"
            style={{ background: "rgba(10,14,28,0.60)" }}
          >
            {option.image ? (
              <img src={option.image} alt={option.subtitle} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-25">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] text-white/40">Photo coming soon</span>
              </div>
            )}
          </div>

          {/* Content area — solid dark */}
          <div className="p-3.5" style={{ background: "rgba(6,9,20,0.97)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
              {option.title}
            </p>
            <p className="text-sm font-bold mb-1.5" style={{ color: option.badge ? "#fbbf24" : "#f1f5f9" }}>
              {option.subtitle}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed mb-2.5">{option.description}</p>

            <ul className="space-y-1 mb-3">
              {option.benefits.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-xs text-gray-300">
                  <svg className="w-3 h-3 flex-shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Investment</p>
                <p className="text-lg font-black tabular-nums" style={{ color: option.badge ? "#fbbf24" : "#e2e8f0" }}>
                  +${option.price.toLocaleString()}
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200
                bg-white/5 text-gray-400 border-white/10
                group-hover:bg-amber-500/20 group-hover:text-amber-300 group-hover:border-amber-500/30">
                Selecionar →
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
