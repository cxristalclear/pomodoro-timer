import { useEffect, useState } from "react"

type TimerShortcutActions = {
  toggleTimer?: () => void
  resetTimer?: () => void
  skipToNextSession?: () => void
  resetAll?: () => void
  nextTask?: () => void
  previousTask?: () => void
  previousSessionType?: () => void
  incrementTime?: (seconds: number) => void
  decrementTime?: (seconds: number) => void
  toggleFullscreen?: () => void
  toggleNotifications?: () => void
  toggleMute?: () => void
}

export function useTimerShortcuts(actions: TimerShortcutActions) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if ((e.target as HTMLElement).tagName === "INPUT") return

      // Unmodified shortcuts must not fire when Ctrl/Cmd/Alt is held, or they
      // double up with the Ctrl-based navigation shortcuts in
      // useKeyboardShortcuts (both hooks listen on window at once on "/").
      // Ctrl+S in particular used to reach `skipToNextSession`, which persists
      // a session row and increments pomodoros — a silent write on a keystroke
      // the user pressed to open Settings.
      // Shift is deliberately excluded: the +/- handlers below read it.
      const isModified = e.ctrlKey || e.metaKey || e.altKey

      // Start/Pause timer
      if (!isModified && (e.code === "Space" || e.code === "Enter") && actions.toggleTimer) {
        e.preventDefault()
        actions.toggleTimer()
      }
      // Reset current session
      if (!isModified && e.key === "r" && actions.resetTimer) {
        e.preventDefault()
        actions.resetTimer()
      }
      // Skip to next session
      if (!isModified && e.key === "s" && actions.skipToNextSession) {
        e.preventDefault()
        actions.skipToNextSession()
      }
      // Reset all (timer + session count)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r" && actions.resetAll) {
        e.preventDefault()
        actions.resetAll()
      }
      // Next task
      if (!isModified && e.key === "ArrowRight" && actions.nextTask) {
        e.preventDefault()
        actions.nextTask()
      }
      // Previous task
      if (!isModified && e.key === "ArrowLeft" && actions.previousTask) {
        e.preventDefault()
        actions.previousTask()
      }
      // Next session type
      if (!isModified && e.key === "ArrowDown" && actions.skipToNextSession) {
        e.preventDefault()
        actions.skipToNextSession()
      }
      // Previous session type
      if (!isModified && e.key === "ArrowUp" && actions.previousSessionType) {
        e.preventDefault()
        actions.previousSessionType()
      }
      // Increase timer (guarded so Ctrl+= / Cmd+= stays browser zoom)
      if (!isModified && (e.key === "+" || e.key === "=") && actions.incrementTime) {
        e.preventDefault()
        if (e.shiftKey) {
          actions.incrementTime(300) // 5 min
        } else {
          actions.incrementTime(60) // 1 min
        }
      }
      // Decrease timer (guarded so Ctrl+- / Cmd+- stays browser zoom)
      if (!isModified && e.key === "-" && actions.decrementTime) {
        e.preventDefault()
        if (e.shiftKey) {
          actions.decrementTime(300) // 5 min
        } else {
          actions.decrementTime(60) // 1 min
        }
      }
      // Toggle fullscreen/focus mode
      if (!isModified && e.key.toLowerCase() === "f" && actions.toggleFullscreen) {
        e.preventDefault()
        actions.toggleFullscreen()
      }
      // Toggle notifications
      if (!isModified && e.key.toLowerCase() === "n" && actions.toggleNotifications) {
        e.preventDefault()
        actions.toggleNotifications()
      }
      // Mute/Unmute sounds
      if (!isModified && e.key.toLowerCase() === "m" && actions.toggleMute) {
        e.preventDefault()
        actions.toggleMute()
      }
      // Show shortcuts popout
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "h" || e.key === "/")) {
        e.preventDefault()
        setShowShortcuts(true)
      }
      // Escape closes shortcuts popout
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false)
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [actions, showShortcuts])

  // Timer-specific shortcuts for popout
  const shortcuts = [
    { keys: 'Space / Enter', description: 'Start/Pause Timer' },
    { keys: 'R', description: 'Reset Current Session' },
    { keys: 'S', description: 'Skip to Next Session' },
    { keys: 'Ctrl+R', description: 'Reset All (Timer + Session Count)' },
    { keys: '→', description: 'Next Task' },
    { keys: '←', description: 'Previous Task' },
    { keys: '↓', description: 'Next Session Type' },
    { keys: '↑', description: 'Previous Session Type' },
    { keys: '+ / -', description: 'Increase/Decrease Timer by 1 min' },
    { keys: 'Shift + +/-', description: 'Increase/Decrease Timer by 5 min' },
    { keys: 'F', description: 'Toggle Fullscreen/Focus Mode' },
    { keys: 'M', description: 'Mute/Unmute Sounds' },
    { keys: 'Ctrl+H / Ctrl+/', description: 'Show Keyboard Shortcuts' },
    { keys: 'Escape', description: 'Close Shortcuts Popout' },
  ]

  return { shortcuts, showShortcuts, setShowShortcuts }
} 