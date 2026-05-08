const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  openGlbDialog: () => ipcRenderer.invoke("open-glb-dialog"),
})
