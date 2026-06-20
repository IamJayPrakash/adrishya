import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Electron imports
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
    BrowserWindow: vi.fn()
  }
})

// Import functions to test (we mock fetch globally first)
import { initAIServices } from '../aiService'
import { ipcMain } from 'electron'

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
    // Mock successful OpenAI completion response
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'This is a mock OpenAI completion text' } }]
      })
    })

    // Retrieve the registered call-ai-api handler function
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
    // Mock successful Gemini response
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
    // Mock successful Groq response
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
