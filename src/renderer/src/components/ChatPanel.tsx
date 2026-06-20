import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Copy, Check, Mic, MicOff, Camera, AlertCircle, FileText, X } from 'lucide-react'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (text: string) => void
  activeProvider: string
  activeModel: string
  isGenerating: boolean
  fontSize: number
  opacity: number
  transcriptionMode: 'local' | 'api'
  whisperProvider: 'groq' | 'openai'
  whisperApiKey: string
}

// Custom simple markdown formatter with copy-to-clipboard code blocks
const FormattedMessage: React.FC<{ content: string; fontSize: number }> = ({ content, fontSize }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 select-text" style={{ fontSize: `${fontSize}px` }}>
      {parts.map((part, partIdx) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const match = part.match(/```(\w*)\n([\s\S]*?)```/)
          const lang = match ? match[1] : ''
          const code = match ? match[2].trim() : part.slice(3, -3).trim()

          return (
            <div key={partIdx} className="relative group my-2 rounded-lg overflow-hidden border border-white/10 bg-black/40">
              <div className="flex justify-between items-center px-3 py-1.5 bg-white/5 text-[10px] text-gray-400 font-mono select-none">
                <span>{lang || 'code'}</span>
                <button
                  onClick={() => handleCopyCode(code, partIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedIndex === partIdx ? (
                    <>
                      <Check size={10} className="text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] font-mono text-gray-200 leading-relaxed leading-normal scrollbar-thin">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        // Regular text formatting (bold, inline code, paragraphs)
        const lines = part.split('\n')
        return (
          <div key={partIdx} className="space-y-1">
            {lines.map((line, lineIdx) => {
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const cleanLine = line.replace(/^[-*]\s+/, '')
                return (
                  <ul key={lineIdx} className="list-disc pl-4 space-y-0.5">
                    <li className="leading-relaxed">{parseInlineStyles(cleanLine)}</li>
                  </ul>
                )
              }
              if (line.trim().startsWith('#')) {
                const headerDepth = (line.match(/^#+/) || ['#'])[0].length
                const cleanLine = line.replace(/^#+\s+/, '')
                const headerSize = headerDepth === 1 ? 'text-lg font-bold' : headerDepth === 2 ? 'text-base font-semibold' : 'text-sm font-medium'
                return (
                  <div key={lineIdx} className={`${headerSize} mt-3 mb-1 text-indigo-300`}>
                    {parseInlineStyles(cleanLine)}
                  </div>
                )
              }
              return line.trim() ? (
                <p key={lineIdx} className="leading-relaxed leading-normal">
                  {parseInlineStyles(line)}
                </p>
              ) : (
                <div key={lineIdx} className="h-2" />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// Helper to parse bold (**text**) and inline code (`code`)
function parseInlineStyles(text: string) {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={idx} className="bg-black/25 px-1 py-0.5 rounded text-[11px] font-mono text-pink-300">{token.slice(1, -1)}</code>
    }
    return token
  })
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  activeProvider,
  activeModel,
  isGenerating,
  fontSize,
  opacity,
  transcriptionMode,
  whisperProvider,
  whisperApiKey
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)
  const [voiceStatusMsg, setVoiceStatusMsg] = useState('')
  const [voiceError, setVoiceError] = useState('')

  // Screen OCR states
  const [isCapturingScreen, setIsCapturingScreen] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [ocrError, setOcrError] = useState('')
  const [ocrCopied, setOcrCopied] = useState(false)

  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  const handleSend = () => {
    const textToSend = input.trim()
    if (!textToSend && !ocrText) return
    if (isGenerating) return

    if (ocrText) {
      // Send as context if ocr text is active
      onSendMessage(`Analyze the following screen content and reply accordingly:\n\n\`\`\`\n${ocrText}\n\`\`\`\n\n${textToSend || 'Please explain what is on the screen.'}`)
      setOcrText('')
    } else {
      onSendMessage(textToSend)
    }
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      stopLocalRecognition()
      stopWhisperRecording()
    }
  }, [])

  // Local Web Speech API functions
  const startLocalRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError('Web Speech API is not supported on this platform.')
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onstart = () => {
        setIsRecording(true)
        setIsRecordingPaused(false)
        setVoiceStatusMsg('Listening voice (Local)...')
        setVoiceError('')
      }

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event)
        setVoiceError(event.error === 'network' ? 'Chromium Speech API requires an internet connection.' : `Error: ${event.error}`)
      }

      rec.onend = () => {
        if (isRecording && !isRecordingPaused) {
          rec.start()
        }
      }

      rec.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript)
        }
      }

      recognitionRef.current = rec
      rec.start()
    } catch (e: any) {
      setVoiceError(`Failed to start voice: ${e.message}`)
    }
  }

  const stopLocalRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }

  // Whisper Cloud Transcription functions
  const startWhisperRecording = async () => {
    if (!whisperApiKey) {
      setVoiceError(`API Key required for Whisper (${whisperProvider.toUpperCase()}). Please configure it in settings.`)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await processWhisperChunk(audioBlob)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setIsRecordingPaused(false)
      setVoiceStatusMsg(`Recording via Whisper (${whisperProvider.toUpperCase()})...`)
      setVoiceError('')

      recordingTimerRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
          mediaRecorderRef.current.start()
        }
      }, 7000)
    } catch (err: any) {
      setVoiceError(`Mic Access Error: ${err.message}`)
    }
  }

  const stopWhisperRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      mediaRecorderRef.current = null
    }
  }

  const processWhisperChunk = async (audioBlob: Blob) => {
    try {
      setVoiceStatusMsg('Transcribing voice...')
      const arrayBuffer = await audioBlob.arrayBuffer()
      const fileName = `voice-chunk-${Date.now()}.webm`

      const result = await window.api.transcribeAudio({
        provider: whisperProvider,
        apiKey: whisperApiKey,
        audioArrayBuffer: arrayBuffer,
        fileName
      })

      if (result.success && result.text && result.text.trim()) {
        const text = result.text.trim()
        setInput(prev => prev + (prev ? ' ' : '') + text)
        setVoiceStatusMsg(`Recording via Whisper (${whisperProvider.toUpperCase()})...`)
      } else if (!result.success) {
        setVoiceError(`Whisper API error: ${result.error}`)
      }
    } catch (e: any) {
      setVoiceError(`Transcription error: ${e.message}`)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      handleVoiceStopAndSubmit()
    } else {
      setVoiceError('')
      if (transcriptionMode === 'local') {
        startLocalRecognition()
      } else {
        startWhisperRecording()
      }
    }
  }

  const handleVoicePauseToggle = () => {
    if (isRecordingPaused) {
      setIsRecordingPaused(false)
      if (transcriptionMode === 'local') {
        startLocalRecognition()
      } else {
        startWhisperRecording()
      }
    } else {
      setIsRecordingPaused(true)
      setVoiceStatusMsg('Recording paused')
      if (transcriptionMode === 'local') {
        stopLocalRecognition()
      } else {
        stopWhisperRecording()
      }
    }
  }

  const handleVoiceStopAndSubmit = () => {
    setIsRecording(false)
    setIsRecordingPaused(false)
    setVoiceStatusMsg('')

    if (transcriptionMode === 'local') {
      stopLocalRecognition()
    } else {
      stopWhisperRecording()
    }

    setTimeout(() => {
      handleSend()
    }, 200)
  }

  // Global Ctrl+Shift+V Hotkey listener
  useEffect(() => {
    const unsubscribe = window.api.onGlobalShortcutVoice(() => {
      toggleRecording()
    })
    return () => unsubscribe()
  }, [isRecording, isRecordingPaused, transcriptionMode, whisperProvider, whisperApiKey])

  // Screen Capture OCR function
  const handleCaptureScreen = async () => {
    setIsCapturingScreen(true)
    setOcrError('')
    try {
      const result = await window.api.captureScreenOCR()
      if (result.success && result.text) {
        setOcrText(result.text)
        setOcrError('')
      } else if (!result.success) {
        setOcrError(result.error || 'Failed to capture screen.')
      } else {
        setOcrText('')
        setOcrError('Screen captured, but no readable text found.')
      }
    } catch (err: any) {
      setOcrError(`Capture error: ${err.message}`)
    } finally {
      setIsCapturingScreen(false)
    }
  }

  const handleAnalyzeOCR = (presetPrompt: string) => {
    if (!ocrText || isGenerating) return
    const finalPrompt = `${presetPrompt}\n\n\`\`\`\n${ocrText}\n\`\`\``
    onSendMessage(finalPrompt)
    setOcrText('') // Clear OCR context after sending
  }

  return (
    <div className="flex flex-col h-full flex-grow overflow-hidden">
      {/* Active Model Indicator */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b text-[10px] text-gray-400 select-none"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${opacity * 0.1})`,
          borderBottomColor: `rgba(255, 255, 255, ${opacity * 0.1})`
        }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-indigo-400 animate-pulse" />
          <span>Using: <strong className="text-gray-200 capitalize">{activeProvider}</strong> ({activeModel})</span>
        </div>
        {isRecording && (
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 font-bold uppercase tracking-wider animate-pulse">
            Voice Active
          </span>
        )}
      </div>

      {/* Messages Panel */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400 space-y-3 select-none">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="text-indigo-400" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-200">Welcome to Adrishya</p>
              <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">
                Ask questions, toggle voice, or capture screen OCR all in one workspace.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  isUser
                    ? 'text-white rounded-br-none shadow-md'
                    : 'rounded-bl-none border'
                }`}
                style={isUser ? {
                  backgroundColor: `rgba(79, 70, 229, ${opacity * 0.85})`,
                  boxShadow: `0 4px 6px -1px rgba(79, 70, 229, ${opacity * 0.2})`
                } : {
                  backgroundColor: `rgba(255, 255, 255, ${opacity * 0.05})`,
                  borderColor: `rgba(255, 255, 255, ${opacity * 0.1})`
                }}
              >
                <FormattedMessage content={msg.content} fontSize={fontSize} />
              </div>
              <span className="text-[8px] text-gray-500 mt-1 select-none">
                {isUser ? 'You' : 'Adrishya'}
              </span>
            </div>
          )
        })}

        {isGenerating && (
          <div className="flex flex-col items-start">
            <div
              className="border rounded-2xl rounded-bl-none px-3 py-2 flex items-center gap-1"
              style={{
                backgroundColor: `rgba(255, 255, 255, ${opacity * 0.05})`,
                borderColor: `rgba(255, 255, 255, ${opacity * 0.1})`
              }}
            >
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[8px] text-gray-500 mt-1 select-none">Adrishya is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Status Bars (Voice, Screen OCR, Errors) */}
      <div
        className="flex flex-col"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${opacity * 0.1})`
        }}
      >
        {/* Voice recording status bar */}
        {isRecording && (
          <div
            className="mx-3 mt-2 p-2.5 border rounded-xl flex items-center justify-between text-[10px] animate-fade-in select-none"
            style={{
              backgroundColor: `rgba(30, 27, 75, ${opacity * 0.4})`,
              borderColor: `rgba(99, 102, 241, ${opacity * 0.2})`
            }}
          >
            <div className="flex items-center gap-2 text-indigo-300 font-medium">
              {isRecordingPaused ? (
                <MicOff size={12} className="text-yellow-400" />
              ) : (
                <div className="flex items-end gap-0.5 h-3.5 mr-0.5">
                  <span className="w-0.5 bg-indigo-400 rounded-full wave-bar h-1.5" />
                  <span className="w-0.5 bg-indigo-400 rounded-full wave-bar h-3" />
                  <span className="w-0.5 bg-indigo-400 rounded-full wave-bar h-2" />
                </div>
              )}
              <span>{voiceStatusMsg || 'Listening...'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleVoicePauseToggle}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/5 font-semibold cursor-pointer"
              >
                {isRecordingPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleVoiceStopAndSubmit}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-semibold cursor-pointer"
              >
                Stop & Send
              </button>
            </div>
          </div>
        )}

        {/* Screen OCR Captured context bar */}
        {ocrText && (
          <div
            className="mx-3 mt-2 p-2.5 border rounded-xl flex flex-col gap-2 text-[10px] animate-fade-in"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${opacity * 0.4})`,
              borderColor: `rgba(255, 255, 255, ${opacity * 0.1})`
            }}
          >
            <div className="flex justify-between items-center select-none text-gray-400">
              <span className="font-mono flex items-center gap-1 text-indigo-300">
                <FileText size={11} />
                Screen Context ({ocrText.length} chars)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ocrText)
                    setOcrCopied(true)
                    setTimeout(() => setOcrCopied(false), 2000)
                  }}
                  className="hover:text-white transition-colors p-0.5"
                >
                  {ocrCopied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                </button>
                <button
                  onClick={() => setOcrText('')}
                  className="hover:text-white transition-colors font-bold text-xs"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
            <div
              className="max-h-16 overflow-y-auto font-mono text-[9px] p-1.5 rounded text-gray-300 border whitespace-pre-wrap select-text scrollbar-thin"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${opacity * 0.4})`,
                borderColor: `rgba(255, 255, 255, ${opacity * 0.05})`
              }}
            >
              {ocrText}
            </div>
            <div className="flex gap-1.5 select-none">
              <button
                onClick={() => handleAnalyzeOCR('Explain the code and correct errors if any:')}
                disabled={isGenerating}
                className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-lg text-[9px] font-medium transition-all cursor-pointer"
              >
                Explain Code
              </button>
              <button
                onClick={() => handleAnalyzeOCR('Analyze this screen capture and provide the correct answers or next steps details:')}
                disabled={isGenerating}
                className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-lg text-[9px] font-medium transition-all cursor-pointer"
              >
                Solve / Answer
              </button>
              <button
                onClick={() => {
                  setInput(prev => prev + (prev ? '\n' : '') + ocrText)
                  setOcrText('')
                }}
                className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-semibold transition-all cursor-pointer"
              >
                Append
              </button>
            </div>
          </div>
        )}

        {/* Error message bar */}
        {(ocrError || voiceError) && (
          <div
            className="mx-3 mt-2 p-2 border text-red-300 rounded-xl text-[9px] flex gap-1.5 items-start animate-fade-in select-none"
            style={{
              backgroundColor: `rgba(69, 10, 10, ${opacity * 0.4})`,
              borderColor: `rgba(239, 68, 68, ${opacity * 0.2})`
            }}
          >
            <AlertCircle size={12} className="shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">
              <p>{ocrError || voiceError}</p>
            </div>
            <button
              onClick={() => { setOcrError(''); setVoiceError(''); }}
              className="text-[11px] font-bold text-red-400 hover:text-white"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Input box */}
      <div
        className="p-3 border-t"
        style={{
          borderTopColor: `rgba(255, 255, 255, ${opacity * 0.1})`,
          backgroundColor: `rgba(0, 0, 0, ${opacity * 0.2})`
        }}
      >
        <div
          className="relative flex items-center border rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all duration-200 pr-2 pl-3 py-1.5"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${opacity * 0.05})`,
            borderColor: `rgba(255, 255, 255, ${opacity * 0.1})`
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={isGenerating}
            className="flex-1 bg-transparent border-0 text-xs text-white placeholder-gray-500 focus:ring-0 focus:outline-none resize-none pr-20 py-0.5 leading-normal max-h-24 scrollbar-none"
          />
          <div className="absolute right-2 bottom-1.5 flex items-center gap-1.5 select-none">
            {/* Screen Capture OCR Trigger */}
            <button
              onClick={handleCaptureScreen}
              disabled={isCapturingScreen || isGenerating}
              title="Capture Screen & Run OCR"
              className={`p-1 rounded-lg transition-all duration-200 cursor-pointer ${
                isCapturingScreen
                  ? 'text-indigo-400 bg-white/5 animate-spin'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera size={12} />
            </button>

            {/* Microphone Voice Assistant Trigger */}
            <button
              onClick={toggleRecording}
              disabled={isGenerating}
              title="Toggle Voice Assistant (Ctrl+Shift+V)"
              className={`p-1 rounded-lg transition-all duration-200 cursor-pointer ${
                isRecording
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 animate-pulse'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              aria-label="Send Message"
              disabled={(!input.trim() && !ocrText) || isGenerating}
              className={`p-1 rounded-lg transition-all duration-200 cursor-pointer ${
                (input.trim() || ocrText) && !isGenerating
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
