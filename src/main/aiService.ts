import { ipcMain } from 'electron'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIRequest {
  provider: 'openai' | 'gemini' | 'claude' | 'groq' | 'grok'
  apiKey: string
  model: string
  messages: Message[]
}

interface TranscribeRequest {
  provider: 'openai' | 'groq'
  apiKey: string
  audioBuffer: Buffer
  fileName: string
}

/**
 * Routing logic for executing text completion requests to configured AI providers.
 * Supports OpenAI, Google Gemini, Anthropic Claude, Groq Llama, and xAI Grok.
 * Runs in the Node main process, bypassing Chromium CORS restrictions.
 * 
 * @param {AIRequest} req request details containing provider name, api keys, and model
 * @returns {Promise<string>} text response from the AI model
 */
async function handleAICompletion(req: AIRequest): Promise<string> {
  const { provider, apiKey, model, messages } = req

  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'No response.'
    } 
    
    if (provider === 'grok') {
      // x.ai uses OpenAI compatible endpoint
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'grok-2-1212',
          messages: messages,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'No response.'
    }

    if (provider === 'groq') {
      // Groq uses OpenAI compatible endpoint
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'llama3-70b-8192',
          messages: messages,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'No response.'
    }

    if (provider === 'gemini') {
      // Gemini REST API
      const geminiModel = model || 'gemini-1.5-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

      // Format messages into Gemini format
      const contents = messages.map(m => {
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
    }

    if (provider === 'claude') {
      // Anthropic Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: messages.filter(m => m.role !== 'system'),
          system: messages.find(m => m.role === 'system')?.content
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data.content?.[0]?.text || 'No response.'
    }

    throw new Error(`Unsupported AI provider: ${provider}`)
  } catch (err) {
    console.error(`AI API call failed (${provider}):`, err)
    throw err
  }
}

/**
 * Receives WebM audio buffers from the renderer, builds a secure native FormData upload,
 * and executes Whisper transcriptions through OpenAI or Groq API endpoints.
 * 
 * @param {TranscribeRequest} req transcription settings and audio file buffer
 * @returns {Promise<string>} transcribed text transcript
 */
async function handleAudioTranscription(req: TranscribeRequest): Promise<string> {
  const { provider, apiKey, audioBuffer, fileName } = req

  try {
    const url = provider === 'groq' 
      ? 'https://api.groq.com/openai/v1/audio/transcriptions'
      : 'https://api.openai.com/v1/audio/transcriptions'

    // Create a native File-like object from Buffer
    const file = new File([new Uint8Array(audioBuffer)], fileName, { type: 'audio/webm' })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', provider === 'groq' ? 'whisper-large-v3' : 'whisper-1')
    formData.append('response_format', 'json')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`HTTP error ${response.status}: ${errText}`)
    }

    const data = await response.json()
    return data.text || ''
  } catch (err) {
    console.error(`Audio transcription failed (${provider}):`, err)
    throw err
  }
}

/**
 * Registers Electron main process IPC handlers to listen for completion
 * and transcription calls coming from the isolated renderer frontend.
 */
export function initAIServices(): void {
  // Listen for AI completion requests
  ipcMain.handle('call-ai-api', async (_event, req: AIRequest) => {
    try {
      const text = await handleAICompletion(req)
      return { success: true, text }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // Listen for audio transcription requests
  ipcMain.handle('transcribe-audio', async (_event, req: { provider: 'openai' | 'groq', apiKey: string, audioArrayBuffer: ArrayBuffer, fileName: string }) => {
    try {
      const audioBuffer = Buffer.from(req.audioArrayBuffer)
      const text = await handleAudioTranscription({
        provider: req.provider,
        apiKey: req.apiKey,
        audioBuffer,
        fileName: req.fileName
      })
      return { success: true, text }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
