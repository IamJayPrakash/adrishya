import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Copy, Check, CornerDownLeft } from 'lucide-react'

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
  // Regex split for bold and inline code
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
  fontSize
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (!input.trim() || isGenerating) return
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  return (
    <div className="flex flex-col h-full flex-grow overflow-hidden">
      {/* Active Model Indicator */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10 text-[10px] text-gray-400 select-none bg-black/10">
        <Sparkles size={11} className="text-indigo-400 animate-pulse" />
        <span>Using: <strong className="text-gray-200 capitalize">{activeProvider}</strong> ({activeModel})</span>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400 space-y-3 select-none">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="text-indigo-400" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-200">Welcome to Adrishe</p>
              <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Ask a question, start voice recording, or analyze your screen contents.</p>
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
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                    : 'bg-white/5 border border-white/10 rounded-bl-none'
                }`}
              >
                <FormattedMessage content={msg.content} fontSize={fontSize} />
              </div>
              <span className="text-[8px] text-gray-500 mt-1 select-none">
                {isUser ? 'You' : 'Adrishe'}
              </span>
            </div>
          )
        })}

        {isGenerating && (
          <div className="flex flex-col items-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-3 py-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[8px] text-gray-500 mt-1 select-none">Adrishe is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all duration-200 pr-2 pl-3 py-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={isGenerating}
            className="flex-1 bg-transparent border-0 text-xs text-white placeholder-gray-500 focus:ring-0 focus:outline-none resize-none pr-8 py-0.5 leading-normal max-h-24 scrollbar-none"
          />
          <div className="absolute right-2 bottom-1.5 flex items-center gap-1.5 select-none">
            <span className="text-[9px] text-gray-500 flex items-center gap-0.5 bg-white/5 px-1 py-0.5 rounded border border-white/5">
              Enter
              <CornerDownLeft size={8} />
            </span>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                input.trim() && !isGenerating
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
