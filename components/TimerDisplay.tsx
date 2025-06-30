"use client"

import type React from "react"
import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { formatTime } from "@/lib/utils"
import Link from "next/link"
import { useTimerShortcuts } from "@/hooks/useTimerShortcuts"

/**
 * Main timer display component showing the countdown, controls, and session info
 */
export const TimerDisplay: React.FC = () => {
  const {
    time,
    isRunning,
    sessionType,
    sessionCount,
    currentTask,
    completedTasks,
    settings,
    toggleTimer,
    resetTimer,
    nextTask,
    previousTask,
    skipToNextSession,
    previousSessionType,
    incrementTime,
    decrementTime,
    toggleFullscreen,
    toggleNotifications,
    toggleMute,
    tasks,
    selectedTaskId,
  } = usePomodoro()

  const router = useRouter()

  // Reset all (timer + session count)
  const resetAll = () => {
    resetTimer();
    // Optionally reset session count if you have a setter
    // setSessionCount(1);
    // If you want to reset sessionCount, expose setSessionCount from context
  }

  // Timer shortcuts integration
  const { shortcuts, showShortcuts, setShowShortcuts } = useTimerShortcuts({
    toggleTimer,
    resetTimer,
    skipToNextSession,
    resetAll,
    nextTask,
    previousTask,
    previousSessionType,
    incrementTime,
    decrementTime,
    toggleFullscreen,
    toggleNotifications,
    toggleMute,
  })

  // Debug logging
  console.log("TimerDisplay - currentTask:", currentTask, "selectedTaskId:", selectedTaskId, "tasks:", tasks.length)
  console.log("TimerDisplay - time:", time, "isRunning:", isRunning, "sessionType:", sessionType)
  console.log("TimerDisplay - settings:", settings)

  // Get display time based on mode
  const getDisplayTime = () => {
    console.log("getDisplayTime - timerDisplayMode:", settings.timerDisplayMode, "time:", time)
    // For now, always show countdown mode since we removed elapsed mode
    // In the future, we can add analog mode support here
    console.log("getDisplayTime - countdown:", time)
    return time;
  };

  /**
   * Get display text for current session
   */
  const getSessionDisplay = () => {
    if (sessionType === "shortBreak") return "[short break]"
    if (sessionType === "longBreak") return "[long break]"
    return currentTask || "[no task selected]"
  }

  /**
   * Get the current task display with proper styling
   */
  const getCurrentTaskDisplay = () => {
    if (sessionType === "shortBreak") return "[short break]"
    if (sessionType === "longBreak") return "[long break]"
    
    // Use currentTask if available, otherwise try to find the selected task
    let taskName = currentTask
    if (!taskName && selectedTaskId) {
      const selectedTask = tasks.find(task => task.id === selectedTaskId)
      taskName = selectedTask?.name || ""
    }
    
    if (taskName) {
      return taskName
    }
    
    if (tasks.length === 0) {
      return "[no tasks available]"
    }
    
    return "[select a task]"
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with session info and menu */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">
            session {Math.ceil(sessionCount / settings.sessionsUntilLongBreak)}.
            {((sessionCount - 1) % settings.sessionsUntilLongBreak) + 1}
          </span>
          <span className="text-gray-500 text-sm">[{completedTasks} completed tasks]</span>
        </div>
        <Link
          href="/menu"
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </Link>
      </header>

      {/* Main timer display */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Current task/session indicator */}
        <div className="mb-8 text-center">
          <button
            onClick={() => sessionType === "work" && router.push("/tasks")}
            className={`text-gray-400 mb-2 text-lg transition-colors ${
              sessionType === "work" ? "hover:text-gray-200 cursor-pointer" : "cursor-default"
            }`}
            disabled={sessionType !== "work"}
          >
            {getCurrentTaskDisplay()}
          </button>
          {sessionType === "work" && (
            <div className="text-xs text-gray-600">
              
            </div>
          )}
        </div>

        {/* Timer display */}
        <div className="text-8xl md:text-9xl font-thin mb-16 tracking-wider font-mono">{formatTime(getDisplayTime())}</div>

        {/* Control buttons */}
        <div className="flex items-center gap-8">
          <button
            onClick={toggleTimer}
            className="text-gray-600 hover:text-white transition-colors text-2xl"
            title={isRunning ? "Pause" : "Start"}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? "||" : "▶"}
          </button>
          <button
            onClick={resetTimer}
            className="text-gray-600 hover:text-white transition-colors text-xl"
            title="Reset Timer"
            aria-label="Reset timer"
          >
            ↺
          </button>
        </div>

        {/* Minimal timer shortcuts popout */}
        {showShortcuts && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setShowShortcuts(false)}
            style={{ backdropFilter: 'blur(2px)' }}
          >
            <div
              className="bg-gray-900 text-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw] border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4 text-center">Timer Shortcuts</h2>
              <ul className="space-y-2">
                {shortcuts.map((s, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">{s.keys}</span>
                    <span className="text-gray-200">{s.description}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-center text-xs text-gray-500">Press <span className="font-mono">Escape</span> to close</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
