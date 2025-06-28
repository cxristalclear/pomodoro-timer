"use client"

import type React from "react"
import { X } from "lucide-react"
import { usePomodoro } from "@/contexts/PomodoroContext"
import Link from "next/link"

/**
 * Navigation menu component with links to all app sections
 */
export const NavMenu: React.FC = () => {
  const { setCurrentView } = usePomodoro()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Menu header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Menu</h1>
        <button
          onClick={() => setCurrentView("timer")}
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </header>

      {/* Navigation links */}
      <nav className="flex-1 p-6">
        <div className="space-y-2 max-w-md mx-auto">
          <Link
            href="/"
            className="block w-full text-left p-4 hover:bg-gray-900 rounded transition-colors text-gray-300"
          >
            Timer
          </Link>
          <Link
            href="/tasks"
            className="block w-full text-left p-4 hover:bg-gray-900 rounded transition-colors text-gray-300"
          >
            Tasks
          </Link>
          <Link
            href="/analytics"
            className="block w-full text-left p-4 hover:bg-gray-900 rounded transition-colors text-gray-300"
          >
            Analytics
          </Link>
          <Link
            href="/settings"
            className="block w-full text-left p-4 hover:bg-gray-900 rounded transition-colors text-gray-300"
          >
            Settings
          </Link>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          <p>Space: play/pause</p>
          <p>Ctrl+R: reset</p>
          <p>Use navigation links to switch between pages</p>
        </div>
      </nav>
    </div>
  )
}
