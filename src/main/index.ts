import { app, shell, BrowserWindow, ipcMain, globalShortcut, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createWorker } from 'tesseract.js'
import { initAIServices } from './aiService'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

// Helper for Tesseract OCR
async function runOCR(pngBuffer: Buffer): Promise<string> {
  // Create a Tesseract worker with English language
  const worker = await createWorker('eng')
  try {
    const { data: { text } } = await worker.recognize(pngBuffer)
    return text
  } catch (err) {
    console.error('Tesseract OCR error:', err)
    return `OCR Failed: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    await worker.terminate()
  }
}

function createWindow(): void {
  // Create the floating frameless translucent browser window
  mainWindow = new BrowserWindow({
    width: 380,
    height: 600,
    minWidth: 300,
    minHeight: 80,
    show: false,
    frame: false, // Frameless window
    transparent: true, // Transparent window for glassmorphism
    backgroundColor: '#00000000', // Set transparent background color to prevent solid black overlay on Windows
    alwaysOnTop: true, // Floats above all other apps
    skipTaskbar: true, // Invisible in taskbar
    hasShadow: false, // Disable native shadow to prevent rendering artifacts/black backgrounds on Windows
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Set Content Protection (makes the window black/invisible during screen share)
  mainWindow.setAlwaysOnTop(true, 'screen-saver') // Stay on top of full-screen browsers/games
  mainWindow.setContentProtection(true)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load appropriate URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register global keyboard shortcuts
function registerGlobalShortcuts(): void {
  try {
    // Ctrl+Shift+A to toggle overlay visibility
    globalShortcut.register('Ctrl+Shift+A', () => {
      if (mainWindow) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })

    // Ctrl+Shift+V to toggle voice transcription in the overlay
    globalShortcut.register('Ctrl+Shift+V', () => {
      if (mainWindow) {
        mainWindow.webContents.send('global-shortcut-voice')
      }
    })

    // Ctrl+Shift+Q to quit the application instantly
    globalShortcut.register('Ctrl+Shift+Q', () => {
      app.quit()
    })
  } catch (err) {
    console.error('Failed to register global shortcuts:', err)
  }
}

app.whenReady().then(() => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.adrishya.app')

  // Optimize window shortcuts (F12, etc.)
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Set up IPC listeners
  initAIServices()

  // Quit the application instantly
  ipcMain.on('quit-app', () => {
    app.quit()
  })
  
  // Window Resizing & Collapsing (pill vs full panel)
  ipcMain.on('resize-window', (_event, width: number, height: number) => {
    if (mainWindow) {
      mainWindow.setSize(width, height)
    }
  })

  // Dragging support for Frameless windows if custom drag handles are used
  ipcMain.on('window-move', (_event, deltaX: number, deltaY: number) => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition()
      mainWindow.setPosition(x + deltaX, y + deltaY)
    }
  })

  // Toggle Content Protection (screen sharing invisibility)
  ipcMain.handle('set-screen-protection', (_event, enabled: boolean) => {
    if (mainWindow) {
      mainWindow.setContentProtection(enabled)
      return true
    }
    return false
  })

  // Toggle Background Blur (Acrylic on Windows, Vibrancy on macOS)
  ipcMain.handle('set-window-blur', (_event, enabled: boolean) => {
    if (mainWindow) {
      try {
        if (process.platform === 'win32') {
          mainWindow.setBackgroundMaterial(enabled ? 'acrylic' : 'none')
        } else if (process.platform === 'darwin') {
          mainWindow.setVibrancy(enabled ? 'under-window' : null)
        }
        return true
      } catch (err) {
        console.error('Failed to set window background material:', err)
        return false
      }
    }
    return false
  })

  // Screen Capture and OCR analysis
  ipcMain.handle('capture-screen-ocr', async () => {
    try {
      // Find the screen source
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 } // High resolution to capture small text/code
      })

      if (sources.length === 0) {
        return { success: false, error: 'No screen capture source found.' }
      }

      // Convert primary screen thumbnail to PNG Buffer
      const pngBuffer = sources[0].thumbnail.toPNG()
      
      // Perform local OCR on the buffer
      const text = await runOCR(pngBuffer)
      
      return {
        success: true,
        text: text.trim()
      }
    } catch (err) {
      console.error('Capture and OCR process failed:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  })

  createWindow()
  registerGlobalShortcuts()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      registerGlobalShortcuts()
    }
  })
})

// Unregister shortcuts and quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
