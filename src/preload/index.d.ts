declare global {
  interface Window {
    api: {
      resizeWindow: (width: number, height: number) => void
      moveWindow: (deltaX: number, deltaY: number) => void
      setScreenProtection: (enabled: boolean) => Promise<boolean>
      setWindowBlur: (enabled: boolean) => Promise<boolean>
      captureScreenOCR: () => Promise<{ success: boolean; text?: string; error?: string }>
      onGlobalShortcutVoice: (callback: () => void) => () => void
      callAI: (req: { provider: string; apiKey: string; model: string; messages: any[] }) => Promise<{ success: boolean; text?: string; error?: string }>
      transcribeAudio: (req: { provider: 'openai' | 'groq'; apiKey: string; audioArrayBuffer: ArrayBuffer; fileName: string }) => Promise<{ success: boolean; text?: string; error?: string }>
      quitApp: () => void
    }
  }
}

export {}
