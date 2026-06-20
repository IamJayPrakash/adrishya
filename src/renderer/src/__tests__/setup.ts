import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Electron window.api globally in tests
global.window.api = {
  resizeWindow: vi.fn(),
  moveWindow: vi.fn(),
  setScreenProtection: vi.fn().mockResolvedValue(true),
  captureScreenOCR: vi.fn().mockResolvedValue({ success: true, text: 'Hello World OCR' }),
  onGlobalShortcutVoice: vi.fn().mockReturnValue(() => {}),
  callAI: vi.fn().mockResolvedValue({ success: true, text: 'AI suggestions text response' }),
  transcribeAudio: vi.fn().mockResolvedValue({ success: true, text: 'Voice transcription response' })
}

// Mock scrollIntoView which JSDOM does not support by default
window.HTMLElement.prototype.scrollIntoView = vi.fn()
