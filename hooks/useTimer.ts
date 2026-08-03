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

  // Start (or resume) the countdown, seeding the wall-clock refs the countdown
  // effect reads. Callers must use this rather than a bare setIsRunning(true):
  // without startTimeRef/endTimeRef the effect either won't tick at all, or
  // ticks against a stale endTime and fires onComplete immediately.
  const startTimer = useCallback(() => {
    const now = Date.now()
    const duration = remainingTimeRef.current !== null ? remainingTimeRef.current : sessionDurationRef.current
    startTimeRef.current = now
    endTimeRef.current = now + duration * 1000
    remainingTimeRef.current = null
    setTime(duration)
    setIsRunning(true)
  }, [])

  // Pause, stashing the remainder so startTimer resumes from here.
  const pauseTimer = useCallback(() => {
    setIsRunning(false)
    if (startTimeRef.current !== null) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const timeLeft = sessionDurationRef.current - elapsed
      remainingTimeRef.current = timeLeft
      setTime(timeLeft)
    }
    startTimeRef.current = null
    endTimeRef.current = null
  }, [])

  // Toggle timer running/paused
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      pauseTimer()
    } else {
      startTimer()
    }
  }, [isRunning, pauseTimer, startTimer])

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

  // Read the wall-clock refs for persistence (#8). Reads them directly rather
  // than mirroring into state, so callers always see current values even though
  // ref writes don't trigger a render.
  const getTimerSnapshot = useCallback(() => ({
    duration: sessionDurationRef.current,
    endTime: endTimeRef.current,
    remaining: remainingTimeRef.current,
  }), [])

  // Re-seat the timer from a persisted snapshot.
  //
  // A session still in flight is restored to its true remaining time, derived
  // from the absolute endTime — so closing the tab for 5 minutes of a 25 minute
  // session correctly leaves 20.
  //
  // A session whose endTime already passed is restored as a fresh, unstarted
  // session of the same type. It is deliberately NOT auto-completed: onComplete
  // never ran while the tab was closed, so no session row was written and no
  // pomodoro was counted. Fabricating them here would invent work that was
  // never observed. What the user does keep is their place in the cycle —
  // sessionType and sessionCount survive, which is the part that was previously
  // lost on every refresh.
  const restoreTimer = useCallback((snapshot: {
    duration: number
    endTime: number | null
    remaining: number | null
    isRunning: boolean
  }) => {
    sessionDurationRef.current = snapshot.duration

    if (snapshot.isRunning && snapshot.endTime !== null) {
      const secondsLeft = Math.round((snapshot.endTime - Date.now()) / 1000)
      if (secondsLeft > 0) {
        startTimeRef.current = snapshot.endTime - snapshot.duration * 1000
        endTimeRef.current = snapshot.endTime
        remainingTimeRef.current = null
        setTime(secondsLeft)
        setIsRunning(true)
        return
      }
    }

    // Paused, stopped, or expired while away.
    startTimeRef.current = null
    endTimeRef.current = null
    remainingTimeRef.current = snapshot.remaining
    setTime(snapshot.remaining ?? snapshot.duration)
    setIsRunning(false)
  }, [])

  return {
    time,
    isRunning,
    toggleTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    setTime,
    setIsRunning,
    incrementTime,
    decrementTime,
    getTimerSnapshot,
    restoreTimer,
  }
}
