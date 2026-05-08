const { app, BrowserWindow, ipcMain, dialog, session } = require("electron")
const path = require("path")

const isDev = !app.isPackaged

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: "#050B14",
    title: "BeachLife 3D",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // allows loading local file:// models
    },
  })

  const url = "http://localhost:3000"

  if (isDev) {
    mainWindow.loadURL(url)
    mainWindow.webContents.openDevTools({ mode: "detach" })
  } else {
    // In production, Next.js standalone server is started before createWindow
    const tryLoad = () => {
      mainWindow.loadURL(url).catch(() => setTimeout(tryLoad, 500))
    }
    tryLoad()
  }

  mainWindow.once("ready-to-show", () => mainWindow.show())
  mainWindow.on("closed", () => { mainWindow = null })
}

// In production: start the bundled Next.js server
if (!isDev) {
  const serverPath = path.join(process.resourcesPath, "app", "server.js")
  process.chdir(path.join(process.resourcesPath, "app"))
  try { require(serverPath) } catch (e) { console.error("Server failed:", e) }
}

app.whenReady().then(() => {
  // Allow file:// access for local GLB models
  session.defaultSession.protocol.interceptFileProtocol("file", (request, callback) => {
    callback({ path: decodeURIComponent(request.url.replace("file:///", "").replace("file://", "")) })
  })

  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

app.on("activate", () => {
  if (!mainWindow) createWindow()
})

// IPC: open file dialog to pick a .glb model
ipcMain.handle("open-glb-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Selecionar modelo 3D",
    properties: ["openFile"],
    filters: [{ name: "Modelo 3D", extensions: ["glb", "gltf"] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  // Convert to file:// URL (cross-platform)
  return "file:///" + filePath.replace(/\\/g, "/")
})
