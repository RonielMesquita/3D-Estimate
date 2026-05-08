"use client"

import dynamic from "next/dynamic"
import PhasePanel from "@/components/PhasePanel"
import BudgetPanel from "@/components/BudgetPanel"
import ProgressTracker from "@/components/ProgressTracker"
import { useProjectStore } from "@/store/useProjectStore"
import { useShallow } from "zustand/react/shallow"
import { useAdminStore } from "@/store/useAdminStore"
import { useMemo } from "react"

const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false })

export default function Home() {
  const { selectedPhases, selectedVariants } = useProjectStore(
    useShallow((s) => ({ selectedPhases: s.selectedPhases, selectedVariants: s.selectedVariants }))
  )
  const phases = useAdminStore((s) => s.phases)
  const { title, subtitle, logoText } = useAdminStore((s) => s.projectSettings)

  const total = useMemo(() =>
    selectedPhases.reduce((sum, phaseId) => {
      const phase = phases.find((p) => p.id === phaseId)
      if (!phase) return sum
      const variantId = selectedVariants[phaseId]
      const option = variantId ? phase.options.find((o) => o.id === variantId) : phase.options[0]
      return sum + (option?.price ?? phase.price)
    }, 0),
  [selectedPhases, selectedVariants, phases])

  return (
    <div className="flex flex-col h-full w-full bg-[#060b16]">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-28 flex items-center px-5 gap-3 border-b border-white/[0.07] bg-[#060b16]/98 backdrop-blur z-30">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/40 flex-shrink-0">
            <span className="text-white font-black text-base">{logoText}</span>
          </div>
          <div className="leading-tight">
            <p className="text-white font-black text-sm tracking-tight">{title}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.12em]">{subtitle}</p>
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-white/[0.08] flex-shrink-0 mx-1" />

        {/* Progress tracker — flex-1 fills all available space */}
        <div className="flex-1 min-w-0 flex items-center">
          <ProgressTracker />
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-white/[0.08] flex-shrink-0 mx-1" />

        {/* Right section: 3D button + Total stacked */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {/* Golden outlined button */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-100"
            style={{
              border: "1.5px solid #f59e0b",
              background: "rgba(245,158,11,0.06)",
              boxShadow: "0 0 16px rgba(245,158,11,0.12)",
            }}
          >
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            <span className="text-[11px] font-bold tracking-widest uppercase text-amber-400 whitespace-nowrap">
              Ver Modelo 3D Completo
            </span>
          </button>

          {/* Total */}
          <div className="text-right">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Estimativa Total</p>
            <p className="text-2xl font-black text-amber-400 tabular-nums leading-none">
              ${total.toLocaleString()}
              <span className="text-[10px] font-normal text-gray-600 ml-1">USD</span>
            </p>
          </div>
        </div>

      </header>

      {/* ── Main 3-column layout ──────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left — Phase timeline */}
        <div className="w-80 flex-shrink-0 h-full">
          <PhasePanel />
        </div>

        {/* Center — 3D canvas */}
        <div className="flex-1 h-full relative">
          <Scene3D />
        </div>

        {/* Right — Budget */}
        <div className="w-96 flex-shrink-0 h-full">
          <BudgetPanel />
        </div>
      </div>

      {/* Admin link */}
      <a
        href="/admin"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-black/40 text-gray-600 text-[10px] font-medium backdrop-blur hover:text-gray-300 hover:border-white/20 transition-all duration-200"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Admin
      </a>
    </div>
  )
}
