"use client"

import { createContext, useContext } from "react"

export interface Task {
  id: number
  name: string
  completed: boolean
  estimatedPomodoros: number
  actualPomodoros: number
  createdAt: string
  completedAt?: string
}

export interface Session {
  task: string
  taskId?: number
  duration: number
  completedAt: string
  date: string
}

export interface Settings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  soundEnabled: boolean
  soundVolume: number
  autoStartBreaks: boolean
  autoStartWork: boolean
  timerDisplayMode?: "digital" | "analog"
}

export interface PomodoroContextType {
  // Timer state
  time: number
  isRunning: boolean
  sessionType: "work" | "shortBreak" | "longBreak"
  sessionCount: number

  // Task state
  currentTask: string
  selectedTaskId: number | null
  completedTasks: number
  tasks: Task[]
  newTaskInput: string

  // Session tracking
  sessions: Session[]

  // Settings
  settings: Settings

  // Loading state
  dataLoading: boolean

  // Timer actions
  toggleTimer: () => void
  resetTimer: () => void
  skipToNextSession: () => void
  previousTask: () => void
  previousSessionType: () => void
  incrementTime: (seconds: number) => void
  decrementTime: (seconds: number) => void
  toggleFullscreen: () => void
  toggleNotifications: () => void
  toggleMute: () => void

  // Task actions
  setNewTaskInput: (input: string) => void
  addTask: () => void
  deleteTask: (taskId: number) => void
  selectTask: (task: Task) => Promise<void>
  selectTaskAndNavigate: (task: Task) => Promise<void>
  toggleTaskCompletion: (taskId: number) => void
  nextTask: () => void
  updateTask: (taskId: number, updates: Partial<Task>) => void
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  incrementTaskPomodoros: (taskId: number) => Promise<void>
  getTaskStats: () => Promise<{
    totalTasks: number
    completedTasks: number
    totalPomodoros: number
    avgPomodorosPerTask: number
  }>
  loadTasks: () => Promise<void>

  // Settings actions
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void
  updateSettings: (settings: Settings | ((prev: Settings) => Settings)) => Promise<void>
}

export const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

/**
 * Custom hook to access the Pomodoro context
 * Throws an error if used outside of PomodoroProvider
 */
export function usePomodoro() {
  const context = useContext(PomodoroContext)
  if (context === undefined) {
    throw new Error("usePomodoro must be used within a PomodoroProvider")
  }
  return context
}
