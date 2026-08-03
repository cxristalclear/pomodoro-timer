import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useTimer } from "./useTimer";
import { useTasks } from "./useTasks";
import { useSessions } from "./useSessions";
import { useSettings } from "./useSettings";
import { useAudio } from "./useAudio";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Task, Settings } from "@/contexts/PomodoroContext";
import { pomodoroService } from "@/services/pomodoroService";
import { readTimerState, writeTimerState, type SessionType } from "@/lib/timerPersistence";
import { getNextSession } from "@/lib/sessionCycle";

/** Full length of a session type, in seconds. */
function sessionSeconds(type: SessionType, settings: Settings): number {
  if (type === "work") return settings.workDuration * 60;
  if (type === "shortBreak") return settings.breakDuration * 60;
  return settings.longBreakDuration * 60;
}

export function usePomodoroLogic() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const pathname = usePathname();

  // Settings
  const settingsHook = useSettings(userId);
  const { settings, setSettings, loadSettings, updateSettings, resetSettings, hasTimerSettingsChanged } = settingsHook;

  // Timer
  const [sessionType, setSessionType] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [sessionCount, setSessionCount] = useState(1);
  const timer = useTimer({
    initialDuration:
      sessionType === "work"
        ? settings.workDuration * 60
        : sessionType === "shortBreak"
        ? settings.breakDuration * 60
        : settings.longBreakDuration * 60,
    sessionType,
    onComplete: async () => {
      // Create session when timer completes
      const sessionDuration = sessionType === "work" 
        ? settings.workDuration 
        : sessionType === "shortBreak" 
        ? settings.breakDuration 
        : settings.longBreakDuration;
      
      const taskName = sessionType === "work" 
        ? currentTask || "Work Session" 
        : sessionType === "shortBreak" 
        ? "Short Break" 
        : "Long Break";
      
      console.log("🍅 Timer completed:", {
        sessionType,
        taskName,
        selectedTaskId,
        duration: sessionDuration
      });
      
      // Save session with proper task linking
      if (sessionType === "work" && selectedTaskId) {
        console.log("💾 Saving work session with task_id:", selectedTaskId);
        await saveCompletedSession(selectedTaskId, taskName, sessionDuration);
        
        // Increment pomodoros AFTER session is saved
        console.log("🔢 Incrementing pomodoros for task:", selectedTaskId);
        await incrementTaskPomodoros(selectedTaskId);
      } else {
        // For break sessions, save without task_id
        console.log("💾 Saving break session (no task_id)");
        await saveCompletedSession(null, taskName, sessionDuration);
      }
      
      // Play completion sound
      playSound(sessionType);

      // Always advance the cycle; auto-start only if the user opted in.
      //
      // Previously the advance was nested *inside* the auto-start check, so with
      // autoStartBreaks off a finished work session just sat at 0:00 in the same
      // session type — the cycle never moved on its own.
      const next = getNextSession(sessionType, sessionCount, settings.sessionsUntilLongBreak);
      setSessionType(next.sessionType);
      setSessionCount(next.sessionCount);
      resetTimer(sessionSeconds(next.sessionType, settings));

      const shouldAutoStart = next.sessionType === "work"
        ? settings.autoStartWork
        : settings.autoStartBreaks;
      if (shouldAutoStart) startTimer();
    },
    autoStart: false,
  });
  const {
    time,
    isRunning,
    toggleTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    setTime,
    setIsRunning,
    incrementTime,
    decrementTime,
    getTimerSnapshot,
    restoreTimer,
  } = timer;

  // Tasks
  const tasksHook = useTasks(userId);
  const { 
    tasks, 
    setTasks, 
    newTaskInput, 
    setNewTaskInput, 
    addTask, 
    deleteTask, 
    selectTask, 
    selectTaskByIdNoReorder, 
    currentTask, 
    selectedTaskId, 
    loadTasks, 
    toggleTaskCompletion, 
    updateTask, 
    updateTaskOrder,
    incrementTaskPomodoros,
    getTaskStats,
    clearSelection
  } = tasksHook;

  // Sessions
  const sessionsHook = useSessions(userId);
  const { 
    sessions, 
    setSessions, 
    addSession, 
    saveCompletedSession,
    getSessionsByDate, 
    getTodaysFocusTime, 
    getSessionStats,
    getSessionsForTask,
    getTaskPomodoros,
    loadSessions,
    deleteSessionsByTaskId
  } = sessionsHook;
  const [completedTasks, setCompletedTasks] = useState(0);

  // Audio/Notifications
  const audioHook = useAudio({ soundEnabled: settings.soundEnabled, soundVolume: settings.soundVolume });
  const { testSound, playSound } = audioHook;

  // Data loading state
  const [dataLoading, setDataLoading] = useState(false);

  // Helper to get full duration for a session type
  const getSessionFullDuration = (type: SessionType) => sessionSeconds(type, settings);

  // Reset current session (R)
  const resetCurrentSession = useCallback(() => {
    resetTimer(sessionSeconds(sessionType, settings));
    // Do not change sessionType, sessionCount, or save session
  }, [sessionType, settings, resetTimer]);

  // Skip to next session (S)
  const skipToNextSession = useCallback(async () => {
    // 1. Stop timer
    setIsRunning(false);
    let shouldSaveSession = false;
    // 2. If timer was running and > 50% complete, save session to DB
    if (isRunning) {
      const fullDuration = getSessionFullDuration(sessionType);
      if (fullDuration > 0 && time < fullDuration / 2) {
        shouldSaveSession = false;
      } else {
        shouldSaveSession = true;
      }
    }
    if (shouldSaveSession) {
      // Save session to DB with task tracking
      const sessionDuration = getSessionFullDuration(sessionType) / 60;
      const taskName = sessionType === "work" ? currentTask || "Work Session" : sessionType === "shortBreak" ? "Short Break" : "Long Break";
      
      console.log("⏭️ Skip session - saving session:", {
        sessionType,
        taskName,
        selectedTaskId,
        duration: sessionDuration
      });
      
      // Save session with proper task linking
      if (sessionType === "work" && selectedTaskId) {
        console.log("💾 Saving skipped work session with task_id:", selectedTaskId);
        await saveCompletedSession(selectedTaskId, taskName, sessionDuration);
        
        // Increment pomodoros AFTER session is saved
        console.log("🔢 Incrementing pomodoros for skipped work session:", selectedTaskId);
        await incrementTaskPomodoros(selectedTaskId);
      } else {
        // For break sessions, save without task_id
        console.log("💾 Saving skipped break session (no task_id)");
        await saveCompletedSession(null, taskName, sessionDuration);
      }
    }
    // 3. Advance the cycle using the same rule as natural expiry (#7).
    const next = getNextSession(sessionType, sessionCount, settings.sessionsUntilLongBreak);
    setSessionType(next.sessionType);
    setSessionCount(next.sessionCount);

    // 4. Reset the timer to the new session's full duration. resetTimer (not a
    // bare setTime) so the wall-clock refs are cleared — otherwise startTimer
    // below would resume against the *previous* session's endTime and fire
    // onComplete immediately.
    resetTimer(sessionSeconds(next.sessionType, settings));

    // 5. Check auto-start settings
    const shouldAutoStart = next.sessionType === "work"
      ? settings.autoStartWork
      : settings.autoStartBreaks;
    if (shouldAutoStart) startTimer();
  }, [isRunning, sessionType, sessionCount, settings, resetTimer, startTimer, setIsRunning, setSessionType, setSessionCount, saveCompletedSession, selectedTaskId, incrementTaskPomodoros, currentTask, time]);

  // Cycle to next session type (Down)
  const nextSessionTypeCycle = useCallback(() => {
    let nextType: SessionType;
    if (sessionType === "work") nextType = "shortBreak";
    else if (sessionType === "shortBreak") nextType = "longBreak";
    else nextType = "work";
    setSessionType(nextType);
    // resetTimer rather than setTime, so the wall-clock refs are cleared and a
    // subsequent start doesn't resume against the old session's endTime.
    resetTimer(sessionSeconds(nextType, settings));
    // Do not change sessionCount or save session
  }, [sessionType, setSessionType, resetTimer, settings]);

  // Cycle to previous session type (Up)
  const previousSessionType = useCallback(() => {
    let prevType: SessionType;
    if (sessionType === "work") prevType = "longBreak";
    else if (sessionType === "shortBreak") prevType = "work";
    else prevType = "shortBreak";
    setSessionType(prevType);
    resetTimer(sessionSeconds(prevType, settings));
    // Do not change sessionCount or save session
  }, [sessionType, setSessionType, resetTimer, settings]);

  // Next task function - completes current task and moves to next session
  const nextTask = useCallback(async () => {
    if (!selectedTaskId || !userId) return;

    // Find the current task
    const currentTask = tasks.find(task => task.id === selectedTaskId);
    if (!currentTask || currentTask.completed) return;

    // Only complete the current task if the timer is running
    if (isRunning) {
      await toggleTaskCompletion(selectedTaskId);
    } else {
      // If skipping (not completing), move the current task to the bottom of the active list
      const activeTasks = tasks.filter(t => !t.completed);
      const completedTasks = tasks.filter(t => t.completed);
      const currentTaskIndex = activeTasks.findIndex(t => t.id === selectedTaskId);
      if (currentTaskIndex !== -1) {
        const [skippedTask] = activeTasks.splice(currentTaskIndex, 1);
        const newActiveTasks = [...activeTasks, skippedTask];
        const newTasks = [...newActiveTasks, ...completedTasks];
        setTasks(newTasks);
        if (typeof updateTaskOrder === 'function') {
          await updateTaskOrder(newTasks);
        }
        // Select the next available active task by index (not by id)
        if (activeTasks.length > 0) {
          const nextIndex = currentTaskIndex < activeTasks.length ? currentTaskIndex : 0;
          const nextTask = newActiveTasks[nextIndex];
          if (nextTask && !nextTask.completed) {
            selectTaskByIdNoReorder(nextTask.id);
          }
        }
      }
    }

    // If we're in a work session and timer is running, move to break
    if (sessionType === "work" && isRunning) {
      // Same shared cycle rule as the other two exit paths (#7).
      const next = getNextSession(sessionType, sessionCount, settings.sessionsUntilLongBreak);
      setSessionType(next.sessionType);
      setSessionCount(next.sessionCount);
      resetTimer(sessionSeconds(next.sessionType, settings));

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        startTimer();
      }
    }
  }, [selectedTaskId, userId, tasks, toggleTaskCompletion, selectTaskByIdNoReorder, setTasks, updateTaskOrder, sessionType, isRunning, sessionCount, settings, resetTimer, startTimer]);

  // Select task and navigate to timer
  const selectTaskAndNavigate = useCallback(async (task: Task) => {
    // First select the task (this will trigger the reordering)
    await selectTask(task);
    // Then navigate
    router.push("/");
    // Start the timer if it isn't already running
    setTimeout(() => {
      if (!isRunning) {
        toggleTimer();
      }
    }, 100); // slight delay to ensure navigation/render
  }, [selectTask, router, isRunning, toggleTimer]);

  // Keyboard shortcuts.
  //
  // On "/", TimerDisplay mounts useTimerShortcuts, which owns the timer keys
  // (Space, →, ↓, and more). Handing the same keys to this global hook as well
  // meant both listeners fired for one keypress (#6): two session rows and two
  // pomodoro increments per ↓, and a complete-then-uncomplete race per →.
  //
  // So the timer page keeps its own richer handler and this hook contributes
  // navigation only; every other page still gets global timer control.
  const timerPageOwnsTimerKeys = pathname === "/";
  useKeyboardShortcuts({
    ...(timerPageOwnsTimerKeys
      ? {}
      : { toggleTimer, resetTimer, nextTask, skipToNextSession }),
    goTasks: () => router.push("/tasks"),
    goAnalytics: () => router.push("/analytics"),
    goSettings: () => router.push("/settings"),
    goMenu: () => router.push("/menu"),
    goHelp: () => router.push("/help"),
  });

  // ---- Timer persistence (#8) --------------------------------------------
  // The timer used to live entirely in memory, so any refresh dropped the
  // running session, its place in the cycle, and the elapsed work (no session
  // row is written on unload, so that time was simply lost).

  // Which user's timer we have already restored. Held as state, not a ref, on
  // purpose: the persist effect below keys on it so that it first runs on the
  // render *after* hydration. Keyed by id rather than a boolean so signing in as
  // a different user on the same browser hydrates again instead of being skipped.
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  // Task id read from storage, applied once tasks have loaded.
  const pendingTaskIdRef = useRef<number | null>(null);

  // Restore once per user, as soon as we know whose timer to read.
  useEffect(() => {
    if (!userId || hydratedUserId === userId) return;

    const saved = readTimerState(userId);
    if (saved) {
      setSessionType(saved.sessionType);
      setSessionCount(saved.sessionCount);
      restoreTimer(saved);
      pendingTaskIdRef.current = saved.selectedTaskId;
    }

    // Set last, and unconditionally: it both opens the gate on persistence and
    // marks this user as done, whether or not there was anything to restore.
    setHydratedUserId(userId);
  }, [userId, hydratedUserId, restoreTimer]);

  // Re-select the task the restored session was being attributed to, so it
  // saves against the right task. Waits for tasks to load, and skips silently if
  // the task was deleted in the meantime.
  useEffect(() => {
    const pending = pendingTaskIdRef.current;
    if (pending === null || tasks.length === 0) return;
    pendingTaskIdRef.current = null;
    if (tasks.some((t) => t.id === pending)) {
      selectTaskByIdNoReorder(pending);
    }
  }, [tasks, selectTaskByIdNoReorder]);

  // Persist on transitions only — start, pause, session change, task change.
  // Deliberately not keyed on `time`: remaining time is derived from the
  // absolute endTime, so writing on every 100ms tick would be pure waste.
  //
  // The hydratedUserId guard is load-bearing. Without it this effect also fires
  // in the same commit as the restore above, where `sessionType`/`sessionCount`
  // still hold the pre-restore render's values — writing a half-stale snapshot
  // back over the good one.
  useEffect(() => {
    if (!userId || hydratedUserId !== userId) return;
    const snapshot = getTimerSnapshot();
    writeTimerState(userId, {
      sessionType,
      sessionCount,
      isRunning,
      duration: snapshot.duration,
      endTime: snapshot.endTime,
      remaining: snapshot.remaining,
      selectedTaskId,
    });
  }, [userId, hydratedUserId, sessionType, sessionCount, isRunning, selectedTaskId, getTimerSnapshot]);

  // Wrapper for settings page: only takes newSettings
  const updateSettingsForPage = async (newSettings: any) => {
    return updateSettings(newSettings, isRunning, resetTimer);
  };

  // Previous task function
  const previousTask = useCallback(() => {
    if (!selectedTaskId) return;
    const activeTasks = tasks.filter(t => !t.completed);
    const currentIndex = activeTasks.findIndex(t => t.id === selectedTaskId);
    if (currentIndex > 0) {
      const prevTask = activeTasks[currentIndex - 1];
      if (prevTask) {
        selectTaskByIdNoReorder(prevTask.id);
      }
    }
  }, [selectedTaskId, tasks, selectTaskByIdNoReorder]);

  // Toggle fullscreen/focus mode (stub)
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  // Toggle mute (stub)
  const toggleMute = useCallback(() => {
    // Implement mute/unmute logic here
    // This would likely toggle soundEnabled in settings
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, [setSettings]);

  // Enhanced task state
  const [taskFilters, setTaskFilters] = useState({});
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);

  // Enhanced task methods
  const addTaskWithDetails = useCallback(async (taskDetails: Partial<Task>) => {
    if (!userId) return;
    try {
      const { data, error } = await pomodoroService.tasks.create(userId, {
        name: taskDetails.name || "New Task",
        position: tasks.length,
        estimatedPomodoros: taskDetails.estimatedPomodoros || 1,
        category: taskDetails.category,
        priority: taskDetails.priority,
        dueDate: taskDetails.dueDate,
        notes: taskDetails.notes,
        parentTaskId: taskDetails.parentTaskId
      });
      if (error) {
        console.error("Error adding task with details:", error);
        return;
      }
      if (data) {
        const newTask: Task = {
          id: data.id,
          name: data.name,
          completed: data.completed || false,
          position: data.position,
          estimatedPomodoros: data.estimated_pomodoros || 1,
          actualPomodoros: data.actual_pomodoros || 0,
          createdAt: data.created_at,
          completedAt: data.completed_at,
          category: data.category,
          priority: data.priority,
          dueDate: data.due_date,
          notes: data.notes,
          isArchived: data.is_archived || false,
          parentTaskId: data.parent_task_id
        };
        setTasks((prev) => [...prev, newTask]);
      }
    } catch (error) {
      console.error("Exception adding task with details:", error);
    }
  }, [userId, tasks.length, setTasks]);

  const bulkUpdateTasks = useCallback(async (bulkUpdate: any) => {
    if (!userId) return;
    try {
      const { error } = await pomodoroService.tasks.bulkUpdate(userId, bulkUpdate.taskIds, bulkUpdate.updates);
      if (error) {
        console.error("Error bulk updating tasks:", error);
        return;
      }
      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          bulkUpdate.taskIds.includes(task.id)
            ? { ...task, ...bulkUpdate.updates }
            : task
        )
      );
    } catch (error) {
      console.error("Exception bulk updating tasks:", error);
    }
  }, [userId, setTasks]);

  const archiveTask = useCallback(async (taskId: number) => {
    if (!userId) return;
    try {
      const { error } = await pomodoroService.tasks.archive(userId, taskId);
      if (error) {
        console.error("Error archiving task:", error);
        return;
      }
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, isArchived: true } : task
        )
      );
    } catch (error) {
      console.error("Exception archiving task:", error);
    }
  }, [userId, setTasks]);

  const unarchiveTask = useCallback(async (taskId: number) => {
    if (!userId) return;
    try {
      const { error } = await pomodoroService.tasks.unarchive(userId, taskId);
      if (error) {
        console.error("Error unarchiving task:", error);
        return;
      }
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, isArchived: false } : task
        )
      );
    } catch (error) {
      console.error("Exception unarchiving task:", error);
    }
  }, [userId, setTasks]);

  const searchTasks = useCallback((query: string) => {
    setTaskFilters((prev: any) => ({ ...prev, searchQuery: query }));
  }, []);

  const filterTasks = useCallback((filters: any) => {
    setTaskFilters(filters);
  }, []);

  const clearFilters = useCallback(() => {
    setTaskFilters({});
  }, []);

  const toggleTaskSelection = useCallback((taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  const selectAllTasks = useCallback(() => {
    setSelectedTasks(tasks.map((task) => task.id));
  }, [tasks]);

  const clearTaskSelection = useCallback(() => {
    setSelectedTasks([]);
  }, []);

  const toggleBulkEditMode = useCallback(() => {
    setBulkEditMode((prev) => !prev);
    if (bulkEditMode) {
      clearTaskSelection();
    }
  }, [bulkEditMode, clearTaskSelection]);

  const getAvailableCategories = useCallback(() => {
    const categories = [...new Set(tasks.map((task) => task.category).filter(Boolean))];
    return categories as string[];
  }, [tasks]);

  const createCategory = useCallback((category: string) => {
    // This could be implemented to save categories to a separate table
    // For now, categories are just created when assigned to tasks
    console.log("Creating category:", category);
  }, []);

  const getSubtasks = useCallback((parentId: number) => {
    return tasks.filter((task) => task.parentTaskId === parentId);
  }, [tasks]);

  const createSubtask = useCallback(async (parentId: number, taskDetails: Partial<Task>) => {
    await addTaskWithDetails({
      ...taskDetails,
      parentTaskId: parentId
    });
  }, [addTaskWithDetails]);

  return {
    // Timer
    time,
    isRunning,
    sessionType,
    sessionCount,
    toggleTimer,
    resetTimer,
    incrementTime,
    decrementTime,

    // Tasks
    tasks,
    currentTask,
    selectedTaskId,
    newTaskInput,
    setNewTaskInput,
    addTask,
    deleteTask,
    selectTask,
    selectTaskAndNavigate,
    toggleTaskCompletion,
    updateTask,
    setTasks,
    nextTask,
    incrementTaskPomodoros,
    getTaskStats,
    loadTasks,
    clearSelection,

    // Enhanced task state
    taskFilters,
    selectedTasks,
    bulkEditMode,

    // Enhanced task actions
    addTaskWithDetails,
    bulkUpdateTasks,
    archiveTask,
    unarchiveTask,
    searchTasks,
    filterTasks,
    clearFilters,
    toggleTaskSelection,
    selectAllTasks,
    clearTaskSelection,
    toggleBulkEditMode,

    // Category management
    getAvailableCategories,
    createCategory,

    // Task hierarchy
    getSubtasks,
    createSubtask,

    // Sessions
    sessions,
    loadSessions,
    completedTasks,
    getSessionsByDate,
    getTodaysFocusTime,
    getSessionStats,
    getSessionsForTask,
    getTaskPomodoros,
    deleteSessionsByTaskId,

    // Settings
    settings,
    setSettings: async (settingsOrUpdater: any) => {
      // If passed a function, resolve it
      let nextSettings = settingsOrUpdater;
      if (typeof settingsOrUpdater === "function") {
        nextSettings = settingsOrUpdater(settings);
      }
      await updateSettings(nextSettings, isRunning, resetTimer);
    },
    updateSettings: updateSettingsForPage,
    resetSettings,
    hasTimerSettingsChanged,

    // Audio/Notifications
    testSound,
    playSound,

    // Loading
    dataLoading,

    // Skip to next session
    skipToNextSession,

    // Previous task
    previousTask,

    // Previous session type
    previousSessionType,

    // Toggle fullscreen
    toggleFullscreen,

    // Toggle mute
    toggleMute,
  };
}
