"use client"

import type React from "react"
import { X, Save, Check, Clock, Volume2, Play, Monitor, Bell, Zap, Timer, Settings as SettingsIcon, Settings } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { BreadcrumbNav, useBreadcrumbs } from "@/components/BreadcrumbNav"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Enhanced Settings page component with better organization and visual design
 */
function SettingsPageContent() {
  const { settings, setSettings, updateSettings, dataLoading } = usePomodoro()
  const { user } = useAuth()
  const pathname = usePathname()
  const breadcrumbs = useBreadcrumbs(pathname)
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
   * Enhanced toggle component
   */
  const EnhancedToggle: React.FC<{
    enabled: boolean
    onChange: () => void
    label: string
    description?: string
  }> = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-800/30 rounded-lg transition-colors">
      <div className="flex-1">
        <div className="text-gray-200 font-medium">{label}</div>
        {description && <div className="text-gray-400 text-sm mt-1">{description}</div>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
          enabled 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
            : 'bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
            enabled ? 'left-6 shadow-lg' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )

  /**
   * Enhanced input component
   */
  const EnhancedInput: React.FC<{
    value: number
    onChange: (value: number) => void
    label: string
    suffix: string
    min?: number
    max?: number
  }> = ({ value, onChange, label, suffix, min = 1, max = 120 }) => (
    <div className="space-y-2">
      <label className="text-gray-200 font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
          min={min}
          max={max}
          className="bg-gray-800/50 border border-gray-600/50 px-4 py-3 rounded-lg text-white font-medium text-center w-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <span className="text-gray-400 text-sm">{suffix}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Enhanced header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800/50 rounded-lg">
              <SettingsIcon className="text-blue-400" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-gray-400 text-sm">Customize your Pomodoro experience</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save/Reset buttons */}
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
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
                      Save
                    </>
                  )}
                </button>
              </div>
            )}
            
            <Link
              href="/"
              className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Back to timer"
            >
              <X size={24} />
            </Link>
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div className="px-6 pb-4">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">
        
        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Timer Duration Settings */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Timer className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Timer Durations</h2>
              <p className="text-gray-400 text-sm">Set your focus and break session lengths</p>
            </div>
          </div>
          
          <div className="grid gap-6">
            <EnhancedInput
              value={localSettings.workDuration}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, workDuration: value }))}
              label="Work Duration"
              suffix="minutes"
              min={1}
              max={120}
            />
            
            <EnhancedInput
              value={localSettings.breakDuration}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, breakDuration: value }))}
              label="Short Break Duration"
              suffix="minutes"
              min={1}
              max={30}
            />
            
            <EnhancedInput
              value={localSettings.longBreakDuration}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, longBreakDuration: value }))}
              label="Long Break Duration"
              suffix="minutes"
              min={1}
              max={60}
            />
            
            <EnhancedInput
              value={localSettings.sessionsUntilLongBreak}
              onChange={(value) => setLocalSettings(prev => ({ ...prev, sessionsUntilLongBreak: value }))}
              label="Sessions Until Long Break"
              suffix="sessions"
              min={2}
              max={10}
            />
          </div>
        </section>

        {/* Sound & Notifications */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Volume2 className="text-green-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Audio & Alerts</h2>
              <p className="text-gray-400 text-sm">Configure sound notifications and volume</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <EnhancedToggle
              enabled={localSettings.soundEnabled}
              onChange={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              label="Sound Alerts"
              description="Play notification sounds when sessions complete"
            />
            
            {localSettings.soundEnabled && (
              <div className="ml-4 p-4 bg-gray-800/30 rounded-lg">
                <label className="text-gray-200 font-medium mb-3 block">Volume</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.soundVolume}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, soundVolume: parseFloat(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-gray-300 text-sm w-12">
                    {Math.round(localSettings.soundVolume * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Automation Settings */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Auto-start</h2>
              <p className="text-gray-400 text-sm">Automatically begin the next session</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <EnhancedToggle
              enabled={localSettings.autoStartBreaks}
              onChange={() => setLocalSettings(prev => ({ ...prev, autoStartBreaks: !prev.autoStartBreaks }))}
              label="Auto-start Breaks"
              description="Automatically start break sessions after work completes"
            />
            
            <EnhancedToggle
              enabled={localSettings.autoStartWork}
              onChange={() => setLocalSettings(prev => ({ ...prev, autoStartWork: !prev.autoStartWork }))}
              label="Auto-start Work Sessions"
              description="Automatically start work sessions after breaks complete"
            />
          </div>
        </section>

        {/* Display Settings */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Monitor className="text-orange-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Timer Display</h2>
              <p className="text-gray-400 text-sm">Choose how the timer appears</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, timerDisplayMode: 'countdown' }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                localSettings.timerDisplayMode === 'countdown'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                  : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
              }`}
            >
              <Clock className="mx-auto mb-2" size={24} />
              <div className="font-medium">Countdown</div>
              <div className="text-xs opacity-75 mt-1">Time remaining</div>
            </button>
            
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, timerDisplayMode: 'digital' }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                localSettings.timerDisplayMode === 'digital'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                  : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
              }`}
            >
              <Timer className="mx-auto mb-2" size={24} />
              <div className="font-medium">Digital</div>
              <div className="text-xs opacity-75 mt-1">Classic display</div>
            </button>
          </div>
        </section>

        {/* Account Management */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Settings className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Account Management</h2>
              <p className="text-gray-400 text-sm">Manage your account settings and preferences</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <p className="text-gray-300 font-medium">Email Address</p>
                <p className="text-gray-500 text-sm">{user?.email || 'Not available'}</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Change Email
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <p className="text-gray-300 font-medium">Password</p>
                <p className="text-gray-500 text-sm">Last updated recently</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Change Password
              </button>
            </div>
            
            <div className="border-t border-gray-700/50 pt-4">
              <button className="text-red-400 hover:text-red-300 text-sm transition-colors">
                Delete Account
              </button>
              <p className="text-gray-500 text-xs mt-1">This action cannot be undone</p>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Bell className="text-yellow-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Notifications</h2>
              <p className="text-gray-400 text-sm">Configure desktop and browser notifications</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <EnhancedToggle
              enabled={Notification.permission === 'granted'}
              onChange={async () => {
                if (Notification.permission === 'granted') {
                  // Note: We can't programmatically revoke permissions
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
              description="Get notified when sessions complete, even when the tab is in the background"
            />
            
            <div className="ml-4 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Current Status</span>
                <span className={`text-xs px-2 py-1 rounded ${
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
              
              {Notification.permission === 'denied' && (
                <p className="text-gray-500 text-xs">
                  Notifications are blocked. Please enable them in your browser settings to receive alerts.
                </p>
              )}
              
              <button 
                onClick={() => {
                  if (Notification.permission === 'granted') {
                    new Notification('Test Notification', {
                      body: 'This is how notifications will appear!',
                      icon: '/placeholder-logo.png'
                    })
                  }
                }}
                disabled={Notification.permission !== 'granted'}
                className="mt-2 text-blue-400 hover:text-blue-300 text-xs transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Test Notification
              </button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Save className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Data Management</h2>
              <p className="text-gray-400 text-sm">Export, import, and manage your data</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <p className="text-gray-300 font-medium">Export Data</p>
                <p className="text-gray-500 text-sm">Download your tasks and session history</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Export JSON
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <p className="text-gray-300 font-medium">Import Data</p>
                <p className="text-gray-500 text-sm">Upload a previously exported file</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Import JSON
              </button>
            </div>
            
            <div className="border-t border-gray-700/50 pt-4">
              <button className="text-red-400 hover:text-red-300 text-sm transition-colors">
                Clear All Data
              </button>
              <p className="text-gray-500 text-xs mt-1">This will delete all tasks and session history</p>
            </div>
          </div>
        </section>

        {/* Keyboard shortcuts info */}
        <section className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-500/20 rounded-lg">
              <Bell className="text-gray-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Keyboard Shortcuts</h2>
              <p className="text-gray-400 text-sm">Save time with these helpful shortcuts</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between items-center p-2">
              <span className="text-gray-300">Save settings</span>
              <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+S</kbd>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-gray-300">Start/Pause timer</span>
              <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Space</kbd>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-gray-300">Reset timer</span>
              <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+R</kbd>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-gray-300">Go to tasks</span>
              <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+T</kbd>
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
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  )
}
