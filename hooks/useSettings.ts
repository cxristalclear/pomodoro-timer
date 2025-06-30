// Settings management hook for Pomodoro
import { useState } from "react"
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
  })
  // Load settings from DB
  const loadSettings = async () => {
    if (!userId) return
    const { data, error } = await pomodoroService.settings.get(userId)
    if (data && !error) {
      setSettings({
        workDuration: data.work_duration,
        breakDuration: data.break_duration,
        longBreakDuration: data.long_break_duration,
        sessionsUntilLongBreak: data.sessions_until_long_break,
        soundEnabled: data.sound_enabled,
        soundVolume: data.sound_volume,
        autoStartBreaks: data.auto_start_breaks,
        autoStartWork: data.auto_start_work,
      })
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
      await pomodoroService.settings.upsert(userId, settingsToUpdate)
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
