"use client"

import type React from "react"
import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { formatTime } from "@/lib/utils"
import { CompactTaskProgress, ReadyToCompleteBadge } from "@/components/TaskProgressIndicator"
import Link from "next/link"
import { useTimerShortcuts } from "@/hooks/useTimerShortcuts"
import { useEffect, useState, useRef } from "react"

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
    toggleMute,
    tasks,
    selectedTaskId,
    loadTasks,
    toggleTaskCompletion,
    selectTask,
    clearSelection,
  } = usePomodoro()

  const router = useRouter()

  const [showPostSessionActions, setShowPostSessionActions] = useState(false);
  const postSessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    toggleMute,
  })

  // Get display time based on mode
  const getDisplayTime = () => {
    if (settings.timerDisplayMode === "elapsed") {
      // Calculate elapsed time (how much time has passed)
      const sessionDuration = sessionType === "work" 
        ? settings.workDuration * 60
        : sessionType === "shortBreak" 
        ? settings.breakDuration * 60 
        : settings.longBreakDuration * 60;
      
      return sessionDuration - time;
    }
    
    // Default to countdown mode (time remaining)
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

  useEffect(() => {
    if (typeof window !== 'undefined' && loadTasks) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for session completion and show modal if ready
  useEffect(() => {
    if (!isRunning && sessionType === "work" && selectedTaskId) {
      const currentTaskObj = tasks.find(task => task.id === selectedTaskId);
      if (
        currentTaskObj &&
        currentTaskObj.actualPomodoros >= currentTaskObj.estimatedPomodoros &&
        currentTaskObj.estimatedPomodoros > 0 &&
        !currentTaskObj.completed
      ) {
        // Delay modal to avoid race with state updates
        if (postSessionTimeoutRef.current) clearTimeout(postSessionTimeoutRef.current);
        postSessionTimeoutRef.current = setTimeout(() => setShowPostSessionActions(true), 500);
      }
    }
    // Cleanup on unmount
    return () => {
      if (postSessionTimeoutRef.current) clearTimeout(postSessionTimeoutRef.current);
    };
  }, [isRunning, sessionType, selectedTaskId, tasks]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with session info and menu */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">
            session {Math.ceil(sessionCount / settings.sessionsUntilLongBreak)}.
            {((sessionCount - 1) % settings.sessionsUntilLongBreak) + 1}
          </span>
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
          {sessionType === "work" && selectedTaskId && (
            <div className="flex justify-center mt-2">
              {(() => {
                const currentTaskObj = tasks.find(task => task.id === selectedTaskId);
                return currentTaskObj ? (
                  <CompactTaskProgress task={currentTaskObj} className="text-gray-500" />
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Timer display */}
        <div className="text-8xl md:text-9xl font-thin mb-8 tracking-wider font-mono">{formatTime(getDisplayTime())}</div>

        {/* Ready to Complete Badge for Current Task */}
        {sessionType === "work" && selectedTaskId && (
          <div className="mb-8 flex justify-center">
            {(() => {
              const currentTaskObj = tasks.find(task => task.id === selectedTaskId);
              return currentTaskObj ? (
                <ReadyToCompleteBadge task={currentTaskObj} />
              ) : null;
            })()}
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center gap-8">
          <button
            onClick={toggleTimer}
            className="text-gray-600 hover:text-white transition-colors"
            title={isRunning ? "Pause" : "Start"}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="text-gray-600 hover:text-white transition-colors"
            title="Reset Timer"
            aria-label="Reset timer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
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

        {/* Post-Session Quick Actions Modal */}
        {showPostSessionActions && selectedTaskId && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 min-w-[300px] max-w-[90vw]">
              <h3 className="text-white text-lg mb-4 text-center">Great work! 🍅</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowPostSessionActions(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
                >
                  Continue Task
                </button>
                <button
                  onClick={async () => {
                    const currentTaskObj = tasks.find(task => task.id === selectedTaskId);
                    if (currentTaskObj) {
                      // Complete the current task
                      await toggleTaskCompletion(currentTaskObj.id);
                      
                      // Find the next available (incomplete) task
                      const incompleteTasks = tasks.filter(task => task.id !== currentTaskObj.id && !task.completed);
                      
                      if (incompleteTasks.length > 0) {
                        // Select the first available incomplete task
                        const nextTask = incompleteTasks[0];
                        await selectTask(nextTask);
                      } else {
                        // No more tasks available - clear selection to show "[select a task]"
                        clearSelection();
                      }
                    }
                    setShowPostSessionActions(false);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
                >
                  ✓ Complete & Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
