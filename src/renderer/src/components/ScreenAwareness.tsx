import React, { useState } from 'react'
import { Camera, FileText, Sparkles, AlertCircle, Copy, Check } from 'lucide-react'

interface ScreenAwarenessProps {
  onSendToAI: (prompt: string) => void
  isGenerating: boolean
  fontSize: number
}

export const ScreenAwareness: React.FC<ScreenAwarenessProps> = ({
  onSendToAI,
  isGenerating,
  fontSize
}) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCapture = async () => {
    setIsCapturing(true)
    setErrorMsg('')
    try {
      const result = await window.api.captureScreenOCR()
      if (result.success && result.text) {
        setOcrText(result.text)
      } else if (!result.success) {
        setErrorMsg(result.error || 'Failed to capture screen.')
      } else {
        setOcrText('')
        setErrorMsg('Screen captured, but no readable text found. Make sure text is visible on the screen.')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(`Capture error: ${err.message}`)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleCopy = () => {
    if (!ocrText) return
    navigator.clipboard.writeText(ocrText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAnalyze = (presetPrompt: string) => {
    if (!ocrText || isGenerating) return
    const finalPrompt = `${presetPrompt}\n\n\`\`\`\n${ocrText}\n\`\`\``
    onSendToAI(finalPrompt)
  }

  return (
    <div className="flex flex-col h-full flex-grow overflow-hidden px-4 py-4 space-y-4">
      {/* Capture Screen Widget */}
      <div className="flex flex-col items-center justify-center p-6 bg-black/10 rounded-2xl border border-white/5 select-none text-center space-y-3 relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Camera className="text-indigo-400" size={24} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-200">Screen OCR Awareness</p>
          <p className="text-[10px] text-gray-500 mt-1 max-w-[220px]">
            Reads code, questions, or text directly from your primary display using private local OCR.
          </p>
        </div>
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-md ${
            isCapturing
              ? 'bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          {isCapturing ? (
            <>
              <span className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-0.5" />
              Reading Screen...
            </>
          ) : (
            <>
              <Camera size={14} />
              Capture Screen
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex gap-2 items-start p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl text-[10px]">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* OCR Result View */}
      <div className="flex-1 flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden p-3 relative">
        <div className="flex justify-between items-center select-none mb-1 border-b border-white/5 pb-1">
          <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
            <FileText size={10} />
            EXTRACTED TEXT CONTENT:
          </span>
          {ocrText && (
            <button
              onClick={handleCopy}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            </button>
          )}
        </div>
        <div
          className="flex-grow overflow-y-auto pr-1 text-gray-300 select-text leading-relaxed font-mono whitespace-pre-wrap scrollbar-thin"
          style={{ fontSize: `${fontSize - 1}px` }}
        >
          {ocrText ? (
            ocrText
          ) : (
            <span className="text-gray-500 italic select-none font-sans">
              No screen capture loaded. Click Capture Screen to scan.
            </span>
          )}
        </div>
      </div>

      {/* Fast Preset Actions */}
      {ocrText && (
        <div className="grid grid-cols-2 gap-2 select-none">
          <button
            onClick={() => handleAnalyze('Explain the code and correct errors if any:')}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-xl text-[10px] font-medium transition-all"
          >
            <Sparkles size={11} className="text-indigo-400" />
            Explain Code
          </button>
          <button
            onClick={() => handleAnalyze('Analyze this screen capture and provide the correct answers or next steps details:')}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-xl text-[10px] font-medium transition-all"
          >
            <Sparkles size={11} className="text-indigo-400" />
            Solve / Answer
          </button>
        </div>
      )}
    </div>
  )
}
