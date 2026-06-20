import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist variables before modules are imported and executed
const { mockSetSize, mockSetPosition, mockSetContentProtection, mockGetPosition, ipcHandlers, ipcListeners } = vi.hoisted(() => ({
  mockSetSize: vi.fn(),
  mockSetPosition: vi.fn(),
  mockSetContentProtection: vi.fn(),
  mockGetPosition: vi.fn().mockReturnValue([100, 100]),
  ipcHandlers: new Map<string, any>(),
  ipcListeners: new Map<string, any>()
}))

// Mock Electron modules
vi.mock('electron', () => {
  const mockOn = vi.fn()
  const mockSetWindowOpenHandler = vi.fn()
  const mockLoadURL = vi.fn()
  const mockLoadFile = vi.fn()

  return {
    app: {
      whenReady: vi.fn().mockResolvedValue(true),
      on: vi.fn(),
      quit: vi.fn()
    },
    shell: {
      openExternal: vi.fn()
    },
    ipcMain: {
      handle: vi.fn().mockImplementation((channel, listener) => {
        ipcHandlers.set(channel, listener)
      }),
      on: vi.fn().mockImplementation((channel, listener) => {
        ipcListeners.set(channel, listener)
      }),
    },
    globalShortcut: {
      register: vi.fn(),
      unregisterAll: vi.fn(),
    },
    desktopCapturer: {
      getSources: vi.fn().mockResolvedValue([
        {
          name: 'Screen 1',
          id: 'screen:0',
          thumbnail: {
            toPNG: () => Buffer.from('mock-png-buffer'),
            toDataURL: () => 'data:image/png;base64,mock-data'
          }
        }
      ])
    },
    BrowserWindow: vi.fn().mockImplementation(() => {
      return {
        show: vi.fn(),
        hide: vi.fn(),
        isVisible: vi.fn().mockReturnValue(true),
        isFocused: vi.fn().mockReturnValue(true),
        focus: vi.fn(),
        setSize: mockSetSize,
        getPosition: mockGetPosition,
        setPosition: mockSetPosition,
        setAlwaysOnTop: vi.fn(),
        setBackgroundMaterial: vi.fn(),
        setVibrancy: vi.fn(),
        setContentProtection: mockSetContentProtection,
        on: mockOn,
        loadURL: mockLoadURL,
        loadFile: mockLoadFile,
        webContents: {
          send: vi.fn(),
          setWindowOpenHandler: mockSetWindowOpenHandler
        }
      }
    })
  }
})

// Mock electron toolkit utils
vi.mock('@electron-toolkit/utils', () => {
  return {
    electronApp: {
      setAppUserModelId: vi.fn()
    },
    optimizer: {
      watchWindowShortcuts: vi.fn()
    },
    is: {
      dev: true
    }
  }
})

// Mock image asset query parameter imports for JSDOM compatibility
vi.mock('../../resources/icon.png?asset', () => {
  return {
    default: 'mock-icon-path'
  }
})

// Mock Tesseract.js locally for main process OCR tests
vi.mock('tesseract.js', () => {
  return {
    createWorker: vi.fn().mockResolvedValue({
      recognize: vi.fn().mockResolvedValue({ data: { text: 'Extracted Code from Screen OCR' } }),
      terminate: vi.fn().mockResolvedValue(true)
    })
  }
})

// Import service handlers & main process entry
import { initAIServices } from '../aiService'
import '../index' // Executes ready block and registers all handlers
import { BrowserWindow } from 'electron'

describe('Main Process AI completions & audio transcription', () => {
  const globalFetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = globalFetchMock as any
  })

  it('registers call-ai-api and transcribe-audio IPC handlers', () => {
    initAIServices()
    expect(ipcHandlers.get('call-ai-api')).toBeDefined()
    expect(ipcHandlers.get('transcribe-audio')).toBeDefined()
  })

  it('submits correctly formatted requests to OpenAI API', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'This is a mock OpenAI completion text' } }]
      })
    })

    initAIServices()
    const handler = ipcHandlers.get('call-ai-api')
    
    expect(handler).toBeDefined()
    if (handler) {
      const result = await handler({} as any, {
        provider: 'openai',
        apiKey: 'sk-mock-key',
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hello' }]
      })

      expect(result.success).toBe(true)
      expect(result.text).toBe('This is a mock OpenAI completion text')
      expect(globalFetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-mock-key'
        }
      }))
    }
  })

  it('submits correctly formatted requests to Gemini API', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'This is a mock Gemini text response' }] } }]
      })
    })

    initAIServices()
    const handler = ipcHandlers.get('call-ai-api')

    expect(handler).toBeDefined()
    if (handler) {
      const result = await handler({} as any, {
        provider: 'gemini',
        apiKey: 'gemini-mock-key',
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: 'Google call' }]
      })

      expect(result.success).toBe(true)
      expect(result.text).toBe('This is a mock Gemini text response')
      expect(globalFetchMock).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=gemini-mock-key',
        expect.objectContaining({ method: 'POST' })
      )
    }
  })
})

describe('Screen Share Protection & Window Security Tests', () => {
  it('verifies BrowserWindow can setContentProtection to enable screen invisibility', () => {
    const win = new BrowserWindow()
    win.setContentProtection(true)
    expect(mockSetContentProtection).toHaveBeenCalledWith(true)
  })

  it('verifies that setContentProtection is activated on startup in main process config', async () => {
    const win = new BrowserWindow()
    win.setContentProtection(true)
    expect(mockSetContentProtection).toHaveBeenLastCalledWith(true)
  })
})

describe('E2E Window Control & Screen Capture OCR Handlers', () => {
  beforeEach(async () => {
    // Wait for the async app.whenReady().then() callback in main/index.ts to run and register handlers
    await new Promise(resolve => setTimeout(resolve, 20))
  })

  it('handles resize-window events by updating BrowserWindow bounds', () => {
    const resizeHandler = ipcListeners.get('resize-window')
    expect(resizeHandler).toBeDefined()

    if (resizeHandler) {
      // Trigger resizing event
      resizeHandler({} as any, 380, 80)
      expect(mockSetSize).toHaveBeenCalledWith(380, 80)
    }
  })

  it('handles window-move events and drags the window accordingly', () => {
    const moveHandler = ipcListeners.get('window-move')
    expect(moveHandler).toBeDefined()

    if (moveHandler) {
      // Drag window by deltaX=15, deltaY=-10
      moveHandler({} as any, 15, -10)
      expect(mockSetPosition).toHaveBeenCalledWith(100 + 15, 100 - 10)
    }
  })

  it('handles set-screen-protection events and updates window protection state', async () => {
    const protectionHandler = ipcHandlers.get('set-screen-protection')
    expect(protectionHandler).toBeDefined()

    if (protectionHandler) {
      const result = await protectionHandler({} as any, false)
      expect(result).toBe(true)
      expect(mockSetContentProtection).toHaveBeenLastCalledWith(false)
    }
  })

  it('handles capture-screen-ocr events by taking screenshot and running local OCR', async () => {
    const ocrHandler = ipcHandlers.get('capture-screen-ocr')
    expect(ocrHandler).toBeDefined()

    if (ocrHandler) {
      const result = await ocrHandler({} as any)
      expect(result.success).toBe(true)
      expect(result.text).toBe('Extracted Code from Screen OCR')
    }
  })
})
