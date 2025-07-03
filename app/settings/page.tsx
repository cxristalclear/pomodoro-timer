"use client"

import type React from "react"
import { X, Save, Check } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Link from "next/link"
import { useState, useEffect } from "react"

/**
 * Settings page component
 * Allows users to configure timer durations, sound settings, and auto-start options
 */
function SettingsPageContent() {
  const { settings, setSettings, updateSettings, dataLoading } = usePomodoro()
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug logging
  console.log("SettingsPage - settings:", settings)
  console.log("SettingsPage - localSettings:", localSettings)
  console.log("SettingsPage - dataLoading:", dataLoading)

  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings(settings)
    setHasChanges(false)
  }, [settings])

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings)
    setHasChanges(changed)
  }, [localSettings, settings])

  /**
   * Save settings to database
   */
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateSettings(localSettings)
      setSaved(true)
      setHasChanges(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setError("Failed to save settings. Please try again.")
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Reset to last saved settings
   */
  const handleReset = () => {
    setLocalSettings(settings)
    setHasChanges(false)
    setError(null)
  }

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && hasChanges) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [hasChanges])

  /**
   * Create a toggle button component for boolean settings
   */
  const ToggleButton: React.FC<{
    enabled: boolean
    onChange: () => void
    label: string
  }> = ({ enabled, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-800"}`}
        aria-label={`Toggle ${label}`}
        role="switch"
        aria-checked={enabled}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  )

  /**
   * Create a number input component for duration settings
   */
  const DurationInput: React.FC<{
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
  }> = ({ label, value, onChange, min = 1, max = 180 }) => (
    <div>
      <label className="block text-gray-500 text-sm mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number.parseInt(e.target.value) || min)}
          className="w-20 bg-gray-900 px-3 py-2 rounded outline-none focus:bg-gray-800 text-center transition-colors border border-gray-700 focus:border-blue-500"
          aria-label={label}
        />
        <span className="text-gray-500">minutes</span>
      </div>
    </div>
  )

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Page header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Settings</h1>
        <Link
          href="/"
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
          aria-label="Back to timer"
        >
          <X size={24} />
        </Link>
      </header>

      {/* Settings content */}
      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <div className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Timer duration settings */}
          <div className="space-y-4">
            <h3 className="text-gray-500 text-sm">Timer Settings</h3>

            <DurationInput
              label="Work Duration"
              value={localSettings.workDuration}
              onChange={(value) => setLocalSettings((prev) => ({ ...prev, workDuration: value }))}
            />

            <DurationInput
              label="Break Duration"
              value={localSettings.breakDuration}
              onChange={(value) => setLocalSettings((prev) => ({ ...prev, breakDuration: value }))}
            />

            <DurationInput
              label="Long Break Duration"
              value={localSettings.longBreakDuration}
              onChange={(value) => setLocalSettings((prev) => ({ ...prev, longBreakDuration: value }))}
            />

            <div>
              <label className="block text-gray-500 text-sm mb-2">Sessions Until Long Break</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={localSettings.sessionsUntilLongBreak}
                  min={2}
                  max={10}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      sessionsUntilLongBreak: Number.parseInt(e.target.value) || 4,
                    }))
                  }
                  className="w-20 bg-gray-900 px-3 py-2 rounded outline-none focus:bg-gray-800 text-center transition-colors border border-gray-700 focus:border-blue-500"
                  aria-label="Sessions until long break"
                />
                <span className="text-gray-500">sessions</span>
              </div>
            </div>
          </div>

          {/* Sound and notification settings */}
          <div className="space-y-4">
            <h3 className="text-gray-500 text-sm">Sound & Notifications</h3>

            <ToggleButton
              enabled={localSettings.soundEnabled}
              onChange={() => setLocalSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              label="Sound Alerts"
            />

            <div>
              <label className="block text-gray-500 text-sm mb-2">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localSettings.soundVolume}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, soundVolume: Number.parseFloat(e.target.value) }))
                }
                className="w-full accent-blue-600"
                disabled={!localSettings.soundEnabled}
                aria-label="Sound volume"
              />
              <div className="text-xs text-gray-500 mt-1">{Math.round(localSettings.soundVolume * 100)}%</div>
            </div>

            <ToggleButton
              enabled={localSettings.notificationsEnabled}
              onChange={() => setLocalSettings((prev) => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
              label="Browser Notifications"
            />

            <div className="mt-2">
              <Link
                href="/test-notifications"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Test notifications & troubleshoot issues →
              </Link>
            </div>
          </div>

          {/* Auto-start settings */}
          <div className="space-y-4">
            <h3 className="text-gray-500 text-sm">Auto-start</h3>

            <ToggleButton
              enabled={localSettings.autoStartBreaks}
              onChange={() => setLocalSettings((prev) => ({ ...prev, autoStartBreaks: !prev.autoStartBreaks }))}
              label="Auto-start Breaks"
            />

            <ToggleButton
              enabled={localSettings.autoStartWork}
              onChange={() => setLocalSettings((prev) => ({ ...prev, autoStartWork: !prev.autoStartWork }))}
              label="Auto-start Work Sessions"
            />
          </div>

          {/* Timer display settings */}
          <div className="space-y-4">
            <h3 className="text-gray-500 text-sm">Timer Display</h3>

            <div>
              <label className="block text-gray-500 text-sm mb-2">Display Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalSettings((prev) => ({ ...prev, timerDisplayMode: "countdown" }))}
                  className={`flex-1 px-3 py-2 rounded transition-colors ${
                    localSettings.timerDisplayMode === "countdown"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Countdown
                </button>
                <button
                  onClick={() => setLocalSettings((prev) => ({ ...prev, timerDisplayMode: "digital" }))}
                  className={`flex-1 px-3 py-2 rounded transition-colors ${
                    localSettings.timerDisplayMode === "digital"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Digital
                </button>
              </div>
            </div>
          </div>

          {/* Save/Reset buttons */}
          {hasChanges && (
            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check size={16} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          )}

          {/* Keyboard shortcuts info */}
          <div className="text-xs text-gray-600 pt-4 border-t border-gray-900">
            <p className="mb-2">Keyboard shortcuts:</p>
            <div className="space-y-1">
              <p>
                <kbd className="bg-gray-800 px-1 rounded">Ctrl/Cmd + S</kbd> Save settings
              </p>
              <p>
                <kbd className="bg-gray-800 px-1 rounded">Ctrl/Cmd + R</kbd> Reset timer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Settings page with provider wrapper
 */
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  )
}
