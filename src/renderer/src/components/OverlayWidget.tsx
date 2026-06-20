import React from 'react'
import { MessageSquare, Mic, Camera, Settings, Maximize2, Minimize2, Trash2 } from 'lucide-react'

interface OverlayWidgetProps {
  mode: 'chat' | 'voice' | 'screen' | 'settings'
  setMode: (mode: 'chat' | 'voice' | 'screen' | 'settings') => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  theme: 'light' | 'dark' | 'amoled'
  opacity: number
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
  onClearHistory,
  children
}) => {
  // Determine glassmorphism CSS class
  const getGlassClass = () => {
    if (theme === 'light') return 'frosted-glass-light'
    if (theme === 'amoled') return 'frosted-glass-amoled'
    return 'frosted-glass-dark'
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
      style={{ opacity }}
    >
      {/* Header bar (Draggable) */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 select-none bg-white/5 cursor-move"
        style={{ WebAppRegion: 'drag', pointerEvents: 'auto' } as any}
      >
        <div className="flex items-center gap-1.5">
          {/* Accent dot indicator */}
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wide text-white uppercase font-sans">Adrishe</span>
        </div>

        {/* Action Controls (No-drag so they are clickable) */}
        <div className="flex items-center gap-1" style={{ WebAppRegion: 'no-drag' } as any}>
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

          {/* Collapse/Expand button */}
          <button
            onClick={handleCollapseToggle}
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Main Contents */}
      {isCollapsed ? (
        // Collapsed horizontal mode (Pill layout)
        <div className="flex-1 flex items-center justify-between px-4 select-none">
          <span className="text-[10px] text-gray-400 italic">Floating Widget</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('chat'); handleCollapseToggle(); }}
              className={`p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-300 hover:text-white`}
            >
              <MessageSquare size={12} />
            </button>
            <button
              onClick={() => { setMode('voice'); handleCollapseToggle(); }}
              className={`p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-300 hover:text-white`}
            >
              <Mic size={12} />
            </button>
            <button
              onClick={() => { setMode('screen'); handleCollapseToggle(); }}
              className={`p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-300 hover:text-white`}
            >
              <Camera size={12} />
            </button>
          </div>
        </div>
      ) : (
        // Expanded vertical mode (Full App)
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation Controls */}
          <div className="flex border-b border-white/5 bg-black/10 select-none">
            {(['chat', 'voice', 'screen', 'settings'] as const).map((m) => {
              const isActive = mode === m
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-[10px] font-semibold flex items-center justify-center gap-1 border-b-2 transition-all capitalize ${
                    isActive
                      ? 'border-indigo-500 text-white bg-white/5'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {m === 'chat' && <MessageSquare size={11} />}
                  {m === 'voice' && <Mic size={11} />}
                  {m === 'screen' && <Camera size={11} />}
                  {m === 'settings' && <Settings size={11} />}
                  {m}
                </button>
              )
            })}
          </div>

          {/* Render children component */}
          <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        </div>
      )}
    </div>
  )
}
