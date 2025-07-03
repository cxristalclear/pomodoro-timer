"use client"

import React, { useState } from 'react'
import { usePomodoro } from '@/contexts/PomodoroContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Link from 'next/link'
import { X, Bell, Volume2, AlertCircle, CheckCircle } from 'lucide-react'

function TestNotificationsContent() {
  const { 
    requestNotificationPermission, 
    areNotificationsEnabled, 
    sendNotification,
    testSound,
    settings 
  } = usePomodoro()
  
  const [testResults, setTestResults] = useState<string[]>([])
  
  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testBrowserPermission = () => {
    if (typeof window === 'undefined') {
      addResult('❌ Window not available (SSR)')
      return
    }
    
    if (!('Notification' in window)) {
      addResult('❌ Browser does not support notifications')
      return
    }
    
    addResult(`✅ Browser supports notifications. Permission: ${Notification.permission}`)
  }

  const requestPermission = async () => {
    try {
      requestNotificationPermission()
      addResult('🔔 Permission request sent')
      
      // Check result after a delay
      setTimeout(() => {
        addResult(`🔔 Permission result: ${Notification.permission}`)
        addResult(`🔔 Are notifications enabled: ${areNotificationsEnabled()}`)
      }, 1000)
    } catch (error) {
      addResult(`❌ Error requesting permission: ${error}`)
    }
  }

  const testNotification = () => {
    try {
      if (!settings.notificationsEnabled) {
        addResult('❌ Notifications disabled in settings')
        return
      }
      
      if (!areNotificationsEnabled()) {
        addResult('❌ Browser notifications not permitted')
        return
      }
      
      sendNotification('Test Notification', {
        body: 'This is a test notification from your Pomodoro Timer!',
        icon: '/placeholder-logo.png'
      })
      addResult('🔔 Test notification sent!')
    } catch (error) {
      addResult(`❌ Error sending notification: ${error}`)
    }
  }

  const handleTestSound = () => {
    try {
      testSound()
      addResult('🔊 Test sound played!')
    } catch (error) {
      addResult(`❌ Error playing sound: ${error}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Test Notifications</h1>
        <Link
          href="/settings"
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
          aria-label="Back to settings"
        >
          <X size={24} />
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Current Status
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {settings.notificationsEnabled ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
                <span>Notifications enabled in settings: {settings.notificationsEnabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                {areNotificationsEnabled() ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
                <span>Browser permission granted: {areNotificationsEnabled() ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
                <span>Sound enabled: {settings.soundEnabled ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Test Functions</h2>
            
            <div className="grid gap-3">
              <button
                onClick={testBrowserPermission}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Bell size={16} />
                Check Browser Support
              </button>
              
              <button
                onClick={requestPermission}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Bell size={16} />
                Request Permission
              </button>
              
              <button
                onClick={testNotification}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Bell size={16} />
                Send Test Notification
              </button>
              
              <button
                onClick={handleTestSound}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Volume2 size={16} />
                Test Sound
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Test Results</h2>
              <button
                onClick={clearResults}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg min-h-32 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 italic">No test results yet. Run a test above!</p>
              ) : (
                <div className="space-y-1 font-mono text-sm">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-gray-300">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Help */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-lg font-medium mb-2">Troubleshooting</h2>
            <div className="text-sm text-gray-300 space-y-2">
              <p>• Make sure notifications are enabled in your browser settings</p>
              <p>• Check that your browser supports the Notification API</p>
              <p>• Some browsers block notifications on localhost - try https://</p>
              <p>• Notifications may be blocked if the tab is not in focus</p>
              <p>• Clear your browser cache if permission requests aren't working</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestNotificationsPage() {
  return (
    <ProtectedRoute>
      <TestNotificationsContent />
    </ProtectedRoute>
  )
} 