import { contextBridge, ipcRenderer } from 'electron'

// Define the API exposed to the React renderer
const customAPI = {
  // Resize the window (e.g. collapse/expand)
  resizeWindow: (width: number, height: number): void => {
    ipcRenderer.send('resize-window', width, height)
  },

  // Drag utility if manual header drag is used
  moveWindow: (deltaX: number, deltaY: number): void => {
    ipcRenderer.send('window-move', deltaX, deltaY)
  },

  // Toggle overlay screen protection (invisibility in sharing)
  setScreenProtection: async (enabled: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('set-screen-protection', enabled)
  },

  // Capture screen and extract text using OCR
  captureScreenOCR: async (): Promise<{ success: boolean; text?: string; error?: string }> => {
    return ipcRenderer.invoke('capture-screen-ocr')
  },

  // Listener for global voice hotkey Ctrl+Shift+V
  onGlobalShortcutVoice: (callback: () => void): () => void => {
    const listener = (): void => callback()
    ipcRenderer.on('global-shortcut-voice', listener)
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('global-shortcut-voice', listener)
    }
  }
}

// Expose APIs securely if context isolation is active
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', customAPI)
  } catch (error) {
    console.error('Error exposing contextBridge API:', error)
  }
} else {
  // Fallback for non-isolated environments
  // @ts-ignore (define in dts)
  window.api = customAPI
}
