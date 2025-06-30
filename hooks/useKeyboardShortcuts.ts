// Keyboard shortcuts hook for Pomodoro
import { useEffect } from "react"

export function useKeyboardShortcuts(actions: Record<string, () => void>) {
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
        }
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [actions])

  // Return info about shortcuts for UI display
  const shortcuts = [
    { keys: 'Space', description: 'Start/Pause Timer' },
    { keys: '→', description: 'Complete Task & Next Session' },
    { keys: 'Ctrl+R', description: 'Reset Timer' },
    { keys: 'Ctrl+T', description: 'Go to Tasks' },
    { keys: 'Ctrl+A', description: 'Go to Analytics' },
    { keys: 'Ctrl+S', description: 'Go to Settings' },
    { keys: 'Ctrl+M', description: 'Go to Menu' },
  ]

  return { shortcuts }
}
