import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Phase, PhaseOption } from "@/types/project"
import { phases as defaultPhases } from "@/data/phases"

export interface ProjectSettings {
  title: string
  subtitle: string
  logoText: string
  currency: string
}

interface AdminState {
  phases: Phase[]
  projectSettings: ProjectSettings
  updatePhase: (phaseId: string, patch: Partial<Omit<Phase, "id" | "options">>) => void
  updateOption: (phaseId: string, optionId: string, patch: Partial<PhaseOption>) => void
  updateProjectSettings: (patch: Partial<ProjectSettings>) => void
  addPhase: (phase: Phase) => void
  duplicatePhase: (phaseId: string) => void
  deletePhase: (phaseId: string) => void
  reorderPhases: (phases: Phase[]) => void
  addOption: (phaseId: string) => void
  deleteOption: (phaseId: string, optionId: string) => void
  resetToDefault: () => void
}

const DEFAULT_SETTINGS: ProjectSettings = {
  title: "BEACHLIFE",
  subtitle: "Development",
  logoText: "B",
  currency: "USD",
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      phases: defaultPhases,
      projectSettings: DEFAULT_SETTINGS,

      updatePhase: (phaseId, patch) =>
        set((s) => ({
          phases: s.phases.map((p) => (p.id === phaseId ? { ...p, ...patch } : p)),
        })),

      updateOption: (phaseId, optionId, patch) =>
        set((s) => ({
          phases: s.phases.map((p) =>
            p.id !== phaseId
              ? p
              : { ...p, options: p.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) }
          ),
        })),

      updateProjectSettings: (patch) =>
        set((s) => ({ projectSettings: { ...s.projectSettings, ...patch } })),

      addPhase: (phase) => set((s) => ({ phases: [...s.phases, phase] })),

      reorderPhases: (phases) => set({ phases }),

      duplicatePhase: (phaseId) => {
        const phase = get().phases.find((p) => p.id === phaseId)
        if (!phase) return
        const copy: Phase = {
          ...phase,
          id: `${phase.id}_copy_${Date.now()}`,
          name: `${phase.name} (cópia)`,
          options: phase.options.map((o) => ({ ...o, id: `${o.id}_${Date.now()}` })),
        }
        set((s) => ({ phases: [...s.phases, copy] }))
      },

      deletePhase: (phaseId) =>
        set((s) => ({ phases: s.phases.filter((p) => p.id !== phaseId) })),

      addOption: (phaseId) =>
        set((s) => ({
          phases: s.phases.map((p) =>
            p.id !== phaseId
              ? p
              : {
                  ...p,
                  options: [
                    ...p.options,
                    {
                      id: `opt_${Date.now()}`,
                      title: "Nova Opção",
                      subtitle: "Subtítulo da opção",
                      description: "",
                      benefits: [],
                      price: 0,
                    },
                  ],
                }
          ),
        })),

      deleteOption: (phaseId, optionId) =>
        set((s) => ({
          phases: s.phases.map((p) =>
            p.id !== phaseId
              ? p
              : { ...p, options: p.options.filter((o) => o.id !== optionId) }
          ),
        })),

      resetToDefault: () => set({ phases: defaultPhases, projectSettings: DEFAULT_SETTINGS }),
    }),
    { name: "beachlife_config" }
  )
)
