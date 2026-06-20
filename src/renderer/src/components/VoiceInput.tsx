import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Play, Pause, Square, AlertCircle } from 'lucide-react'

interface VoiceInputProps {
  onTranscriptReceived: (text: string) => void
  fontSize: number
  whisperProvider: 'groq' | 'openai'
  apiKey: string
  transcriptionMode: 'local' | 'api'
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptReceived,
  fontSize,
  whisperProvider,
  apiKey,
  transcriptionMode
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [statusMsg, setStatusMsg] = useState('Ready to transcribe')
  const [errorMsg, setErrorMsg] = useState('')

  // Web Speech API references
  const recognitionRef = useRef<any>(null)

  // API-based Whisper references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Listen to global Ctrl+Shift+V hotkey from main process
  useEffect(() => {
    const unsubscribe = window.api.onGlobalShortcutVoice(() => {
      // Toggle recording on global hotkey
      toggleRecording()
    })
    return () => unsubscribe()
  }, [isRecording, isPaused, transcriptionMode, whisperProvider, apiKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalRecognition()
      stopWhisperRecording()
    }
  }, [])

  // Web Speech API (Local) controls
  const startLocalRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg('Web Speech API is not supported on this platform.')
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onstart = () => {
        setIsRecording(true)
        setIsPaused(false)
        setStatusMsg('Listening continuously (Local engine)...')
        setErrorMsg('')
      }

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event)
        if (event.error === 'network') {
          setErrorMsg('Network error. Chromium speech API requires internet connection.')
        } else {
          setErrorMsg(`Error: ${event.error}`)
        }
      }

      rec.onend = () => {
        // Automatically restart if we are still supposed to be recording
        if (isRecording && !isPaused) {
          rec.start()
        }
      }

      rec.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          onTranscriptReceived(finalTranscript)
        }
      }

      recognitionRef.current = rec
      rec.start()
    } catch (e: any) {
      setErrorMsg(`Failed to start local engine: ${e.message}`)
    }
  }

  const stopLocalRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }

  // API-based Whisper (Groq/OpenAI) controls
  // Captures audio in chunks and sends to API
  const startWhisperRecording = async () => {
    if (!apiKey) {
      setErrorMsg(`API Key required for Whisper (${whisperProvider.toUpperCase()}). Please configure it in settings.`)
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
        // If we have chunks, send them for transcription
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await processWhisperChunk(audioBlob)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setStatusMsg(`Listening continuously via Whisper (${whisperProvider.toUpperCase()})...`)
      setErrorMsg('')

      // Periodically stop, send chunk, and restart to achieve continuous stream
      recordingTimerRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          // Restart recording
          mediaRecorderRef.current.stop()
          mediaRecorderRef.current.start()
        }
      }, 7000) // Send chunk every 7 seconds

    } catch (err: any) {
      console.error('Failed to access microphone:', err)
      setErrorMsg(`Mic Access Error: ${err.message}`)
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
      // Stop all tracks on the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      mediaRecorderRef.current = null
    }
  }

  const processWhisperChunk = async (audioBlob: Blob) => {
    try {
      setStatusMsg('Transcribing chunk...')
      const arrayBuffer = await audioBlob.arrayBuffer()
      const fileName = `voice-chunk-${Date.now()}.webm`

      const result = await window.api.transcribeAudio({
        provider: whisperProvider,
        apiKey: apiKey,
        audioArrayBuffer: arrayBuffer,
        fileName
      })

      if (result.success && result.text && result.text.trim()) {
        const text = result.text.trim() + ' '
        setTranscript(prev => prev + text)
        onTranscriptReceived(text)
        setStatusMsg(`Listening continuously via Whisper (${whisperProvider.toUpperCase()})...`)
      } else if (!result.success) {
        console.error('Transcription API error:', result.error)
        setErrorMsg(`API Error: ${result.error}`)
      }
    } catch (e: any) {
      console.error('Failed to process Whisper chunk:', e)
      setErrorMsg(`Transcription error: ${e.message}`)
    }
  }

  // Toggle controls
  const toggleRecording = () => {
    if (isRecording) {
      handleStop()
    } else {
      handleStart()
    }
  }

  const handleStart = () => {
    setTranscript('')
    setErrorMsg('')
    if (transcriptionMode === 'local') {
      startLocalRecognition()
    } else {
      startWhisperRecording()
    }
  }

  const handleStop = () => {
    setIsRecording(false)
    setIsPaused(false)
    setStatusMsg('Ready to transcribe')

    if (transcriptionMode === 'local') {
      stopLocalRecognition()
    } else {
      stopWhisperRecording()
    }
  }

  const handlePauseToggle = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false)
      if (transcriptionMode === 'local') {
        startLocalRecognition()
      } else {
        startWhisperRecording()
      }
    } else {
      // Pause
      setIsPaused(true)
      setStatusMsg('Transcription paused')
      if (transcriptionMode === 'local') {
        stopLocalRecognition()
      } else {
        stopWhisperRecording()
      }
    }
  }

  return (
    <div className="flex flex-col h-full flex-grow overflow-hidden px-4 py-4 space-y-4">
      {/* Waveform Visualization */}
      <div className="flex flex-col items-center justify-center py-6 bg-black/10 rounded-2xl border border-white/5 select-none relative overflow-hidden">
        {isRecording && !isPaused ? (
          <div className="flex items-end gap-1.5 h-12">
            <div className="w-1.5 bg-indigo-500 rounded-full wave-bar h-6" />
            <div className="w-1.5 bg-indigo-500 rounded-full wave-bar h-10" />
            <div className="w-1.5 bg-indigo-400 rounded-full wave-bar h-12" />
            <div className="w-1.5 bg-indigo-500 rounded-full wave-bar h-8" />
            <div className="w-1.5 bg-indigo-600 rounded-full wave-bar h-5" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 text-gray-500">
            {isPaused ? <MicOff size={20} className="text-yellow-400/70" /> : <Mic size={20} />}
          </div>
        )}
        <span className="text-[10px] font-medium mt-3 text-gray-300">{statusMsg}</span>
        <span className="text-[8px] text-gray-500 mt-1">Press Ctrl+Shift+V anywhere to toggle</span>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex gap-2 items-start p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl text-[10px]">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Transcript Textbox */}
      <div className="flex-1 flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden p-3 relative">
        <span className="text-[9px] font-mono text-gray-500 select-none mb-1">LIVE TRANSCRIPT:</span>
        <div
          className="flex-1 overflow-y-auto pr-1 text-gray-200 select-text leading-relaxed leading-normal scrollbar-thin"
          style={{ fontSize: `${fontSize}px` }}
        >
          {transcript ? (
            transcript
          ) : (
            <span className="text-gray-500 italic select-none">No speech captured yet. Click Start or press hotkey to begin.</span>
          )}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all select-none"
          >
            <Mic size={14} />
            Start Voice
          </button>
        ) : (
          <>
            <button
              onClick={handlePauseToggle}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all select-none ${
                isPaused 
                  ? 'bg-yellow-600/25 border-yellow-500/30 text-yellow-400 hover:bg-yellow-600/30' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/20 transition-all select-none"
            >
              <Square size={12} />
              Stop & Clear
            </button>
          </>
        )}
      </div>
    </div>
  )
}
