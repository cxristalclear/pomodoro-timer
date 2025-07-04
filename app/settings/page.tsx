"use client"

import type React from "react"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Link from "next/link"
import { useState, useEffect } from "react"

/**
 * Minimal Settings page with collapsible sections
 */
function SettingsPageContent() {
  const { 
    settings, 
    updateSettings, 
    dataLoading, 
    tasks, 
    deleteTask, 
    deleteSessionsByTaskId,
    sessions 
  } = usePomodoro()
  const { user } = useAuth()
  
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    timer: true,
    audio: false,
    automation: false,
    display: false,
    account: false,
    notifications: false,
    data: false
  })

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
   * Toggle section open/closed
   */
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
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
   * Simple toggle component
   */
  const Toggle: React.FC<{
    enabled: boolean
    onChange: () => void
    label: string
    description?: string
  }> = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="text-gray-300">{label}</div>
        {description && <div className="text-gray-500 text-sm mt-1">{description}</div>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )

  /**
   * Simple input component
   */
  const NumberInput: React.FC<{
    value: number
    onChange: (value: number) => void
    label: string
    suffix: string
    min?: number
    max?: number
  }> = ({ value, onChange, label, suffix, min = 1, max = 120 }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-gray-300">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
          min={min}
          max={max}
          className="bg-gray-800 border border-gray-600 px-3 py-1 rounded text-white text-center w-16 focus:border-blue-500 transition-colors"
        />
        <span className="text-gray-500 text-sm">{suffix}</span>
      </div>
    </div>
  )

  /**
   * Collapsible section component
   */
  const Section: React.FC<{
    id: string
    title: string
    children: React.ReactNode
  }> = ({ id, title, children }) => (
    <div className="border-b border-gray-800">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-900/50 transition-colors"
      >
        <h2 className="text-lg font-light text-gray-200">{title}</h2>
        {openSections[id] ? (
          <ChevronDown className="text-gray-400" size={20} />
        ) : (
          <ChevronRight className="text-gray-400" size={20} />
        )}
      </button>
      {openSections[id] && (
        <div className="pb-4 pl-4">
          {children}
        </div>
      )}
    </div>
  )

  /**
   * Data management functions
   */
  const deleteTaskCompletely = async (taskId: number, taskName: string) => {
    try {
      console.log("🗑️ Completely deleting task:", taskName)
      await deleteSessionsByTaskId(taskId)
      deleteTask(taskId)
      console.log("✅ Task and sessions deleted successfully")
    } catch (error) {
      console.error("❌ Error deleting task completely:", error)
    }
  }

  const clearAllCompletedTasks = async () => {
    const completedTasks = tasks.filter(t => t.completed)
    if (completedTasks.length === 0) {
      alert("No completed tasks to clear")
      return
    }
    
    if (!window.confirm(`Delete ${completedTasks.length} completed tasks and all their session data?`)) {
      return
    }
    
    try {
      console.log("🗑️ Clearing all completed tasks and sessions")
      await Promise.all(
        completedTasks.map(task => deleteSessionsByTaskId(task.id))
      )
      completedTasks.forEach(task => deleteTask(task.id))
      console.log("✅ All completed tasks and sessions cleared")
    } catch (error) {
      console.error("❌ Error clearing completed tasks:", error)
    }
  }

  const clearAllSessions = async () => {
    if (sessions.length === 0) {
      alert("No sessions to clear")
      return
    }
    
    if (!window.confirm(`Delete all ${sessions.length} session records? This will not affect your tasks.`)) {
      return
    }
    
    try {
      console.log("🗑️ Clearing all sessions")
      // This would need to be implemented in the service/hook
      alert("Session clearing not yet implemented")
    } catch (error) {
      console.error("❌ Error clearing sessions:", error)
    }
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl font-light">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <div>
          <h1 className="text-xl font-light">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Customize your experience</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save"}
              </button>
            </div>
          )}
          <Link
            href="/"
            className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
          >
            <X size={20} />
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        
        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-3 text-red-200 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Timer Duration Settings */}
        <Section id="timer" title="Timer Durations">
          <div className="space-y-2">
            <NumberInput
              value={localSettings.workDuration}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, workDuration: value }))}
              label="Work Duration"
              suffix="minutes"
              min={1}
              max={120}
            />
            <NumberInput
              value={localSettings.breakDuration}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, breakDuration: value }))}
              label="Short Break Duration"
              suffix="minutes"
              min={1}
              max={30}
            />
            <NumberInput
              value={localSettings.longBreakDuration}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, longBreakDuration: value }))}
              label="Long Break Duration"
              suffix="minutes"
              min={1}
              max={60}
            />
            <NumberInput
              value={localSettings.sessionsUntilLongBreak}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, sessionsUntilLongBreak: value }))}
              label="Sessions Until Long Break"
              suffix="sessions"
              min={2}
              max={10}
            />
          </div>
        </Section>

        {/* Audio Settings */}
        <Section id="audio" title="Audio">
          <div className="space-y-2">
            <Toggle
              enabled={localSettings.soundEnabled}
              onChange={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              label="Sound Alerts"
              description="Play notification sounds when sessions complete"
            />
            {localSettings.soundEnabled && (
              <div className="py-3 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Volume</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localSettings.soundVolume}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, soundVolume: parseFloat(e.target.value) }))}
                      className="w-24"
                    />
                    <span className="text-gray-500 text-sm w-8">
                      {Math.round(localSettings.soundVolume * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Automation Settings */}
        <Section id="automation" title="Auto-start">
          <div className="space-y-2">
            <Toggle
              enabled={localSettings.autoStartBreaks}
              onChange={() => setLocalSettings(prev => ({ ...prev, autoStartBreaks: !prev.autoStartBreaks }))}
              label="Auto-start Breaks"
              description="Automatically start break sessions after work completes"
            />
            <Toggle
              enabled={localSettings.autoStartWork}
              onChange={() => setLocalSettings(prev => ({ ...prev, autoStartWork: !prev.autoStartWork }))}
              label="Auto-start Work Sessions"
              description="Automatically start work sessions after breaks complete"
            />
          </div>
        </Section>

        {/* Display Settings */}
        <Section id="display" title="Display">
          <div className="py-3">
            <div className="text-gray-300 mb-3">Timer Display Mode</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, timerDisplayMode: 'countdown' }))}
                className={`p-3 rounded border transition-colors text-sm ${
                  localSettings.timerDisplayMode === 'countdown'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                Countdown
              </button>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, timerDisplayMode: 'digital' }))}
                className={`p-3 rounded border transition-colors text-sm ${
                  localSettings.timerDisplayMode === 'digital'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                Digital
              </button>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section id="notifications" title="Notifications">
          <div className="space-y-3">
            <Toggle
              enabled={Notification.permission === 'granted'}
              onChange={async () => {
                if (Notification.permission === 'granted') {
                  alert('To disable notifications, please use your browser settings')
                } else {
                  const permission = await Notification.requestPermission()
                  if (permission === 'granted') {
                    new Notification('Pomodoro Timer', {
                      body: 'Notifications enabled successfully!',
                      icon: '/placeholder-logo.png'
                    })
                  }
                }
              }}
              label="Desktop Notifications"
              description="Get notified when sessions complete"
            />
            <div className="py-2 pl-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  Notification.permission === 'granted' 
                    ? 'bg-green-500/20 text-green-400' 
                    : Notification.permission === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {Notification.permission === 'granted' ? 'Enabled' : 
                   Notification.permission === 'denied' ? 'Blocked' : 'Not Set'}
                </span>
              </div>
              {Notification.permission === 'granted' && (
                <button 
                  onClick={() => {
                    new Notification('Test Notification', {
                      body: 'This is how notifications will appear!',
                      icon: '/placeholder-logo.png'
                    })
                  }}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                >
                  Test Notification
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Account Management */}
        <Section id="account" title="Account">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="text-gray-300">Email</div>
                <div className="text-gray-500 text-sm">{user?.email || 'Not available'}</div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Change
              </button>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="text-gray-300">Password</div>
                <div className="text-gray-500 text-sm">••••••••</div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Change
              </button>
            </div>
            <div className="pt-2 border-t border-gray-800">
              <button className="text-red-400 hover:text-red-300 text-sm transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </Section>

        {/* Data Management */}
        <Section id="data" title="Data Management">
          <div className="space-y-4">
            <div className="text-gray-400 text-sm mb-4">
              Clean up your tracking history and manage your data
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <div>
                  <div className="text-gray-300">Export Data</div>
                  <div className="text-gray-500 text-sm">Download tasks and sessions as JSON</div>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  Export
                </button>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <div className="text-gray-300">Import Data</div>
                  <div className="text-gray-500 text-sm">Upload previously exported file</div>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  Import
                </button>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-800 space-y-3">
              <button 
                onClick={clearAllCompletedTasks}
                className="block text-orange-400 hover:text-orange-300 text-sm transition-colors"
              >
                Clear Completed Tasks ({tasks.filter(t => t.completed).length})
              </button>
              
              <button 
                onClick={clearAllSessions}
                className="block text-orange-400 hover:text-orange-300 text-sm transition-colors"
              >
                Clear Session History ({sessions.length} sessions)
              </button>
              
              <button className="block text-red-400 hover:text-red-300 text-sm transition-colors">
                Clear All Data
              </button>
            </div>
          </div>
        </Section>

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
