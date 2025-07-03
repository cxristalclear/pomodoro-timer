import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { PomodoroProvider } from "@/components/PomodoroProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pomodoro Timer",
  description: "A productivity timer application using the Pomodoro Technique",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=pause,play_arrow,replay"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider><PomodoroProvider>{children}</PomodoroProvider></AuthProvider>
      </body>
    </html>
  )
}
