"use client"

import type React from "react"
import { PomodoroContext } from "@/contexts/PomodoroContext"
import { usePomodoroLogic } from "@/hooks/usePomodoro"

interface PomodoroProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that wraps the app and provides Pomodoro context
 * Uses the usePomodoroLogic hook to manage all state and logic
 */
export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children }) => {
  const pomodoroState = usePomodoroLogic()

  return <PomodoroContext.Provider value={pomodoroState}>{children}</PomodoroContext.Provider>
}
