import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SettingsPanel } from '../components/SettingsPanel'

describe('SettingsPanel Component', () => {
  it('renders visual customized sliders and inputs correctly', () => {
    const handleSave = vi.fn()
    render(
      <SettingsPanel
        opacity={0.9}
        setOpacity={vi.fn()}
        fontSize={13}
        setFontSize={vi.fn()}
        theme="dark"
        setTheme={vi.fn()}
        screenProtection={true}
        setScreenProtection={vi.fn()}
        transcriptionMode="local"
        setTranscriptionMode={vi.fn()}
        whisperProvider="groq"
        setWhisperProvider={vi.fn()}
        openaiKey="sk-test"
        setOpenaiKey={vi.fn()}
        geminiKey=""
        setGeminiKey={vi.fn()}
        claudeKey=""
        setClaudeKey={vi.fn()}
        groqKey=""
        setGroqKey={vi.fn()}
        grokKey=""
        setGrokKey={vi.fn()}
        activeProvider="openai"
        setActiveProvider={vi.fn()}
        openaiModel="gpt-4o-mini"
        setOpenaiModel={vi.fn()}
        geminiModel="gemini-1.5-flash"
        setGeminiModel={vi.fn()}
        claudeModel="claude-3-5-sonnet-20241022"
        setClaudeModel={vi.fn()}
        groqModel="llama3-70b-8192"
        setGroqModel={vi.fn()}
        grokModel="grok-2-1212"
        setGrokModel={vi.fn()}
        onSave={handleSave}
      />
    )

    expect(screen.getByText('Visual Customize')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument() // Opacity value display
    expect(screen.getByPlaceholderText('OpenAI API Key...')).toHaveValue('sk-test')
    
    const saveButton = screen.getByText('Save Settings')
    fireEvent.click(saveButton)
    expect(handleSave).toHaveBeenCalled()
  })
})
