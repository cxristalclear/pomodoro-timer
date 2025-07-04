"use client"

import type React from "react"
import { X, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"
import { useRouter } from "next/navigation"

/**
 * Navigation menu component with links to all app sections
 */
export const NavMenu: React.FC = () => {
  const { signOut, user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleNavigation = (href: string) => {
    console.log("Navigating to:", href)
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Menu header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-900">
        <h1 className="text-xl font-light">Menu</h1>
        <button 
          onClick={() => handleNavigation("/")}
          className="text-white p-2 hover:bg-gray-900 rounded transition-colors" 
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </header>

      {/* Navigation links */}
      <nav className="flex-1 p-6">
        <div className="space-y-2 max-w-md mx-auto">
          <button
            onClick={() => handleNavigation("/")}
            className="block w-full text-left p-4 hover:bg-gray-900 active:bg-gray-800 rounded transition-colors text-gray-300 touch-manipulation"
          >
            Timer
          </button>
          <button
            onClick={() => handleNavigation("/tasks")}
            className="block w-full text-left p-4 hover:bg-gray-900 active:bg-gray-800 rounded transition-colors text-gray-300 touch-manipulation"
          >
            Tasks
          </button>
          <button
            onClick={() => handleNavigation("/analytics")}
            className="block w-full text-left p-4 hover:bg-gray-900 active:bg-gray-800 rounded transition-colors text-gray-300 touch-manipulation"
          >
            Analytics
          </button>
          <button
            onClick={() => handleNavigation("/settings")}
            className="block w-full text-left p-4 hover:bg-gray-900 active:bg-gray-800 rounded transition-colors text-gray-300 touch-manipulation"
          >
            Settings
          </button>
          <button
            onClick={() => handleNavigation("/help")}
            className="block w-full text-left p-4 hover:bg-gray-900 active:bg-gray-800 rounded transition-colors text-gray-300 touch-manipulation"
          >
            Help
          </button>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full text-left p-4 hover:bg-gray-900 active:bg-gray-800 rounded transition-colors text-gray-300 mt-8 border-t border-gray-800 pt-6 touch-manipulation"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* User info and keyboard shortcuts */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          {user?.email && <p className="mb-4 text-gray-500">Signed in as {user.email}</p>}
          <div className="space-y-1 mb-4">
            <p><kbd className="bg-gray-700 px-1 rounded">Space</kbd> Play/Pause</p>
            <p><kbd className="bg-gray-700 px-1 rounded">Ctrl+R</kbd> Reset</p>
            <p><kbd className="bg-gray-700 px-1 rounded">Ctrl+H</kbd> Help</p>
          </div>
          <p className="text-gray-500">Touch and hold menu items for quick access</p>
        </div>
      </nav>
    </div>
  )
}
