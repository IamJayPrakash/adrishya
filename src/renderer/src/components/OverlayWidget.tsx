import React from 'react'
import { MessageSquare, Settings, Maximize2, Minimize2, Trash2, X } from 'lucide-react'
import logo from '../assets/logo.png'

interface OverlayWidgetProps {
  mode: 'chat' | 'voice' | 'screen' | 'settings'
  setMode: (mode: 'chat' | 'voice' | 'screen' | 'settings') => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  theme: 'light' | 'dark' | 'amoled'
  opacity: number
  blur: number
  onClearHistory: () => void
  children: React.ReactNode
}

export const OverlayWidget: React.FC<OverlayWidgetProps> = ({
  mode,
  setMode,
  isCollapsed,
  setIsCollapsed,
  theme,
  opacity,
  blur,
  onClearHistory,
  children
}) => {
  // Determine glassmorphism CSS class
  const getGlassClass = () => {
    if (theme === 'light') return 'frosted-glass-light'
    if (theme === 'amoled') return 'frosted-glass-amoled'
    return 'frosted-glass-dark'
  }

  // Get dynamic background style for true window transparency (fades bg color without text blur)
  const getGlassStyle = () => {
    const baseStyle = {
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`
    }

    if (theme === 'light') {
      return {
        ...baseStyle,
        background: `rgba(255, 255, 255, ${opacity * 0.65})`,
        border: `1px solid rgba(255, 255, 255, ${opacity * 0.4})`,
        boxShadow: `0 8px 32px 0 rgba(31, 38, 135, ${opacity * 0.08})`
      }
    }
    if (theme === 'amoled') {
      return {
        ...baseStyle,
        background: `rgba(0, 0, 0, ${opacity * 0.95})`,
        border: `1px solid rgba(255, 255, 255, ${opacity * 0.04})`,
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, ${opacity * 0.8})`
      }
    }
    // Dark theme (default)
    return {
      ...baseStyle,
      background: `rgba(18, 20, 26, ${opacity * 0.65})`,
      border: `1px solid rgba(255, 255, 255, ${opacity * 0.08})`,
      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, ${opacity * 0.37})`
    }
  }

  // Handle Collapsing and Resizing
  const handleCollapseToggle = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)

    if (nextState) {
      // Small horizontal pill window size
      window.api.resizeWindow(320, 75)
    } else {
      // Standard panel window size
      window.api.resizeWindow(380, 600)
    }
  }

  return (
    <div
      className={`h-screen flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border ${getGlassClass()}`}
      style={getGlassStyle()}
    >
      {/* Header bar (Draggable) */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b select-none cursor-move"
        style={{
          WebkitAppRegion: 'drag',
          pointerEvents: 'auto',
          backgroundColor: `rgba(255, 255, 255, ${opacity * 0.05})`,
          borderBottomColor: `rgba(255, 255, 255, ${opacity * 0.1})`
        } as any}
      >
        <div className="flex items-center gap-1.5 select-none">
          {/* Logo icon */}
          <img src={logo} alt="Adrishya Logo" className="w-4 h-4 rounded-md object-cover" />
          <span className="text-[11px] font-bold tracking-wide text-white uppercase font-sans">Adrishya</span>
        </div>

        {/* Action Controls (No-drag so they are clickable) */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Clear history button */}
          {!isCollapsed && mode === 'chat' && (
            <button
              onClick={onClearHistory}
              title="Clear Chat History"
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Trash2 size={12} />
            </button>
          )}

          {/* Settings button */}
          {!isCollapsed && (
            <button
              onClick={() => setMode(mode === 'settings' ? 'chat' : 'settings')}
              title={mode === 'settings' ? 'Back to Chat' : 'Open Settings'}
              className={`p-1 rounded-lg transition-all ${
                mode === 'settings' ? 'text-indigo-400 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={12} />
            </button>
          )}

          {/* Collapse/Expand button */}
          <button
            onClick={handleCollapseToggle}
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>

          {/* Close button */}
          <button
            onClick={() => window.api.quitApp()}
            title="Quit Application (Ctrl+Shift+Q)"
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Main Contents */}
      {isCollapsed ? (
        // Collapsed horizontal mode (Pill layout)
        <div className="flex-1 flex items-center justify-between px-4 select-none">
          <span className="text-[10px] text-gray-400 italic">Floating Widget</span>
          <button
            onClick={() => { setMode('chat'); handleCollapseToggle(); }}
            className="p-1.5 rounded-lg border border-white/5 bg-indigo-600/20 text-indigo-300 hover:text-white flex items-center gap-1.5 text-[10px] font-semibold"
          >
            <MessageSquare size={12} />
            Expand Chat
          </button>
        </div>
      ) : (
        // Expanded vertical mode (Full App)
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Render children component directly without bottom tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        </div>
      )}
    </div>
  )
}
