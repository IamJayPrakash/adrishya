declare global {
  interface Window {
    api: {
      resizeWindow: (width: number, height: number) => void
      moveWindow: (deltaX: number, deltaY: number) => void
      setScreenProtection: (enabled: boolean) => Promise<boolean>
      captureScreenOCR: () => Promise<{ success: boolean; text?: string; error?: string }>
      onGlobalShortcutVoice: (callback: () => void) => () => void
    }
  }
}

export {}
