// Timer logic for Pomodoro
// Handles timer state, countdown, start/pause/reset, session switching
import { useState, useRef, useCallback, useEffect } from "react"

export function useTimer({
  initialDuration,
  sessionType,
  onComplete,
  autoStart = false,
}: {
  initialDuration: number
  sessionType: "work" | "shortBreak" | "longBreak"
  onComplete: () => void
  autoStart?: boolean
}) {
  const [time, setTime] = useState(initialDuration)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const endTimeRef = useRef<number | null>(null)
  const sessionDurationRef = useRef<number>(initialDuration)
  const remainingTimeRef = useRef<number | null>(null)

  // Timer logic migrated from usePomodoro
  // Store remaining time when paused
  // Store the original session duration for the current session
  // These refs are already defined above

  // Toggle timer running/paused
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
      if (startTimeRef.current !== null) {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current) / 1000)
        remainingTimeRef.current = sessionDurationRef.current - elapsed
        setTime(sessionDurationRef.current - elapsed)
      }
      startTimeRef.current = null
      endTimeRef.current = null
    } else {
      const now = Date.now()
      let duration = remainingTimeRef.current !== null ? remainingTimeRef.current : sessionDurationRef.current
      setIsRunning(true)
      setTime(duration)
      startTimeRef.current = now
      endTimeRef.current = now + duration * 1000
      remainingTimeRef.current = null
    }
  }, [isRunning])

  // Reset timer to initial duration
  const resetTimer = useCallback((newDuration?: number) => {
    setIsRunning(false)
    startTimeRef.current = null
    endTimeRef.current = null
    remainingTimeRef.current = null
    let duration = typeof newDuration === 'number' ? newDuration : sessionDurationRef.current
    sessionDurationRef.current = duration
    setTime(duration)
  }, [])

  // Update timer when sessionType or initialDuration changes
  useEffect(() => {
    const newDuration = initialDuration
    if (sessionDurationRef.current !== newDuration || !time) {
      sessionDurationRef.current = newDuration
      if (!isRunning) {
        setTime(newDuration)
        startTimeRef.current = null
        endTimeRef.current = null
        remainingTimeRef.current = null
      }
    }
  }, [initialDuration, sessionType])

  // Main timer countdown effect
  useEffect(() => {
    if (isRunning && startTimeRef.current !== null) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        let duration = 0
        if (endTimeRef.current !== null) {
          duration = Math.round((endTimeRef.current - now) / 1000)
        } else if (startTimeRef.current !== null) {
          duration = Math.round(sessionDurationRef.current - (now - startTimeRef.current) / 1000)
        }
        const timeLeft = Math.max(0, duration)
        setTime(timeLeft)
        if (timeLeft <= 0) {
          setIsRunning(false)
          startTimeRef.current = null
          endTimeRef.current = null
          remainingTimeRef.current = null
          setTime(0)
          onComplete()
        }
      }, 100)
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
  }, [isRunning, onComplete])

  // Handle visibility change to recalculate timer when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isRunning && startTimeRef.current !== null) {
        const now = Date.now()
        let duration = 0
        if (endTimeRef.current !== null) {
          duration = Math.round((endTimeRef.current - now) / 1000)
        } else if (startTimeRef.current !== null) {
          duration = Math.round(sessionDurationRef.current - (now - startTimeRef.current) / 1000)
        }
        const timeLeft = Math.max(0, duration)
        setTime(timeLeft)
        if (timeLeft <= 0) {
          setIsRunning(false)
          startTimeRef.current = null
          endTimeRef.current = null
          remainingTimeRef.current = null
          setTime(0)
          onComplete()
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isRunning, onComplete])

  // Increment timer by n seconds
  const incrementTime = useCallback((seconds: number) => {
    setTime((prev) => Math.max(0, prev + seconds))
    sessionDurationRef.current = Math.max(0, sessionDurationRef.current + seconds)
  }, [])

  // Decrement timer by n seconds
  const decrementTime = useCallback((seconds: number) => {
    setTime((prev) => Math.max(0, prev - seconds))
    sessionDurationRef.current = Math.max(0, sessionDurationRef.current - seconds)
  }, [])

  return {
    time,
    isRunning,
    toggleTimer,
    resetTimer,
    setTime,
    setIsRunning,
    incrementTime,
    decrementTime,
  }
}
