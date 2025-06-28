"use client"

import type React from "react"
import { X, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"

/**
 * Navigation menu component with links to all app sections
 */
export const NavMenu: React.FC = () => {
  const { signOut, user } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Menu header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Menu</h1>
        <Link href="/" className="text-white p-2 hover:bg-gray-900 rounded transition-colors" aria-label="Close menu">
          <X size={24} />
        </Link>
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

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full text-left p-4 hover:bg-gray-900 rounded transition-colors text-gray-300 mt-8 border-t border-gray-800 pt-6"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* User info and keyboard shortcuts */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          {user?.email && <p className="mb-4 text-gray-500">Signed in as {user.email}</p>}
          <p>Space: play/pause</p>
          <p>Ctrl+R: reset</p>
          <p>Use navigation links to switch between pages</p>
        </div>
      </nav>
    </div>
  )
}
