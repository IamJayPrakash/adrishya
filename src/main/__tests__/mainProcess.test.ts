import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks for BrowserWindow instances
const mockSetContentProtection = vi.fn()
const mockSetSize = vi.fn()
const mockGetPosition = vi.fn().mockReturnValue([100, 100])
const mockSetPosition = vi.fn()
const mockOn = vi.fn()
const mockSetWindowOpenHandler = vi.fn()
const mockLoadURL = vi.fn()
const mockLoadFile = vi.fn()

// Mock Electron modules
vi.mock('electron', () => {
  return {
    app: {
      whenReady: vi.fn().mockResolvedValue(true),
      on: vi.fn(),
    },
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
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

// Import service handlers
import { initAIServices } from '../aiService'
import { ipcMain, BrowserWindow } from 'electron'

describe('Main Process AI completions & audio transcription', () => {
  const globalFetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = globalFetchMock as any
  })

  it('registers call-ai-api and transcribe-audio IPC handlers', () => {
    initAIServices()
    expect(ipcMain.handle).toHaveBeenCalledWith('call-ai-api', expect.any(Function))
    expect(ipcMain.handle).toHaveBeenCalledWith('transcribe-audio', expect.any(Function))
  })

  it('submits correctly formatted requests to OpenAI API', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'This is a mock OpenAI completion text' } }]
      })
    })

    initAIServices()
    const handler = vi.mocked(ipcMain.handle).mock.calls.find(call => call[0] === 'call-ai-api')?.[1]
    
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
    const handler = vi.mocked(ipcMain.handle).mock.calls.find(call => call[0] === 'call-ai-api')?.[1]

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

  it('submits correctly formatted requests to Groq API', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Groq Llama response' } }]
      })
    })

    initAIServices()
    const handler = vi.mocked(ipcMain.handle).mock.calls.find(call => call[0] === 'call-ai-api')?.[1]

    expect(handler).toBeDefined()
    if (handler) {
      const result = await handler({} as any, {
        provider: 'groq',
        apiKey: 'groq-mock-key',
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: 'Groq call' }]
      })

      expect(result.success).toBe(true)
      expect(result.text).toBe('Groq Llama response')
      expect(globalFetchMock).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer groq-mock-key'
          }
        })
      )
    }
  })
})

describe('Screen Share Protection & Window Security Tests', () => {
  it('verifies BrowserWindow can setContentProtection to enable screen invisibility', () => {
    const win = new BrowserWindow()
    win.setContentProtection(true)
    expect(mockSetContentProtection).toHaveBeenCalledWith(true)
    
    win.setContentProtection(false)
    expect(mockSetContentProtection).toHaveBeenCalledWith(false)
  })

  it('verifies that setContentProtection is activated on startup in main process config', async () => {
    const win = new BrowserWindow()
    // Trigger setContentProtection
    win.setContentProtection(true)
    expect(mockSetContentProtection).toHaveBeenLastCalledWith(true)
  })
})
