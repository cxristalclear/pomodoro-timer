// Audio and notification hook for Pomodoro
import { useRef, useEffect } from "react"

export function useAudio({ soundEnabled, soundVolume }: { soundEnabled: boolean; soundVolume: number }) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const notificationPermissionRef = useRef(false)

  // Initialize audio context and notification permission
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        // Audio context not available
      }
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          notificationPermissionRef.current = permission === "granted"
        })
      } else if (Notification.permission === "granted") {
        notificationPermissionRef.current = true
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

  // Request notification permission
  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission === "granted"
      })
    }
  }

  // Check if notifications are enabled
  const areNotificationsEnabled = () => {
    return notificationPermissionRef.current
  }

  // Send browser notification
  const sendNotification = (title: string, options?: NotificationOptions) => {
    console.log("🔔 sendNotification called with:", title, options);
    
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        console.log("🔔 Notification permission:", Notification.permission);
        
        if (Notification.permission === "granted") {
          try {
            console.log("🔔 Creating notification...");
            new Notification(title, options)
            console.log("✅ Notification created successfully");
          } catch (error) {
            console.warn("❌ Failed to show notification:", error)
          }
        } else if (Notification.permission === "default") {
          console.log("🔔 Requesting notification permission...");
          // Auto-request permission if not yet decided
          Notification.requestPermission().then((permission) => {
            console.log("🔔 Permission result:", permission);
            notificationPermissionRef.current = permission === "granted"
            if (permission === "granted") {
              try {
                console.log("🔔 Creating notification after permission grant...");
                new Notification(title, options)
                console.log("✅ Notification created successfully after permission");
              } catch (error) {
                console.warn("❌ Failed to show notification:", error)
              }
            }
          })
        } else {
          console.log("🚫 Notification permission denied");
        }
        // If permission is denied, silently fail
      } else {
        console.log("🚫 Notifications not supported in this browser");
      }
    } else {
      console.log("🚫 Window not available");
    }
  }

  // Test sound utility
  const testSound = () => playSound("work")

  return {
    audioContextRef,
    notificationPermissionRef,
    playSound,
    requestNotificationPermission,
    areNotificationsEnabled,
    sendNotification,
    testSound,
  }
}
