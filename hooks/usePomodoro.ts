"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Task, Session, Settings } from "@/contexts/PomodoroContext"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Custom hook that encapsulates all Pomodoro timer logic and state management
 * Now with Supabase integration for data persistence and sync
 */
export const usePomodoroLogic = () => {
  const { user } = useAuth()
  const supabase = getSupabaseClient()

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

  // Loading state for data sync
  const [dataLoading, setDataLoading] = useState(false)

  // Refs for audio, notifications, and timing
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const notificationPermissionRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const totalDurationRef = useRef<number>(0)

  // Router for navigation
  const router = useRouter()

  /**
   * Load user data from Supabase when user logs in
   */
  const loadUserData = useCallback(async () => {
    if (!user) return

    setDataLoading(true)

    try {
      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (settingsData && !settingsError) {
        setSettings({
          workDuration: settingsData.work_duration,
          breakDuration: settingsData.break_duration,
          longBreakDuration: settingsData.long_break_duration,
          sessionsUntilLongBreak: settingsData.sessions_until_long_break,
          soundEnabled: settingsData.sound_enabled,
          soundVolume: settingsData.sound_volume,
          autoStartBreaks: settingsData.auto_start_breaks,
          autoStartWork: settingsData.auto_start_work,
        })
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true })

      if (tasksData && !tasksError) {
        setTasks(
          tasksData.map((t) => ({
            id: t.id,
            name: t.name,
            completed: t.completed,
            createdAt: t.created_at,
            completedAt: t.completed_at,
          })),
        )
      }

      // Load recent sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(100)

      if (sessionsData && !sessionsError) {
        setSessions(
          sessionsData.map((s) => ({
            task: s.task,
            duration: s.duration,
            completedAt: s.completed_at,
            date: s.date,
          })),
        )

        // Calculate completed tasks count
        const completedCount = sessionsData.length
        setCompletedTasks(completedCount)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setDataLoading(false)
    }
  }, [user, supabase])

  /**
   * Load user data when user changes
   */
  useEffect(() => {
    if (user) {
      loadUserData()
    } else {
      // Reset state when user logs out
      setTasks([])
      setSessions([])
      setCompletedTasks(0)
      setSettings({
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        soundEnabled: true,
        soundVolume: 0.5,
        autoStartBreaks: true,
        autoStartWork: false,
      })
    }
  }, [user, loadUserData])

  /**
   * Reset timer to current session duration when session type or settings change
   */
  const resetTimerToCurrentSession = useCallback(() => {
    setIsRunning(false)
    startTimeRef.current = null

    let duration: number
    if (sessionType === "work") {
      duration = settings.workDuration * 60
    } else if (sessionType === "shortBreak") {
      duration = settings.breakDuration * 60
    } else {
      duration = settings.longBreakDuration * 60
    }

    setTime(duration)
    totalDurationRef.current = duration
  }, [sessionType, settings])

  // Timer actions
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      // Pausing - clear the start time
      startTimeRef.current = null
    } else {
      // Starting - set the start time accounting for already elapsed time
      const elapsedTime = totalDurationRef.current - time
      startTimeRef.current = Date.now() - elapsedTime * 1000
    }
    setIsRunning((prev) => !prev)
  }, [isRunning, time])

  const resetTimer = useCallback(() => {
    resetTimerToCurrentSession()
  }, [resetTimerToCurrentSession])

  /**
   * Initialize audio context and request notification permissions
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.log("Audio context not available:", error)
      }

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
  const handleTimerComplete = useCallback(async () => {
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

      // Save session to Supabase
      if (user) {
        try {
          await supabase.from("sessions").insert({
            user_id: user.id,
            task: session.task,
            duration: session.duration,
            date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
          })
        } catch (error) {
          console.error("Error saving session:", error)
        }
      }

      // Mark selected task as completed
      if (selectedTaskId && user) {
        try {
          await supabase
            .from("tasks")
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq("id", selectedTaskId)
            .eq("user_id", user.id)

          setTasks((prev) =>
            prev.map((task) =>
              task.id === selectedTaskId ? { ...task, completed: true, completedAt: new Date().toISOString() } : task,
            ),
          )
          setSelectedTaskId(null)
          setCurrentTask("")
        } catch (error) {
          console.error("Error updating task:", error)
        }
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
  }, [sessionType, currentTask, settings, sessionCount, selectedTaskId, playSound, user, supabase])

  /**
   * Main timer countdown effect - uses timestamp-based calculation to handle tab switching
   */
  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - startTimeRef.current!) / 1000)
        const remainingTime = Math.max(0, totalDurationRef.current - elapsedSeconds)

        setTime(remainingTime)

        if (remainingTime <= 0) {
          setIsRunning(false)
          startTimeRef.current = null
          handleTimerComplete()
        }
      }, 100) // Update more frequently for smoother display
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
   * Handle visibility change to keep timer running in background
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunning && startTimeRef.current) {
        // Recalculate time when tab becomes visible again
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000)
        const remainingTime = Math.max(0, totalDurationRef.current - elapsedSeconds)

        setTime(remainingTime)

        if (remainingTime <= 0) {
          setIsRunning(false)
          startTimeRef.current = null
          handleTimerComplete()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
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

  // Task management actions with Supabase sync
  const addTask = useCallback(async () => {
    if (newTaskInput.trim() && user) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            name: newTaskInput.trim(),
            position: tasks.length,
          })
          .select()
          .single()

        if (data && !error) {
          const newTask: Task = {
            id: data.id,
            name: data.name,
            completed: false,
            createdAt: data.created_at,
          }
          setTasks((prev) => [...prev, newTask])
          setNewTaskInput("")
        }
      } catch (error) {
        console.error("Error adding task:", error)
      }
    }
  }, [newTaskInput, user, tasks.length, supabase])

  const deleteTask = useCallback(
    async (taskId: number) => {
      if (user) {
        try {
          await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id)

          setTasks((prev) => prev.filter((task) => task.id !== taskId))

          // Clear current task if it's being deleted
          if (selectedTaskId === taskId) {
            setCurrentTask("")
            setSelectedTaskId(null)
          }
        } catch (error) {
          console.error("Error deleting task:", error)
        }
      }
    },
    [selectedTaskId, user, supabase],
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

  const updateTaskOrder = useCallback(
    async (newTasks: Task[]) => {
      setTasks(newTasks)

      if (user) {
        try {
          // Update positions in database
          const updates = newTasks.map((task, index) => ({
            id: task.id,
            position: index,
          }))

          for (const update of updates) {
            await supabase
              .from("tasks")
              .update({ position: update.position })
              .eq("id", update.id)
              .eq("user_id", user.id)
          }
        } catch (error) {
          console.error("Error updating task order:", error)
        }
      }
    },
    [user, supabase],
  )

  const updateSettings = useCallback(
    async (newSettings: Settings | ((prev: Settings) => Settings)) => {
      const settingsToUpdate = typeof newSettings === "function" ? newSettings(settings) : newSettings

      // Update local state immediately
      setSettings(settingsToUpdate)

      // Save to Supabase
      if (user) {
        try {
          // First, try to check if settings exist
          const { data: existingSettings } = await supabase
            .from("settings")
            .select("user_id")
            .eq("user_id", user.id)
            .single()

          const settingsData = {
            user_id: user.id,
            work_duration: settingsToUpdate.workDuration,
            break_duration: settingsToUpdate.breakDuration,
            long_break_duration: settingsToUpdate.longBreakDuration,
            sessions_until_long_break: settingsToUpdate.sessionsUntilLongBreak,
            sound_enabled: settingsToUpdate.soundEnabled,
            sound_volume: settingsToUpdate.soundVolume,
            auto_start_breaks: settingsToUpdate.autoStartBreaks,
            auto_start_work: settingsToUpdate.autoStartWork,
          }

          let error

          if (existingSettings) {
            // Update existing settings
            const result = await supabase.from("settings").update(settingsData).eq("user_id", user.id)
            error = result.error
          } else {
            // Insert new settings
            const result = await supabase.from("settings").insert(settingsData)
            error = result.error
          }

          if (error) {
            console.error("Error updating settings:", error)
            throw error
          }
        } catch (error) {
          console.error("Error updating settings:", error)
          // Revert local state on error
          setSettings(settings)
          throw error
        }
      }

      return settingsToUpdate
    },
    [user, supabase, settings],
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
    dataLoading,

    // Actions
    toggleTimer,
    resetTimer,
    setNewTaskInput,
    addTask,
    deleteTask,
    selectTask,
    setSettings: updateSettings,
    setTasks: updateTaskOrder,
  }
}
