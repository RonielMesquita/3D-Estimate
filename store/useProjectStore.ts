import { create } from "zustand"
import { useAdminStore } from "@/store/useAdminStore"
import { PhaseOption, ProjectState } from "@/types/project"

function getPhases() {
  return useAdminStore.getState().phases
}

function calcTotal(
  selectedPhases: string[],
  selectedVariants: Record<string, string>,
  showAll: boolean
): number {
  const phases = getPhases()
  const active = showAll ? phases : phases.filter((p) => selectedPhases.includes(p.id))
  return active.reduce((sum, p) => {
    const variantId = selectedVariants[p.id]
    const option = variantId ? p.options.find((o) => o.id === variantId) : p.options[0]
    return sum + (option?.price ?? p.price)
  }, 0)
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  pendingPhase: null,
  selectedPhases: [],
  selectedVariants: {},
  showAll: false,
  computedTotal: 0,

  openPhaseOptions: (id: string) => {
    const { selectedPhases } = get()
    if (selectedPhases.includes(id)) {
      const next = selectedPhases.filter((p) => p !== id)
      set({
        selectedPhases: next,
        pendingPhase: null,
        computedTotal: calcTotal(next, get().selectedVariants, get().showAll),
      })
    } else {
      set({ pendingPhase: id })
    }
  },

  confirmVariant: (phaseId: string, optionId: string) => {
    const { selectedPhases, selectedVariants, showAll } = get()
    const phase = getPhases().find((p) => p.id === phaseId)
    const option = phase?.options.find((o) => o.id === optionId)
    if (!option) return
    const nextPhases   = selectedPhases.includes(phaseId) ? selectedPhases : [...selectedPhases, phaseId]
    const nextVariants = { ...selectedVariants, [phaseId]: optionId }
    set({
      pendingPhase: null,
      selectedPhases: nextPhases,
      selectedVariants: nextVariants,
      computedTotal: calcTotal(nextPhases, nextVariants, showAll),
    })
  },

  removePhase: (id: string) => {
    const { selectedPhases, selectedVariants, showAll } = get()
    const nextVariants = { ...selectedVariants }
    delete nextVariants[id]
    const nextPhases = selectedPhases.filter((p) => p !== id)
    set({
      selectedPhases: nextPhases,
      selectedVariants: nextVariants,
      pendingPhase: null,
      computedTotal: calcTotal(nextPhases, nextVariants, showAll),
    })
  },

  resetProject: () => set({
    selectedPhases: [],
    selectedVariants: {},
    pendingPhase: null,
    showAll: false,
    computedTotal: 0,
  }),

  toggleShowAll: () => {
    const { selectedPhases, selectedVariants, showAll } = get()
    const next = !showAll
    set({
      showAll: next,
      computedTotal: calcTotal(selectedPhases, selectedVariants, next),
    })
  },

  isPhaseActive:    (id: string) => get().selectedPhases.includes(id),
  isPhaseCompleted: (id: string) => {
    const { selectedPhases } = get()
    const phases  = getPhases()
    const idx     = phases.findIndex((p) => p.id === id)
    const lastIdx = selectedPhases.length > 0
      ? phases.findIndex((p) => p.id === selectedPhases[selectedPhases.length - 1])
      : -1
    return selectedPhases.includes(id) && idx < lastIdx
  },

  totalPrice: () => get().computedTotal,
  totalDays:  () => {
    const { selectedPhases, showAll } = get()
    const phases = getPhases()
    const active = showAll ? phases : phases.filter((p) => selectedPhases.includes(p.id))
    return active.reduce((sum, p) => sum + parseInt(p.duration), 0)
  },

  getSelectedOption: (phaseId: string): PhaseOption | undefined => {
    const { selectedVariants } = get()
    const phase = getPhases().find((p) => p.id === phaseId)
    if (!phase) return undefined
    const variantId = selectedVariants[phaseId]
    return variantId ? phase.options.find((o) => o.id === variantId) : phase.options[0]
  },
}))
