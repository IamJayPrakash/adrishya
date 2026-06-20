import React from 'react'
import { Save, Shield, Key, Eye, EyeOff, Sliders } from 'lucide-react'

interface SettingsPanelProps {
  opacity: number
  setOpacity: (val: number) => void
  blur: number
  setBlur: (val: number) => void
  fontSize: number
  setFontSize: (val: number) => void
  theme: 'light' | 'dark' | 'amoled'
  setTheme: (val: 'light' | 'dark' | 'amoled') => void
  showModelIndicator: boolean
  setShowModelIndicator: (val: boolean) => void
  screenProtection: boolean
  setScreenProtection: (val: boolean) => void
  transcriptionMode: 'local' | 'api'
  setTranscriptionMode: (val: 'local' | 'api') => void
  whisperProvider: 'groq' | 'openai'
  setWhisperProvider: (val: 'groq' | 'openai') => void
  
  // API Keys
  openaiKey: string
  setOpenaiKey: (val: string) => void
  geminiKey: string
  setGeminiKey: (val: string) => void
  claudeKey: string
  setClaudeKey: (val: string) => void
  groqKey: string
  setGroqKey: (val: string) => void
  grokKey: string
  setGrokKey: (val: string) => void

  // Models
  activeProvider: 'openai' | 'gemini' | 'claude' | 'groq' | 'grok'
  setActiveProvider: (val: 'openai' | 'gemini' | 'claude' | 'groq' | 'grok') => void
  openaiModel: string
  setOpenaiModel: (val: string) => void
  geminiModel: string
  setGeminiModel: (val: string) => void
  claudeModel: string
  setClaudeModel: (val: string) => void
  groqModel: string
  setGroqModel: (val: string) => void
  grokModel: string
  setGrokModel: (val: string) => void

  onSave: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  opacity,
  setOpacity,
  blur,
  setBlur,
  fontSize,
  setFontSize,
  theme,
  setTheme,
  showModelIndicator,
  setShowModelIndicator,
  screenProtection,
  setScreenProtection,
  transcriptionMode,
  setTranscriptionMode,
  whisperProvider,
  setWhisperProvider,
  openaiKey,
  setOpenaiKey,
  geminiKey,
  setGeminiKey,
  claudeKey,
  setClaudeKey,
  groqKey,
  setGroqKey,
  grokKey,
  setGrokKey,
  activeProvider,
  setActiveProvider,
  openaiModel,
  setOpenaiModel,
  geminiModel,
  setGeminiModel,
  claudeModel,
  setClaudeModel,
  groqModel,
  setGroqModel,
  grokModel,
  setGrokModel,
  onSave
}) => {
  const [showKeys, setShowKeys] = React.useState(false)

  return (
    <div className="flex flex-col h-full flex-grow overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
      {/* Visual Settings */}
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3.5">
        <h3 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 select-none">
          <Sliders size={13} />
          Visual Customize
        </h3>
        
        {/* Opacity Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400 select-none">
            <span>Window Opacity</span>
            <span>{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Background Blur Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400 select-none">
            <span>Background Blur</span>
            <span>{blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={blur}
            onChange={(e) => setBlur(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Font Size Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400 select-none">
            <span>Font Size</span>
            <span>{fontSize}px</span>
          </div>
          <input
            type="range"
            min="11"
            max="18"
            step="1"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Theme select */}
        <div className="flex items-center justify-between pt-1 select-none">
          <span className="text-[10px] text-gray-400">UI Theme</span>
          <div className="flex gap-1 bg-black/30 p-0.5 rounded-lg border border-white/5">
            {(['light', 'dark', 'amoled'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`text-[9px] font-semibold px-2 py-1 rounded transition-all capitalize ${
                  theme === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Show Active Model Indicator toggle */}
        <div className="flex items-center justify-between pt-1 select-none">
          <div className="flex flex-col gap-0.5 pr-2">
            <span className="text-[10px] text-gray-300 font-medium">Show Active Model Indicator</span>
            <span className="text-[8px] text-gray-500 leading-tight">Show the AI provider/model name bar at the top of chat</span>
          </div>
          <button
            onClick={() => setShowModelIndicator(!showModelIndicator)}
            className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
              showModelIndicator ? 'bg-indigo-600' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                showModelIndicator ? 'transform translate-x-3' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Security settings */}
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 select-none">
        <h3 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
          <Shield size={13} />
          Privacy & Security
        </h3>
        
        {/* Anti-Screen Share protection */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5 pr-2">
            <span className="text-[10px] text-gray-300 font-medium">Invisibility (Content Protection)</span>
            <span className="text-[8px] text-gray-500 leading-tight">Hides overlay app contents from screen sharing (OBS, Zoom, Discord, etc.)</span>
          </div>
          <button
            onClick={() => setScreenProtection(!screenProtection)}
            className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
              screenProtection ? 'bg-indigo-600' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                screenProtection ? 'transform translate-x-3' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Voice Transcription Mode Settings */}
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 select-none">
        <h3 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
          <Key size={13} />
          Speech Transcription Settings
        </h3>

        {/* Electron-specific warning — Web Speech API requires Chrome's private Google key */}
        {navigator.userAgent.toLowerCase().includes('electron') && (
          <div className="flex items-start gap-1.5 bg-yellow-600/10 border border-yellow-500/20 rounded-lg px-2.5 py-2">
            <span className="text-yellow-400 text-[10px] shrink-0 mt-0.5">⚠️</span>
            <span className="text-[9px] text-yellow-300 leading-relaxed">
              <strong>Desktop App:</strong> "Local Engine" won't work here — Electron doesn't include Google's speech key.
              Please use <strong>Whisper API</strong> instead.
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Transcription Mode</span>
          <div className="flex gap-1 bg-black/30 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setTranscriptionMode('local')}
              className={`text-[9px] font-semibold px-2.5 py-1 rounded transition-all ${
                transcriptionMode === 'local' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Local Engine
              {navigator.userAgent.toLowerCase().includes('electron') && (
                <span className="ml-1 text-[7px] text-yellow-400 font-bold">✗</span>
              )}
            </button>
            <button
              onClick={() => setTranscriptionMode('api')}
              className={`text-[9px] font-semibold px-2.5 py-1 rounded transition-all ${
                transcriptionMode === 'api' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Whisper API
              {navigator.userAgent.toLowerCase().includes('electron') && (
                <span className="ml-1 text-[7px] text-green-400 font-bold">✓</span>
              )}
            </button>
          </div>
        </div>

        {transcriptionMode === 'api' && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-gray-400">Whisper Provider</span>
            <div className="flex gap-1 bg-black/30 p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setWhisperProvider('groq')}
                className={`text-[9px] font-semibold px-2.5 py-1 rounded transition-all ${
                  whisperProvider === 'groq' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Groq (Free/Fast)
              </button>
              <button
                onClick={() => setWhisperProvider('openai')}
                className={`text-[9px] font-semibold px-2.5 py-1 rounded transition-all ${
                  whisperProvider === 'openai' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                OpenAI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Credentials & Model Selection */}
      <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-3.5">
        <div className="flex justify-between items-center select-none">
          <h3 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
            <Key size={13} />
            AI Providers Configuration
          </h3>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showKeys ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>

        {/* Global Active Provider Selector */}
        <div className="flex flex-col gap-1 select-none">
          <span className="text-[9px] text-gray-400 uppercase font-mono">Active Provider:</span>
          <select
            value={activeProvider}
            onChange={(e) => setActiveProvider(e.target.value as any)}
            className="bg-black/40 text-xs text-white border border-white/10 rounded-xl px-2 py-1.5 w-full focus:outline-none focus:border-indigo-500"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI GPT</option>
            <option value="claude">Anthropic Claude</option>
            <option value="groq">Groq (Llama-3)</option>
            <option value="grok">xAI Grok</option>
          </select>
        </div>

        {/* Google Gemini */}
        <div className="space-y-2 border-t border-white/5 pt-3">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] text-gray-200 font-semibold">Google Gemini</span>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="bg-black/40 text-[9px] text-gray-300 border border-white/5 rounded px-1.5 py-0.5 max-w-[150px] focus:outline-none"
            >
              <option value="gemini-flash-latest">gemini-flash-latest</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
            </select>
          </div>
          <input
            type={showKeys ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Gemini API Key..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* OpenAI GPT */}
        <div className="space-y-2 border-t border-white/5 pt-3">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] text-gray-200 font-semibold">OpenAI GPT</span>
            <select
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value)}
              className="bg-black/40 text-[9px] text-gray-300 border border-white/5 rounded px-1.5 py-0.5 max-w-[150px] focus:outline-none"
            >
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>
          </div>
          <input
            type={showKeys ? 'text' : 'password'}
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="OpenAI API Key..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Anthropic Claude */}
        <div className="space-y-2 border-t border-white/5 pt-3">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] text-gray-200 font-semibold">Anthropic Claude</span>
            <select
              value={claudeModel}
              onChange={(e) => setClaudeModel(e.target.value)}
              className="bg-black/40 text-[9px] text-gray-300 border border-white/5 rounded px-1.5 py-0.5 max-w-[150px] focus:outline-none"
            >
              <option value="claude-3-5-sonnet-20241022">claude-3.5-sonnet</option>
              <option value="claude-3-5-haiku-20241022">claude-3.5-haiku</option>
              <option value="claude-3-opus-20240229">claude-3-opus</option>
            </select>
          </div>
          <input
            type={showKeys ? 'text' : 'password'}
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            placeholder="Claude API Key..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Groq (Llama-3) */}
        <div className="space-y-2 border-t border-white/5 pt-3">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] text-gray-200 font-semibold">Groq (Llama-3)</span>
            <select
              value={groqModel}
              onChange={(e) => setGroqModel(e.target.value)}
              className="bg-black/40 text-[9px] text-gray-300 border border-white/5 rounded px-1.5 py-0.5 max-w-[150px] focus:outline-none"
            >
              <option value="llama3-70b-8192">llama3-70b</option>
              <option value="llama3-8b-8192">llama3-8b</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b</option>
            </select>
          </div>
          <input
            type={showKeys ? 'text' : 'password'}
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder="Groq API Key..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* xAI Grok */}
        <div className="space-y-2 border-t border-white/5 pt-3">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] text-gray-200 font-semibold">xAI Grok</span>
            <select
              value={grokModel}
              onChange={(e) => setGrokModel(e.target.value)}
              className="bg-black/40 text-[9px] text-gray-300 border border-white/5 rounded px-1.5 py-0.5 max-w-[150px] focus:outline-none"
            >
              <option value="grok-2-1212">grok-2-1212</option>
              <option value="grok-beta">grok-beta</option>
            </select>
          </div>
          <input
            type={showKeys ? 'text' : 'password'}
            value={grokKey}
            onChange={(e) => setGrokKey(e.target.value)}
            placeholder="Grok API Key..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 select-none"
      >
        <Save size={13} />
        Save Settings
      </button>
    </div>
  )
}
