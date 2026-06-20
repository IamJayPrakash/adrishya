import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChatPanel } from '../components/ChatPanel'

describe('ChatPanel Component', () => {
  it('renders welcome screen when message history is empty', () => {
    render(
      <ChatPanel
        messages={[]}
        onSendMessage={vi.fn()}
        activeProvider="gemini"
        activeModel="gemini-1.5-flash"
        isGenerating={false}
        fontSize={13}
        opacity={0.9}
        showModelIndicator={true}
        transcriptionMode="local"
        whisperProvider="groq"
        whisperApiKey=""
      />
    )
    expect(screen.getByText('Welcome to Adrishya')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('renders conversational messages correctly', () => {
    const mockMessages = [
      { role: 'user' as const, content: 'Hello assistant' },
      { role: 'assistant' as const, content: 'Hello user, how can I assist?' }
    ]

    render(
      <ChatPanel
        messages={mockMessages}
        onSendMessage={vi.fn()}
        activeProvider="gemini"
        activeModel="gemini-1.5-flash"
        isGenerating={false}
        fontSize={13}
        opacity={0.9}
        showModelIndicator={true}
        transcriptionMode="local"
        whisperProvider="groq"
        whisperApiKey=""
      />
    )

    expect(screen.getByText('Hello assistant')).toBeInTheDocument()
    expect(screen.getByText('Hello user, how can I assist?')).toBeInTheDocument()
  })

  it('submits typed message when clicking Send button', () => {
    const handleSend = vi.fn()
    render(
      <ChatPanel
        messages={[]}
        onSendMessage={handleSend}
        activeProvider="gemini"
        activeModel="gemini-1.5-flash"
        isGenerating={false}
        fontSize={13}
        opacity={0.9}
        showModelIndicator={true}
        transcriptionMode="local"
        whisperProvider="groq"
        whisperApiKey=""
      />
    )

    const textarea = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(textarea, { target: { value: 'Test message query' } })
    
    // Find the Send button specifically by its aria-label
    const sendButton = screen.getByRole('button', { name: /send message/i })
    fireEvent.click(sendButton)

    expect(handleSend).toHaveBeenCalledWith('Test message query')
  })
})
