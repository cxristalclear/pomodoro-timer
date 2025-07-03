// Settings management hook for Pomodoro
import { useState, useEffect } from "react"
import type { Settings } from "@/contexts/PomodoroContext"
import { pomodoroService } from "@/services/pomodoroService"

export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<Settings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    soundVolume: 0.5,
    autoStartBreaks: true,
    autoStartWork: false,
    timerDisplayMode: "digital",
  });

  // Load settings on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  // Load settings from DB
  const loadSettings = async () => {
    if (!userId) return
    try {
      const { data, error } = await pomodoroService.settings.get(userId)
      if (error) {
        console.error("Error loading settings:", error)
        return
      }
      if (data) {
        setSettings({
          workDuration: data.work_duration || 25,
          breakDuration: data.break_duration || 5,
          longBreakDuration: data.long_break_duration || 15,
          sessionsUntilLongBreak: data.sessions_until_long_break || 4,
          soundEnabled: data.sound_enabled ?? true,
          soundVolume: data.sound_volume ?? 0.5,
          autoStartBreaks: data.auto_start_breaks ?? true,
          autoStartWork: data.auto_start_work ?? false,
          timerDisplayMode: data.timer_display_mode || "digital", // Default to digital if not set
        })
      }
    } catch (error) {
      console.error("Error in loadSettings:", error)
    }
  }

  // Update settings (with timer reset logic)
  const updateSettings = async (newSettings: Settings | ((prev: Settings) => Settings), isRunning: boolean, resetTimer: () => void) => {
    const previousSettings = settings
    const settingsToUpdate = typeof newSettings === "function" ? newSettings(settings) : newSettings
    // Check if timer-related settings changed
    const timerSettingsChanged =
      previousSettings.workDuration !== settingsToUpdate.workDuration ||
      previousSettings.breakDuration !== settingsToUpdate.breakDuration ||
      previousSettings.longBreakDuration !== settingsToUpdate.longBreakDuration
    setSettings(settingsToUpdate)
    // Only reset timer if duration settings changed and timer is not running
    if (timerSettingsChanged && !isRunning) {
      resetTimer()
    }
    // Save to DB
    if (userId) {
      try {
        const result = await pomodoroService.settings.upsert(userId, settingsToUpdate)
        if (result?.error) {
          console.error("Error saving settings to DB:", result.error)
          throw result.error
        }
      } catch (err) {
        console.error("Exception in updateSettings:", err)
        throw err
      }
    } else {
      console.error("No userId provided to updateSettings")
      throw new Error("No userId provided")
    }
    return settingsToUpdate
  }

  // Reset settings to default
  const resetSettings = () => {
    setSettings({
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      soundEnabled: true,
      soundVolume: 0.5,
      autoStartBreaks: true,
      autoStartWork: false,
      timerDisplayMode: "digital",
    })
  }

  // Utility: check if timer settings changed
  const hasTimerSettingsChanged = (newSettings: Settings) => {
    return (
      settings.workDuration !== newSettings.workDuration ||
      settings.breakDuration !== newSettings.breakDuration ||
      settings.longBreakDuration !== newSettings.longBreakDuration
    )
  }

  return {
    settings,
    setSettings,
    loadSettings,
    updateSettings,
    resetSettings,
    hasTimerSettingsChanged,
  }
}
