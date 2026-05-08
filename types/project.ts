export interface PhaseOption {
  id: string
  title: string
  subtitle: string
  description: string
  benefits: string[]
  price: number
  badge?: string
  image?: string
  // Admin-extended
  affectsGeometry?: boolean
  recommendedByDefault?: boolean
  showInClientSummary?: boolean
}

export interface Phase {
  id: string
  name: string
  category: string
  price: number
  duration: string
  description: string
  modelObjectName: string
  color: string
  options: PhaseOption[]
  // Admin-extended
  active?: boolean
  showInPresentation?: boolean
  animationType?: string
  cameraFocus?: string
  visibilityBehavior?: string
  clientTitle?: string
  clientSubtitle?: string
  technicalDescription?: string
  recommendationNote?: string
  selectionType?: string
  includeInTotal?: boolean
  includeInPDF?: boolean
  showInSidebar?: boolean
  defaultOptionId?: string
  isFeatured?: boolean
  highlightInTimeline?: boolean
  allowSkip?: boolean
  lockedUntilPrevious?: boolean
}

export interface ProjectState {
  pendingPhase: string | null
  selectedPhases: string[]
  selectedVariants: Record<string, string>
  showAll: boolean
  computedTotal: number

  openPhaseOptions: (id: string) => void
  confirmVariant: (phaseId: string, optionId: string) => void
  removePhase: (id: string) => void
  resetProject: () => void
  isPhaseActive: (id: string) => boolean
  isPhaseCompleted: (id: string) => boolean
  toggleShowAll: () => void
  totalPrice: () => number
  totalDays: () => number
  getSelectedOption: (phaseId: string) => PhaseOption | undefined
}
