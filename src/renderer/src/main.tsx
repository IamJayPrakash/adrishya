import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Add mock window.api for browser-only previews
if (typeof window.api === 'undefined') {
  window.api = {
    resizeWindow: (width, height) => console.log('Mock Resize Window:', width, height),
    moveWindow: (deltaX, deltaY) => console.log('Mock Move Window:', deltaX, deltaY),
    setScreenProtection: async (enabled) => {
      console.log('Mock Set Screen Protection:', enabled)
      return true
    },
    setWindowBlur: async (enabled) => {
      console.log('Mock Set Window Blur:', enabled)
      return true
    },
    captureScreenOCR: async () => {
      console.log('Mock Capture Screen OCR')
      return { success: true, text: 'Extracted sample OCR code from active window:\n\nfunction add(a, b) {\n  return a + b;\n}' }
    },
    onGlobalShortcutVoice: (callback) => {
      console.log('Mock Global Shortcut Voice registered')
      // Expose globally so it can be simulated in browser console
      ;(window as any).simulateVoiceHotkey = callback
      return () => {
        console.log('Mock Global Shortcut Voice cleaned up')
        delete (window as any).simulateVoiceHotkey
      }
    },
    callAI: async (req) => {
      console.log('Mock callAI:', req)
      return {
        success: true,
        text: `**[Mock ${req.provider.toUpperCase()} Response]**\n\nI received your prompt: "${req.messages[req.messages.length - 1]?.content}"\n\nHere is a sample function response:\n\`\`\`javascript\nfunction greet(name) {\n  return \`Hello, \${name}! Welcome to Adrishya.\`;\n}\n\`\`\``
      }
    },
    transcribeAudio: async (req) => {
      console.log('Mock transcribeAudio:', req)
      return { success: true, text: 'This is a mock voice transcript from the browser.' }
    },
    quitApp: () => {
      console.log('Mock Quit App')
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
