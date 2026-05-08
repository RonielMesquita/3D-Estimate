"use client"

import type { ReactNode } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { useProjectStore } from "@/store/useProjectStore"

function ControlItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150 select-none cursor-default">
      {icon}
      <span className="text-[11px] font-medium tracking-wide whitespace-nowrap">{label}</span>
    </button>
  )
}

function ControlsCard() {
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center px-2 py-1.5 rounded-2xl"
      style={{ background: "rgba(6,8,18,0.78)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Drag to orbit */}
      <ControlItem
        label="Drag to orbit"
        icon={
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.636 5.636a9 9 0 1 0 12.728 12.728" />
            <path d="M20.485 3.515 17.6 6.4" />
            <path d="M20.485 3.515H15.5" />
            <path d="M20.485 3.515V8.5" />
          </svg>
        }
      />

      <div className="w-1 h-1 rounded-full bg-white/20 mx-0.5 flex-shrink-0" />

      {/* Scroll to zoom */}
      <ControlItem
        label="Scroll to zoom"
        icon={
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="3" width="8" height="13" rx="4" />
            <line x1="12" y1="7" x2="12" y2="11" />
            <path d="M5 17a7 7 0 0 0 14 0" />
          </svg>
        }
      />

      <div className="w-1 h-1 rounded-full bg-white/20 mx-0.5 flex-shrink-0" />

      {/* Right click to pan */}
      <ControlItem
        label="Right click to pan"
        icon={
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V8a2 2 0 0 0-4 0v0" />
            <path d="M14 10.5V6a2 2 0 0 0-4 0v5.5" />
            <path d="M10 10.5V8a2 2 0 0 0-4 0v6a8 8 0 0 0 16 0v-5a2 2 0 0 0-4 0v1.5" />
          </svg>
        }
      />
    </div>
  )
}

export default function NavigationBar() {
  const { selectedPhases, pendingPhase, openPhaseOptions, removePhase } = useProjectStore()
  const phases = useAdminStore((s) => s.phases)

  const started  = selectedPhases.length > 0
  const nextIdx  = selectedPhases.length
  const hasNext  = nextIdx < phases.length
  const hasPrev  = selectedPhases.length > 0

  const handleAdvance = () => {
    if (hasNext) openPhaseOptions(phases[nextIdx].id)
  }

  const handleBack = () => {
    if (hasPrev) removePhase(selectedPhases[selectedPhases.length - 1])
  }

  // ── Estado inicial: botão COMEÇAR grande pulsante no centro ──
  if (!started && !pendingPhase) {
    return (
      <>
        {/* Botão central grande */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-4">
            {/* Pulse rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-48 h-48 rounded-full bg-amber-400/10 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute w-36 h-36 rounded-full bg-amber-400/15 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
              <button
                onClick={handleAdvance}
                className="relative w-32 h-32 rounded-full font-black text-gray-950 text-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl shadow-amber-900/60 z-10"
                style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
              >
                Começar
              </button>
            </div>
            <p className="text-gray-500 text-sm tracking-wider animate-pulse">
              Clique para iniciar a construção
            </p>
          </div>
        </div>

        {/* Card de controles */}
        <ControlsCard />
      </>
    )
  }

  // ── Escolhendo card: esconde navegação ──
  if (pendingPhase) return <ControlsCard />

  // ── Em progresso: Avançar centralizado, Voltar à esquerda ──
  return (
    <>
      {/* Voltar — canto inferior esquerdo */}
      {hasPrev && (
        <div className="absolute bottom-6 left-6 z-20">
          <button
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/15 text-gray-400 transition-all duration-200 hover:border-white/30 hover:text-white"
            style={{ background: "rgba(6,9,20,0.82)", backdropFilter: "blur(16px)" }}
          >
            ← Voltar
          </button>
        </div>
      )}

      {/* Avançar / Completo — centralizado, acima do ControlsCard */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
        {hasNext ? (
          <button
            onClick={handleAdvance}
            className="px-10 py-3 rounded-xl text-sm font-bold text-gray-950 transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-100 shadow-lg shadow-amber-900/40"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
          >
            Build Next Phase →
          </button>
        ) : (
          <div
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-2"
            style={{ background: "rgba(6,9,20,0.82)", backdropFilter: "blur(16px)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Projeto Completo
          </div>
        )}
      </div>

      {/* Card de controles */}
      <ControlsCard />
    </>
  )
}
