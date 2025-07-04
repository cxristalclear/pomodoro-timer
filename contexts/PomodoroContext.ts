"use client"

import { createContext, useContext } from "react"

export type TaskPriority = "high" | "medium" | "low"

export interface Task {
  id: number
  name: string
  completed: boolean
  position: number
  estimatedPomodoros: number
  actualPomodoros: number
  createdAt: string
  completedAt?: string
  
  // Enhanced fields now available in your database
  category?: string
  priority?: TaskPriority
  dueDate?: string
  notes?: string
  isArchived: boolean
  parentTaskId?: number
}

export interface Session {
  id?: number
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
  timerDisplayMode?: "digital" | "analog" | "countdown"
}

// Enhanced filter and search interfaces
export interface TaskFilters {
  category?: string
  priority?: TaskPriority
  archived?: boolean
  completed?: boolean
  parentTaskId?: number
  searchQuery?: string
  dueDateFrom?: string
  dueDateTo?: string
}

export interface BulkTaskUpdate {
  taskIds: number[]
  updates: Partial<Pick<Task, 'category' | 'priority' | 'completed' | 'isArchived' | 'notes'>>
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

  // Enhanced task state
  taskFilters: TaskFilters
  selectedTasks: number[]  // For bulk operations
  bulkEditMode: boolean

  // Session tracking
  sessions: Session[]
  loadSessions: () => Promise<void>

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

  // Basic task actions (existing)
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
  clearSelection: () => void

  // Enhanced task actions (new)
  addTaskWithDetails: (taskDetails: Partial<Task>) => Promise<void>
  bulkUpdateTasks: (bulkUpdate: BulkTaskUpdate) => Promise<void>
  archiveTask: (taskId: number) => Promise<void>
  unarchiveTask: (taskId: number) => Promise<void>
  searchTasks: (query: string) => void
  filterTasks: (filters: TaskFilters) => void
  clearFilters: () => void
  toggleTaskSelection: (taskId: number) => void
  selectAllTasks: () => void
  clearTaskSelection: () => void
  toggleBulkEditMode: () => void
  
  // Category management
  getAvailableCategories: () => string[]
  createCategory: (category: string) => void
  
  // Task hierarchy
  getSubtasks: (parentId: number) => Task[]
  createSubtask: (parentId: number, taskDetails: Partial<Task>) => Promise<void>

  // Settings actions
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void
  updateSettings: (settings: Settings | ((prev: Settings) => Settings)) => Promise<void>
  
  // Audio/Notifications
  testSound: () => void
  requestNotificationPermission: () => void
  areNotificationsEnabled: () => boolean
  sendNotification: (title: string, options?: NotificationOptions) => void
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
