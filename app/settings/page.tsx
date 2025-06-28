"use client"

import type React from "react"
import { X } from "lucide-react"
import { PomodoroProvider } from "@/components/PomodoroProvider"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Link from "next/link"

/**
 * Settings page component
 * Allows users to configure timer durations, sound settings, and auto-start options
 */
function SettingsPageContent() {
  const { settings, setSettings, dataLoading } = usePomodoro()

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
        className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-gray-600" : "bg-gray-800"}`}
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
          className="w-20 bg-gray-900 px-3 py-2 rounded outline-none focus:bg-gray-800 text-center transition-colors"
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
          {/* Timer duration settings */}
          <div className="space-y-4">
            <h3 className="text-gray-500 text-sm">Timer Settings</h3>

            <DurationInput
              label="Work Duration"
              value={settings.workDuration}
              onChange={(value) => setSettings((prev) => ({ ...prev, workDuration: value }))}
            />

            <DurationInput
              label="Break Duration"
              value={settings.breakDuration}
              onChange={(value) => setSettings((prev) => ({ ...prev, breakDuration: value }))}
            />

            <DurationInput
              label="Long Break Duration"
              value={settings.longBreakDuration}
              onChange={(value) => setSettings((prev) => ({ ...prev, longBreakDuration: value }))}
            />

            <div>
              <label className="block text-gray-500 text-sm mb-2">Sessions Until Long Break</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={settings.sessionsUntilLongBreak}
                  min={2}
                  max={10}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      sessionsUntilLongBreak: Number.parseInt(e.target.value) || 4,
                    }))
                  }
                  className="w-20 bg-gray-900 px-3 py-2 rounded outline-none focus:bg-gray-800 text-center transition-colors"
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
              enabled={settings.soundEnabled}
              onChange={() => setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              label="Sound Alerts"
            />

            <div>
              <label className="block text-gray-500 text-sm mb-2">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.soundVolume}
                onChange={(e) => setSettings((prev) => ({ ...prev, soundVolume: Number.parseFloat(e.target.value) }))}
                className="w-full"
                disabled={!settings.soundEnabled}
                aria-label="Sound volume"
              />
            </div>
          </div>

          {/* Auto-start settings */}
          <div className="space-y-4">
            <h3 className="text-gray-500 text-sm">Auto-start</h3>

            <ToggleButton
              enabled={settings.autoStartBreaks}
              onChange={() => setSettings((prev) => ({ ...prev, autoStartBreaks: !prev.autoStartBreaks }))}
              label="Auto-start Breaks"
            />

            <ToggleButton
              enabled={settings.autoStartWork}
              onChange={() => setSettings((prev) => ({ ...prev, autoStartWork: !prev.autoStartWork }))}
              label="Auto-start Work Sessions"
            />
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
      <PomodoroProvider>
        <SettingsPageContent />
      </PomodoroProvider>
    </ProtectedRoute>
  )
}
