import type { SessionType } from "./timerPersistence"

/**
 * The single source of truth for how the Pomodoro cycle advances (#7).
 *
 * Previously each of the three exit paths — natural expiry, manual skip, and
 * "next task" — computed this inline, and they disagreed. Two used
 * `count % n === 0` while reading a *stale* count from the render closure
 * (the increment was queued on the line above), and the third used `count < n`
 * and reset the counter to 1. Whether you got a long break depended on how the
 * session happened to end, and the natural-expiry path was off by one.
 *
 * `sessionCount` is cumulative and 1-based: the number of the work session in
 * progress. TimerDisplay's "session X.Y" readout derives from that, so it must
 * not reset each cycle.
 *
 * The count advances only when a *break* ends, never when work ends. That is
 * what makes the modulo correct — while work session N is running the count
 * reads N, so N is followed by a long break exactly when N is a multiple of
 * sessionsUntilLongBreak.
 *
 * Kept free of React and of the Settings type so it stays directly testable.
 */
export function getNextSession(
  sessionType: SessionType,
  sessionCount: number,
  sessionsUntilLongBreak: number,
): { sessionType: SessionType; sessionCount: number } {
  if (sessionType === "work") {
    // Guard the modulo: a 0 or negative setting would otherwise make every
    // break a long one (n === 0 gives NaN) instead of degrading to short breaks.
    const dueForLongBreak =
      sessionsUntilLongBreak > 0 && sessionCount % sessionsUntilLongBreak === 0
    return {
      sessionType: dueForLongBreak ? "longBreak" : "shortBreak",
      sessionCount,
    }
  }
  return { sessionType: "work", sessionCount: sessionCount + 1 }
}

/**
 * Whether skipping the current session should record it, and for how long (#29).
 *
 * Takes `remainingSeconds` because that is what the timer actually holds, and
 * converts to elapsed internally — the original bug was a comparison written
 * against remaining time while reading as though it were elapsed
 * (`time < fullDuration / 2` to mean "more than half done"), which inverted the
 * rule in both directions: a session skipped after 7 seconds banked a full
 * pomodoro, and one skipped at 96% recorded nothing.
 *
 * `minutes` is the time actually spent, rounded, floored at 1. The
 * natural-completion path records the session's nominal length because it really
 * did run to the end; a skipped session did not, so recording full length would
 * overstate every focus-time total derived from `sessions.duration`.
 */
export function getSkipOutcome(
  isRunning: boolean,
  remainingSeconds: number,
  fullDurationSeconds: number,
): { save: boolean; minutes: number } {
  const elapsed = Math.max(0, fullDurationSeconds - remainingSeconds)
  const save =
    isRunning && fullDurationSeconds > 0 && elapsed >= fullDurationSeconds / 2
  return { save, minutes: Math.max(1, Math.round(elapsed / 60)) }
}
