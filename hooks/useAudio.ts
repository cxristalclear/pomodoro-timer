// Audio and notification hook for Pomodoro
import { useRef, useEffect } from "react"

export function useAudio({ soundEnabled, soundVolume }: { soundEnabled: boolean; soundVolume: number }) {
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        // Audio context not available
      }
    }
  }, [])

  // Play notification sound
  const playSound = (type: "work" | "shortBreak" | "longBreak") => {
    if (!soundEnabled || !audioContextRef.current) return
    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      gainNode.gain.value = soundVolume
      oscillator.frequency.value = type === "work" ? 800 : 600
      oscillator.start()
      oscillator.stop(audioContextRef.current.currentTime + (type === "work" ? 0.3 : 0.2))
    } catch (error) {
      // Audio playback failed
    }
  }

  // Test sound utility
  const testSound = () => playSound("work")

  return {
    audioContextRef,
    playSound,
    testSound,
  }
}
