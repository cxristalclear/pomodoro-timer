"use client"

import type React from "react"
import { X, Save, Check } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Link from "next/link"
import { useState, useEffect } from "react"

/**
 * Minimal Settings page with GitHub-style clean design
 */
function MinimalSettingsContent() {
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
      setError("Failed to save settings")
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
   * Minimal toggle component
   */
  const MinimalToggle: React.FC<{
    enabled: boolean
    onChange: () => void
  }> = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
        enabled ? 'bg-blue-600' : 'bg-gray-700'
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
          enabled ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  )

  /**
   * Minimal input component
   */
  const MinimalInput: React.FC<{
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
  }> = ({ value, onChange, min = 1, max = 120 }) => (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
      min={min}
      max={max}
      className="bg-transparent border-b border-gray-700 px-2 py-1 text-right w-16 text-white focus:border-blue-500 focus:outline-none transition-colors"
    />
  )

  /**
   * Data management functions
   */
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
        
        <div className="flex items-center gap-4">
          {hasChanges && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                    Saving
                  </>
                ) : saved ? (
                  <>
                    <Check size={14} />
                    Saved
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
          
          <Link href="/" className="text-white p-2 hover:bg-gray-900 rounded transition-colors">
            <X size={20} />
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-12">
        
        {/* Error message */}
        {error && (
          <div className="text-red-400 text-sm border-l-2 border-red-500 pl-4">
            {error}
          </div>
        )}

        {/* Timer Durations */}
        <section className="space-y-8">
          <h2 className="text-lg font-light text-gray-300">Timer Durations</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Work Duration</div>
                <div className="text-gray-500 text-sm">Focus session length</div>
              </div>
              <div className="flex items-center gap-2">
                <MinimalInput
                  value={localSettings.workDuration}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, workDuration: value }))}
                  min={1}
                  max={120}
                />
                <span className="text-gray-500 text-sm">min</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Short Break Duration</div>
                <div className="text-gray-500 text-sm">Regular break length</div>
              </div>
              <div className="flex items-center gap-2">
                <MinimalInput
                  value={localSettings.breakDuration}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, breakDuration: value }))}
                  min={1}
                  max={30}
                />
                <span className="text-gray-500 text-sm">min</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Long Break Duration</div>
                <div className="text-gray-500 text-sm">Extended break length</div>
              </div>
              <div className="flex items-center gap-2">
                <MinimalInput
                  value={localSettings.longBreakDuration}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, longBreakDuration: value }))}
                  min={1}
                  max={60}
                />
                <span className="text-gray-500 text-sm">min</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Sessions Until Long Break</div>
                <div className="text-gray-500 text-sm">Work sessions before extended break</div>
              </div>
              <div className="flex items-center gap-2">
                <MinimalInput
                  value={localSettings.sessionsUntilLongBreak}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, sessionsUntilLongBreak: value }))}
                  min={2}
                  max={10}
                />
                <span className="text-gray-500 text-sm">sessions</span>
              </div>
            </div>
          </div>
        </section>

        {/* Audio */}
        <section className="space-y-8">
          <h2 className="text-lg font-light text-gray-300">Audio</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Sound Alerts</div>
                <div className="text-gray-500 text-sm">Play notification sounds when sessions complete</div>
              </div>
              <MinimalToggle
                enabled={localSettings.soundEnabled}
                onChange={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              />
            </div>
            
            {localSettings.soundEnabled && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Volume</div>
                  <div className="text-gray-500 text-sm">Notification sound volume</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.soundVolume}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, soundVolume: parseFloat(e.target.value) }))}
                    className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-gray-400 text-sm w-8">
                    {Math.round(localSettings.soundVolume * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Auto-start */}
        <section className="space-y-8">
          <h2 className="text-lg font-light text-gray-300">Auto-start</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Auto-start Breaks</div>
                <div className="text-gray-500 text-sm">Automatically start break sessions after work completes</div>
              </div>
              <MinimalToggle
                enabled={localSettings.autoStartBreaks}
                onChange={() => setLocalSettings(prev => ({ ...prev, autoStartBreaks: !prev.autoStartBreaks }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Auto-start Work Sessions</div>
                <div className="text-gray-500 text-sm">Automatically start work sessions after breaks complete</div>
              </div>
              <MinimalToggle
                enabled={localSettings.autoStartWork}
                onChange={() => setLocalSettings(prev => ({ ...prev, autoStartWork: !prev.autoStartWork }))}
              />
            </div>
          </div>
        </section>

        {/* Display */}
        <section className="space-y-8">
          <h2 className="text-lg font-light text-gray-300">Display</h2>
          
          <div className="space-y-6">
            <div>
              <div className="text-white font-medium mb-3">Timer Display Mode</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLocalSettings(prev => ({ ...prev, timerDisplayMode: 'countdown' }))}
                  className={`p-3 text-center border transition-all ${
                    localSettings.timerDisplayMode === 'countdown'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Countdown
                </button>
                
                <button
                  onClick={() => setLocalSettings(prev => ({ ...prev, timerDisplayMode: 'elapsed' }))}
                  className={`p-3 text-center border transition-all ${
                    localSettings.timerDisplayMode === 'elapsed'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Elapsed
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-8">
          <h2 className="text-lg font-light text-gray-300">Notifications</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Desktop Notifications</div>
                <div className="text-gray-500 text-sm">Get notified when sessions complete</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${
                  Notification.permission === 'granted' 
                    ? 'text-green-400' 
                    : Notification.permission === 'denied'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}>
                  {Notification.permission === 'granted' ? 'Enabled' : 
                   Notification.permission === 'denied' ? 'Blocked' : 'Not Set'}
                </span>
                <MinimalToggle 
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
                />
              </div>
            </div>
            
            {Notification.permission === 'granted' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Test Notification</div>
                  <div className="text-gray-500 text-sm">Send a test notification</div>
                </div>
                <button 
                  onClick={() => {
                    new Notification('Test Notification', {
                      body: 'This is how notifications will appear!',
                      icon: '/placeholder-logo.png'
                    })
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Test
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Account */}
        <section className="space-y-8">
          <h2 className="text-lg font-light text-gray-300">Account</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Email</div>
                <div className="text-gray-500 text-sm">{user?.email || 'Not available'}</div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Change
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Password</div>
                <div className="text-gray-500 text-sm">••••••••</div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Change
              </button>
            </div>
            
            <div className="pt-4">
              <button className="text-red-400 hover:text-red-300 text-sm transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-8">
          <h2 className="text-lg font-light text-gray-300">Data Management</h2>
          <div className="text-gray-500 text-sm mb-6">Clean up your tracking history and manage your data</div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Export Data</div>
                <div className="text-gray-500 text-sm">Download tasks and sessions as JSON</div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Export
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Import Data</div>
                <div className="text-gray-500 text-sm">Upload previously exported file</div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Import
              </button>
            </div>
            
            <div className="pt-4 space-y-3">
              <button 
                onClick={clearAllCompletedTasks}
                className="block text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Clear Completed Tasks ({tasks.filter(t => t.completed).length})
              </button>
              <button 
                onClick={clearAllSessions}
                className="block text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Clear Session History ({sessions.length} sessions)
              </button>
              <button className="block text-red-400 hover:text-red-300 text-sm transition-colors">
                Clear All Data
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

/**
 * Settings page with provider wrapper
 */
export default function MinimalSettingsPage() {
  return (
    <ProtectedRoute>
      <MinimalSettingsContent />
    </ProtectedRoute>
  )
}
