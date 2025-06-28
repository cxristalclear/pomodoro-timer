"use client"

import type React from "react"
import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { formatTime } from "@/lib/utils"
import Link from "next/link"

/**
 * Main timer display component showing the countdown, controls, and session info
 */
export const TimerDisplay: React.FC = () => {
  const { time, isRunning, sessionType, sessionCount, currentTask, completedTasks, settings, toggleTimer, resetTimer } =
    usePomodoro()

  const router = useRouter()

  /**
   * Get display text for current session
   */
  const getSessionDisplay = () => {
    if (sessionType === "shortBreak") return "[short break]"
    if (sessionType === "longBreak") return "[long break]"
    return currentTask || "[select task]"
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
        <button
          onClick={() => sessionType === "work" && router.push("/tasks")}
          className={`text-gray-500 mb-8 text-sm transition-colors ${
            sessionType === "work" ? "hover:text-gray-300 cursor-pointer" : "cursor-default"
          }`}
          disabled={sessionType !== "work"}
        >
          {getSessionDisplay()}
        </button>

        {/* Timer display */}
        <div className="text-8xl md:text-9xl font-thin mb-16 tracking-wider font-mono">{formatTime(time)}</div>

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
      </main>
    </div>
  )
}
