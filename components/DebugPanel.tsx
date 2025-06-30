"use client"

import { usePomodoro } from "@/contexts/PomodoroContext"
import { useState } from "react"

/**
 * Debug panel component to test all save functionalities
 * Only shows in development mode
 */
export const DebugPanel: React.FC = () => {
  const { 
    addTask, 
    newTaskInput, 
    setNewTaskInput, 
    tasks, 
    settings, 
    updateSettings,
    sessions
  } = usePomodoro()
  
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testTaskCreation = async () => {
    try {
      const testTaskName = `Test Task ${Date.now()}`
      setNewTaskInput(testTaskName)
      await addTask()
      addTestResult(`Task creation: ${tasks.length} tasks now loaded`)
    } catch (error) {
      addTestResult(`Task creation failed: ${error}`)
    }
  }

  const testSettingsUpdate = async () => {
    try {
      const newSettings = {
        ...settings,
        workDuration: settings.workDuration + 1
      }
      await updateSettings(newSettings)
      addTestResult(`Settings update: work duration now ${newSettings.workDuration}`)
    } catch (error) {
      addTestResult(`Settings update failed: ${error}`)
    }
  }

  const testSessionCreation = async () => {
    try {
      // Test session creation by completing a pomodoro session
      addTestResult(`Session creation: ${sessions.length} sessions currently loaded`)
    } catch (error) {
      addTestResult(`Session creation failed: ${error}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="text-sm font-semibold mb-2">Debug Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testTaskCreation}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
        >
          Test Task Creation
        </button>
        
        <button
          onClick={testSettingsUpdate}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs ml-2"
        >
          Test Settings
        </button>
        
        <button
          onClick={testSessionCreation}
          className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs ml-2"
        >
          Test Session
        </button>
        
        <button
          onClick={clearResults}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs ml-2"
        >
          Clear
        </button>
      </div>
      
      <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
        {testResults.map((result, index) => (
          <div key={index} className="text-gray-300">{result}</div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Tasks: {tasks.length} | Sessions: {sessions.length}
      </div>
    </div>
  )
} 