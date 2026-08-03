// Keyboard shortcuts hook for Pomodoro
import { useEffect, useState } from "react"

// Shortcut metadata for the help modal. Hoisted out of the hook so callers that
// only want the list (e.g. a help page) can read it without mounting a second
// window listener — see #6.
export const GLOBAL_SHORTCUTS = [
  { keys: 'Space', description: 'Start/Pause Timer' },
  { keys: '→', description: 'Complete Task & Next Session' },
  { keys: '↓', description: 'Skip to Next Session' },
  { keys: 'Ctrl+R', description: 'Reset Timer' },
  { keys: 'Ctrl+T', description: 'Go to Tasks' },
  { keys: 'Ctrl+A', description: 'Go to Analytics' },
  { keys: 'Ctrl+S', description: 'Go to Settings' },
  { keys: 'Ctrl+M', description: 'Go to Menu' },
  { keys: 'Ctrl+H', description: 'Go to Help' },
  { keys: 'Ctrl+/', description: 'Show Keyboard Shortcuts' },
  { keys: 'Escape', description: 'Close Modal/Dialog or Go Back' },
]

export function useKeyboardShortcuts(actions: Record<string, () => void>, disableShortcutsModal = false) {
  // State for showing the shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Keyboard shortcut logic migrated from main hook
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if ((e.target as HTMLElement).tagName === "INPUT") return

      if (e.code === "Space" && actions.toggleTimer) {
        e.preventDefault()
        actions.toggleTimer()
      }

      if (e.code === "ArrowRight" && actions.nextTask) {
        e.preventDefault()
        actions.nextTask()
      }

      if (e.code === "ArrowDown" && actions.skipToNextSession) {
        e.preventDefault()
        actions.skipToNextSession()
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "r":
            if (actions.resetTimer) {
              e.preventDefault()
              actions.resetTimer()
            }
            break
          case "t":
            if (actions.goTasks) {
              e.preventDefault()
              actions.goTasks()
            }
            break
          case "a":
            if (actions.goAnalytics) {
              e.preventDefault()
              actions.goAnalytics()
            }
            break
          case "s":
            if (actions.goSettings) {
              e.preventDefault()
              actions.goSettings()
            }
            break
          case "m":
            if (actions.goMenu) {
              e.preventDefault()
              actions.goMenu()
            }
            break
          case "h":
            // Prioritize navigation to help page over modal
            if (actions.goHelp) {
              e.preventDefault()
              actions.goHelp()
            } else if (!disableShortcutsModal) {
              e.preventDefault()
              setShowShortcuts(true)
            }
            break
          case "/":
            // Only show shortcuts modal if not disabled
            if (!disableShortcutsModal) {
              e.preventDefault()
              setShowShortcuts(true)
            }
            break
        }
      }
      // Escape closes modal/dialog or goes back
      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false)
        } else if (actions.closeModalOrBack) {
          actions.closeModalOrBack()
        }
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [actions, showShortcuts, disableShortcutsModal])

  return { shortcuts: GLOBAL_SHORTCUTS, showShortcuts, setShowShortcuts }
}
