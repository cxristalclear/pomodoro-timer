// Persisted timer state, so a running Pomodoro survives a page refresh (#8).
//
// Stored in localStorage rather than the DB on purpose: this is per-device
// ephemeral state ("a timer is running in *this* browser"), not user data worth
// syncing across devices. Keyed by user id so two accounts sharing a browser
// don't inherit each other's session.
//
// Remaining time is deliberately NOT stored. useTimer derives it from
// `endTime`, an absolute wall-clock instant, so a restored session stays
// accurate no matter how long the tab was closed.

export const TIMER_STATE_VERSION = 1

export type SessionType = "work" | "shortBreak" | "longBreak"

export interface PersistedTimerState {
  version: number
  sessionType: SessionType
  /** Cumulative 1-based count of the work session in progress. */
  sessionCount: number
  isRunning: boolean
  /** Full length of the current session, in seconds. */
  duration: number
  /** Absolute ms timestamp the session ends at. null when paused or stopped. */
  endTime: number | null
  /** Seconds left when paused. null when running or stopped. */
  remaining: number | null
  /** Task the session is attributed to, so it saves against the right task. */
  selectedTaskId: number | null
}

const keyFor = (userId: string) => `pomodoro:timer:${userId}`

export function readTimerState(userId: string): PersistedTimerState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(keyFor(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedTimerState
    // Drop anything written by an older shape rather than trying to migrate it —
    // losing one timer session is cheaper than restoring it wrong.
    if (parsed?.version !== TIMER_STATE_VERSION) return null
    return parsed
  } catch {
    // Corrupt JSON, or storage blocked (private mode / disabled cookies).
    // A timer that fails to restore is recoverable; a crash on boot is not.
    return null
  }
}

export function writeTimerState(userId: string, state: Omit<PersistedTimerState, "version">): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      keyFor(userId),
      JSON.stringify({ ...state, version: TIMER_STATE_VERSION }),
    )
  } catch {
    // Quota exceeded or storage unavailable — non-fatal, just means no restore.
  }
}

export function clearTimerState(userId: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(keyFor(userId))
  } catch {
    // Nothing to do; see writeTimerState.
  }
}
