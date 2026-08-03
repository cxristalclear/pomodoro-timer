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
