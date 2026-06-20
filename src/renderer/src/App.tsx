import React, { useState, useEffect } from 'react'
import { OverlayWidget } from './components/OverlayWidget'
import { ChatPanel } from './components/ChatPanel'
import { VoiceInput } from './components/VoiceInput'
import { ScreenAwareness } from './components/ScreenAwareness'
import { SettingsPanel } from './components/SettingsPanel'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function App(): React.JSX.Element {
  // Navigation & Window layout states
  const [mode, setMode] = useState<'chat' | 'voice' | 'screen' | 'settings'>('chat')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Visual Customization States
  const [opacity, setOpacity] = useState(0.9)
  const [fontSize, setFontSize] = useState(13)
  const [theme, setTheme] = useState<'light' | 'dark' | 'amoled'>('dark')
  const [screenProtection, setScreenProtection] = useState(true)

  // Speech Transcription States
  const [transcriptionMode, setTranscriptionMode] = useState<'local' | 'api'>('local')
  const [whisperProvider, setWhisperProvider] = useState<'groq' | 'openai'>('groq')

  // API Credentials States
  const [openaiKey, setOpenaiKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [claudeKey, setClaudeKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [grokKey, setGrokKey] = useState('')

  // Selected Active Models States
  const [activeProvider, setActiveProvider] = useState<'openai' | 'gemini' | 'claude' | 'groq' | 'grok'>('gemini')
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini')
  const [geminiModel, setGeminiModel] = useState('gemini-flash-latest')
  const [claudeModel, setClaudeModel] = useState('claude-3-5-sonnet-20241022')
  const [groqModel, setGroqModel] = useState('llama3-70b-8192')
  const [grokModel, setGrokModel] = useState('grok-2-1212')

  // Conversational History State
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Load Settings from LocalStorage on mount
  useEffect(() => {
    // API Keys (with fallback to environment variables in dev/local setups)
    setOpenaiKey(localStorage.getItem('adr_openai_key') || (import.meta.env.VITE_OPENAI_API_KEY as string) || '')
    setGeminiKey(localStorage.getItem('adr_gemini_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || '')
    setClaudeKey(localStorage.getItem('adr_claude_key') || (import.meta.env.VITE_CLAUDE_API_KEY as string) || '')
    setGroqKey(localStorage.getItem('adr_groq_key') || (import.meta.env.VITE_GROQ_API_KEY as string) || '')
    setGrokKey(localStorage.getItem('adr_grok_key') || (import.meta.env.VITE_GROK_API_KEY as string) || '')

    // Active configuration
    setActiveProvider((localStorage.getItem('adr_active_provider') as any) || 'gemini')
    setOpenaiModel(localStorage.getItem('adr_openai_model') || 'gpt-4o-mini')
    setGeminiModel(localStorage.getItem('adr_gemini_model') || 'gemini-flash-latest')
    setClaudeModel(localStorage.getItem('adr_claude_model') || 'claude-3-5-sonnet-20241022')
    setGroqModel(localStorage.getItem('adr_groq_model') || 'llama3-70b-8192')
    setGrokModel(localStorage.getItem('adr_grok_model') || 'grok-2-1212')

    // Visual configurations
    const savedOpacity = localStorage.getItem('adr_opacity')
    if (savedOpacity) setOpacity(parseFloat(savedOpacity))

    const savedFontSize = localStorage.getItem('adr_font_size')
    if (savedFontSize) setFontSize(parseInt(savedFontSize))

    const savedTheme = localStorage.getItem('adr_theme')
    if (savedTheme) setTheme(savedTheme as any)

    const savedProtection = localStorage.getItem('adr_screen_protection')
    if (savedProtection) {
      const enabled = savedProtection === 'true'
      setScreenProtection(enabled)
      window.api.setScreenProtection(enabled)
    } else {
      window.api.setScreenProtection(true) // default to true
    }

    // Transcription configurations
    const savedSpeechMode = localStorage.getItem('adr_transcription_mode')
    if (savedSpeechMode) setTranscriptionMode(savedSpeechMode as any)

    const savedWhisperProv = localStorage.getItem('adr_whisper_provider')
    if (savedWhisperProv) setWhisperProvider(savedWhisperProv as any)
  }, [])

  // Sync screen protection whenever changed
  useEffect(() => {
    window.api.setScreenProtection(screenProtection)
    localStorage.setItem('adr_screen_protection', String(screenProtection))
  }, [screenProtection])

  /**
   * Saves the customized UI settings and API keys to LocalStorage
   * and closes the settings page to return to the active assistant chat panel.
   */
  const handleSaveSettings = () => {
    localStorage.setItem('adr_openai_key', openaiKey)
    localStorage.setItem('adr_gemini_key', geminiKey)
    localStorage.setItem('adr_claude_key', claudeKey)
    localStorage.setItem('adr_groq_key', groqKey)
    localStorage.setItem('adr_grok_key', grokKey)

    localStorage.setItem('adr_active_provider', activeProvider)
    localStorage.setItem('adr_openai_model', openaiModel)
    localStorage.setItem('adr_gemini_model', geminiModel)
    localStorage.setItem('adr_claude_model', claudeModel)
    localStorage.setItem('adr_groq_model', groqModel)
    localStorage.setItem('adr_grok_model', grokModel)

    localStorage.setItem('adr_opacity', String(opacity))
    localStorage.setItem('adr_font_size', String(fontSize))
    localStorage.setItem('adr_theme', theme)
    localStorage.setItem('adr_transcription_mode', transcriptionMode)
    localStorage.setItem('adr_whisper_provider', whisperProvider)

    alert('Settings saved successfully!')
    setMode('chat')
  }

  /**
   * Retrieves the current API key and model identifier according to
   * the currently selected active AI Provider.
   * @returns {{ key: string, model: string }} active credentials object
   */
  const getActiveConfig = () => {
    let key = ''
    let model = ''

    switch (activeProvider) {
      case 'openai':
        key = openaiKey
        model = openaiModel
        break
      case 'gemini':
        key = geminiKey
        model = geminiModel
        break
      case 'claude':
        key = claudeKey
        model = claudeModel
        break
      case 'groq':
        key = groqKey
        model = groqModel
        break
      case 'grok':
        key = grokKey
        model = grokModel
        break
    }

    return { key, model }
  }

  /**
   * Submits the user prompt to the active AI Provider by triggering
   * an Electron IPC completion call, updates messages thread, and manages loading states.
   * @param {string} promptText user query or OCR code snippet
   */
  const handleSendPrompt = async (promptText: string) => {
    const { key, model } = getActiveConfig()
    
    if (!key) {
      alert(`API Key for ${activeProvider.toUpperCase()} is missing. Please configure it in settings.`)
      setMode('settings')
      return
    }

    const newUserMessage: Message = { role: 'user', content: promptText }
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setIsGenerating(true)

    try {
      const response = await window.api.callAI({
        provider: activeProvider,
        apiKey: key,
        model,
        messages: updatedMessages
      })

      if (response.success && response.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text! }])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${response.error || 'Failed to generate response.'}` }
        ])
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Network Error: ${err.message}` }
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  // Clear Chat Log
  const handleClearHistory = () => {
    setMessages([])
  }

  // Retrieve API Key for Whisper Speech Transcription
  const getWhisperKey = () => {
    return whisperProvider === 'groq' ? groqKey : openaiKey
  }

  return (
    <OverlayWidget
      mode={mode}
      setMode={setMode}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      theme={theme}
      opacity={opacity}
      onClearHistory={handleClearHistory}
    >
      {mode === 'chat' && (
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendPrompt}
          activeProvider={activeProvider}
          activeModel={getActiveConfig().model}
          isGenerating={isGenerating}
          fontSize={fontSize}
        />
      )}

      {mode === 'voice' && (
        <VoiceInput
          onTranscriptReceived={(text) => {
            // Append transcribed text directly into the assistant chat prompt flow
            handleSendPrompt(text)
          }}
          fontSize={fontSize}
          whisperProvider={whisperProvider}
          apiKey={getWhisperKey()}
          transcriptionMode={transcriptionMode}
        />
      )}

      {mode === 'screen' && (
        <ScreenAwareness
          onSendToAI={(finalPrompt) => {
            setMode('chat')
            handleSendPrompt(finalPrompt)
          }}
          isGenerating={isGenerating}
          fontSize={fontSize}
        />
      )}

      {mode === 'settings' && (
        <SettingsPanel
          opacity={opacity}
          setOpacity={setOpacity}
          fontSize={fontSize}
          setFontSize={setFontSize}
          theme={theme}
          setTheme={setTheme}
          screenProtection={screenProtection}
          setScreenProtection={setScreenProtection}
          transcriptionMode={transcriptionMode}
          setTranscriptionMode={setTranscriptionMode}
          whisperProvider={whisperProvider}
          setWhisperProvider={setWhisperProvider}
          openaiKey={openaiKey}
          setOpenaiKey={setOpenaiKey}
          geminiKey={geminiKey}
          setGeminiKey={setGeminiKey}
          claudeKey={claudeKey}
          setClaudeKey={setClaudeKey}
          groqKey={groqKey}
          setGroqKey={setGroqKey}
          grokKey={grokKey}
          setGrokKey={setGrokKey}
          activeProvider={activeProvider}
          setActiveProvider={setActiveProvider}
          openaiModel={openaiModel}
          setOpenaiModel={setOpenaiModel}
          geminiModel={geminiModel}
          setGeminiModel={setGeminiModel}
          claudeModel={claudeModel}
          setClaudeModel={setClaudeModel}
          groqModel={groqModel}
          setGroqModel={setGroqModel}
          grokModel={grokModel}
          setGrokModel={setGrokModel}
          onSave={handleSaveSettings}
        />
      )}
    </OverlayWidget>
  )
}

export default App
