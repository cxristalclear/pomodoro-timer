"use client"

import type React from "react"
import { X, Keyboard, Clock, Target, BarChart3, Settings, Menu, ChevronRight, Info } from "lucide-react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { BreadcrumbNav, useBreadcrumbs } from "@/components/BreadcrumbNav"
import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * Help & Shortcuts page with usage guide
 */
function HelpPageContent() {
  const pathname = usePathname()
  const breadcrumbs = useBreadcrumbs(pathname)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-900">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800/50 rounded-lg">
              <Info className="text-blue-400" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Help & Shortcuts</h1>
              <p className="text-gray-400 text-sm">Master your Pomodoro workflow</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Back to timer"
          >
            <X size={24} />
          </Link>
        </div>
        
        {/* Breadcrumb */}
        <div className="px-6 pb-4">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 py-8 max-w-4xl mx-auto">
        {/* Keyboard Shortcuts Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-800/50 rounded-lg">
              <Keyboard className="text-blue-400" size={20} />
            </div>
            <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timer Controls */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 text-blue-200">Timer Controls</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Start/Pause Timer</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Space</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Reset Timer</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Ctrl+R</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Skip to Next Session</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">↓</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Complete Task & Next</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">→</kbd>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 text-blue-200">Navigation</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Go to Tasks</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Ctrl+T</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Go to Analytics</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Ctrl+A</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Go to Settings</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Ctrl+S</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Go to Menu</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Ctrl+M</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Go to Help</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Ctrl+H</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Close Modal/Go Back</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono">Escape</kbd>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Guide */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-800/50 rounded-lg">
              <Clock className="text-blue-400" size={20} />
            </div>
            <h2 className="text-xl font-semibold">How to Use</h2>
          </div>

          <div className="space-y-6">
            {/* Getting Started */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4 text-blue-200">Getting Started</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white mt-0.5">1</div>
                  <div>
                    <p className="text-gray-300">Create your first task in the Tasks page</p>
                    <p className="text-gray-500 text-sm mt-1">Add tasks with estimated Pomodoro counts for better time management</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white mt-0.5">2</div>
                  <div>
                    <p className="text-gray-300">Select a task to focus on</p>
                    <p className="text-gray-500 text-sm mt-1">Click on any task to select it and automatically navigate to the timer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white mt-0.5">3</div>
                  <div>
                    <p className="text-gray-300">Start your Pomodoro session</p>
                    <p className="text-gray-500 text-sm mt-1">Press Space or click the play button to begin your focused work session</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white mt-0.5">4</div>
                  <div>
                    <p className="text-gray-300">Take breaks and review progress</p>
                    <p className="text-gray-500 text-sm mt-1">Follow the break schedule and check your analytics to track productivity</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="text-blue-400" size={20} />
                  <h3 className="font-medium">Task Management</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Create and organize tasks</li>
                  <li>• Set estimated Pomodoros</li>
                  <li>• Track actual vs. estimated</li>
                  <li>• Drag to reorder tasks</li>
                  <li>• Double-click to edit</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="text-blue-400" size={20} />
                  <h3 className="font-medium">Smart Timer</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• 25-minute work sessions</li>
                  <li>• 5-minute short breaks</li>
                  <li>• 15-minute long breaks</li>
                  <li>• Auto-progression</li>
                  <li>• Custom durations</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="text-blue-400" size={20} />
                  <h3 className="font-medium">Analytics</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Daily focus time tracking</li>
                  <li>• Task completion rates</li>
                  <li>• Productivity insights</li>
                  <li>• Historical data view</li>
                  <li>• Progress visualization</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tips & Best Practices */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-800/50 rounded-lg">
              <Settings className="text-blue-400" size={20} />
            </div>
            <h2 className="text-xl font-semibold">Productivity Tips</h2>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-300 font-medium">Break large tasks into smaller ones</p>
                  <p className="text-gray-500 text-sm mt-1">Tasks requiring more than 3-4 Pomodoros should be split for better focus</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-300 font-medium">Use realistic time estimates</p>
                  <p className="text-gray-500 text-sm mt-1">Start with higher estimates and adjust as you learn your actual pace</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-300 font-medium">Take breaks seriously</p>
                  <p className="text-gray-500 text-sm mt-1">Step away from your workstation to maximize the restorative effect</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-300 font-medium">Review your analytics regularly</p>
                  <p className="text-gray-500 text-sm mt-1">Use the data to identify patterns and optimize your workflow</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-300 font-medium">Customize settings to your needs</p>
                  <p className="text-gray-500 text-sm mt-1">Adjust timer durations, sounds, and auto-start options for optimal focus</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-800/50 rounded-lg">
              <Menu className="text-blue-400" size={20} />
            </div>
            <h2 className="text-xl font-semibold">Quick Navigation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/tasks" 
              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Target className="text-blue-400" size={20} />
                <div>
                  <p className="text-gray-300 font-medium">Manage Tasks</p>
                  <p className="text-gray-500 text-sm">Create, edit, and organize your tasks</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </Link>

            <Link 
              href="/analytics" 
              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-400" size={20} />
                <div>
                  <p className="text-gray-300 font-medium">View Analytics</p>
                  <p className="text-gray-500 text-sm">Track your productivity and progress</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </Link>

            <Link 
              href="/settings" 
              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="text-blue-400" size={20} />
                <div>
                  <p className="text-gray-300 font-medium">Customize Settings</p>
                  <p className="text-gray-500 text-sm">Adjust timer, sounds, and preferences</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </Link>

            <Link 
              href="/" 
              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="text-blue-400" size={20} />
                <div>
                  <p className="text-gray-300 font-medium">Back to Timer</p>
                  <p className="text-gray-500 text-sm">Return to your Pomodoro session</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <HelpPageContent />
    </ProtectedRoute>
  )
} 