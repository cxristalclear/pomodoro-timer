"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Task, Session, Settings } from "@/contexts/PomodoroContext"
import { useRouter } from "next/navigation"

/**
 * Custom hook that encapsulates all Pomodoro timer logic and state management
 * Handles timer functionality, task management, session tracking, and settings
 */
export const usePomodoroLogic = () => {
  // Core timer state
  const [time, setTime] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionType, setSessionType] = useState<"work" | "shortBreak" | "longBreak">("work")
  const [sessionCount, setSessionCount] = useState(1)

  // Task management state
  const [currentTask, setCurrentTask] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [completedTasks, setCompletedTasks] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskInput, setNewTaskInput] = useState("")

  // Session tracking
  const [sessions, setSessions] = useState<Session[]>([])

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    soundVolume: 0.5,
    autoStartBreaks: true,
    autoStartWork: false,
  })

  // Refs for audio and notifications
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const notificationPermissionRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Router for navigation
  const router = useRouter()

  /**
   * Reset timer to current session duration when session type or settings change
   */
  const resetTimerToCurrentSession = useCallback(() => {
    setIsRunning(false)
    if (sessionType === "work") {
      setTime(settings.workDuration * 60)
    } else if (sessionType === "shortBreak") {
      setTime(settings.breakDuration * 60)
    } else {
      setTime(settings.longBreakDuration * 60)
    }
  }, [sessionType, settings])

  // Timer actions
  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  const resetTimer = useCallback(() => {
    resetTimerToCurrentSession()
  }, [resetTimerToCurrentSession])

  /**
   * Initialize audio context and request notification permissions
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          notificationPermissionRef.current = permission === "granted"
        })
      } else if (Notification.permission === "granted") {
        notificationPermissionRef.current = true
      }
    }
  }, [])

  /**
   * Update timer when session type or settings change
   */
  useEffect(() => {
    resetTimerToCurrentSession()
  }, [
    sessionType,
    settings.workDuration,
    settings.breakDuration,
    settings.longBreakDuration,
    resetTimerToCurrentSession,
  ])

  /**
   * Play notification sound when timer completes
   */
  const playSound = useCallback(
    (type: "work" | "shortBreak" | "longBreak") => {
      if (!settings.soundEnabled || !audioContextRef.current) return

      try {
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)

        gainNode.gain.value = settings.soundVolume
        oscillator.frequency.value = type === "work" ? 800 : 600
        oscillator.start()
        oscillator.stop(audioContextRef.current.currentTime + (type === "work" ? 0.3 : 0.2))
      } catch (error) {
        console.log("Audio playback failed:", error)
      }
    },
    [settings.soundEnabled, settings.soundVolume],
  )

  /**
   * Handle timer completion - play sound, send notification, log session, switch session type
   */
  const handleTimerComplete = useCallback(() => {
    const taskName =
      sessionType === "work"
        ? currentTask || "Work Session"
        : sessionType === "shortBreak"
          ? "Short Break"
          : "Long Break"

    // Play completion sound
    playSound(sessionType)

    // Send browser notification
    if (typeof window !== "undefined" && notificationPermissionRef.current) {
      new Notification("Pomodoro Timer", {
        body: `${taskName} completed!`,
        icon: "/favicon.ico",
      })
    }

    // Log completed work sessions
    if (sessionType === "work") {
      const session: Session = {
        task: currentTask || "Untitled Task",
        duration: settings.workDuration,
        completedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
      }
      setSessions((prev) => [...prev, session])
      setCompletedTasks((prev) => prev + 1)

      // Mark selected task as completed
      if (selectedTaskId) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === selectedTaskId ? { ...task, completed: true, completedAt: new Date().toISOString() } : task,
          ),
        )
        setSelectedTaskId(null)
        setCurrentTask("")
      }
    }

    // Switch to next session type
    if (sessionType === "work") {
      const nextSessionType = sessionCount % settings.sessionsUntilLongBreak === 0 ? "longBreak" : "shortBreak"
      setSessionType(nextSessionType)

      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000)
      }
    } else {
      setSessionType("work")
      setSessionCount((prev) => prev + 1)

      if (settings.autoStartWork) {
        setTimeout(() => setIsRunning(true), 1000)
      }
    }
  }, [sessionType, currentTask, settings, sessionCount, selectedTaskId, playSound])

  /**
   * Main timer countdown effect
   */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false)
            handleTimerComplete()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, handleTimerComplete])

  /**
   * Global keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if ((e.target as HTMLElement).tagName === "INPUT") return

      if (e.code === "Space") {
        e.preventDefault()
        toggleTimer()
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "r":
            e.preventDefault()
            resetTimerToCurrentSession()
            break
          case "t":
            e.preventDefault()
            router.push("/tasks")
            break
          case "a":
            e.preventDefault()
            router.push("/analytics")
            break
          case "s":
            e.preventDefault()
            router.push("/settings")
            break
          case "m":
            e.preventDefault()
            router.push("/menu")
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [toggleTimer, resetTimerToCurrentSession, router])

  // Task management actions
  const addTask = useCallback(() => {
    if (newTaskInput.trim()) {
      const newTask: Task = {
        id: Date.now(),
        name: newTaskInput.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      }
      setTasks((prev) => [...prev, newTask])
      setNewTaskInput("")
    }
  }, [newTaskInput])

  const deleteTask = useCallback(
    (taskId: number) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      // Clear current task if it's being deleted
      if (selectedTaskId === taskId) {
        setCurrentTask("")
        setSelectedTaskId(null)
      }
    },
    [selectedTaskId],
  )

  const selectTask = useCallback(
    (task: Task) => {
      setCurrentTask(task.name)
      setSelectedTaskId(task.id)
      setSessionType("work")
      router.push("/")
    },
    [router],
  )

  return {
    // State
    time,
    isRunning,
    sessionType,
    sessionCount,
    currentTask,
    selectedTaskId,
    completedTasks,
    tasks,
    newTaskInput,
    sessions,
    settings,

    // Actions
    toggleTimer,
    resetTimer,
    setNewTaskInput,
    addTask,
    deleteTask,
    selectTask,
    setSettings,
    setTasks,
  }
}
