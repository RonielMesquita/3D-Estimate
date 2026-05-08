interface Window {
  electron?: {
    isElectron: boolean
    openGlbDialog: () => Promise<string | null>
  }
}
