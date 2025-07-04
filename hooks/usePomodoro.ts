import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTimer } from "./useTimer";
import { useTasks } from "./useTasks";
import { useSessions } from "./useSessions";
import { useSettings } from "./useSettings";
import { useAudio } from "./useAudio";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useEffect, useState, useCallback } from "react";
import type { Task } from "@/contexts/PomodoroContext";
import { pomodoroService } from "@/services/pomodoroService";

export function usePomodoroLogic() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const router = useRouter();

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
      
      // Auto-start next session if enabled
      if (sessionType === "work" && settings.autoStartBreaks) {
        // Move to break
        setSessionCount(prev => prev + 1);
        const nextSessionType = sessionCount % settings.sessionsUntilLongBreak === 0 ? "longBreak" : "shortBreak";
        setSessionType(nextSessionType);
        const newDuration = nextSessionType === "longBreak" 
          ? settings.longBreakDuration * 60 
          : settings.breakDuration * 60;
        resetTimer(newDuration);
        toggleTimer();
      } else if ((sessionType === "shortBreak" || sessionType === "longBreak") && settings.autoStartWork) {
        // Move to work
        setSessionType("work");
        resetTimer(settings.workDuration * 60);
        toggleTimer();
      }
    },
    autoStart: false,
  });
  const { time, isRunning, toggleTimer, resetTimer, setTime, setIsRunning, incrementTime, decrementTime } = timer;

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
    getTaskStats
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
    getTaskPomodoros
  } = sessionsHook;
  const [completedTasks, setCompletedTasks] = useState(0);

  // Audio/Notifications
  const audioHook = useAudio({ soundEnabled: settings.soundEnabled, soundVolume: settings.soundVolume });
  const { testSound, playSound } = audioHook;

  // Data loading state
  const [dataLoading, setDataLoading] = useState(false);

  // Helper to get full duration for a session type
  const getSessionFullDuration = (type: "work" | "shortBreak" | "longBreak") => {
    if (type === "work") return settings.workDuration * 60;
    if (type === "shortBreak") return settings.breakDuration * 60;
    return settings.longBreakDuration * 60;
  };

  // Reset current session (R)
  const resetCurrentSession = useCallback(() => {
    setIsRunning(false);
    const fullDuration = getSessionFullDuration(sessionType);
    setTime(fullDuration);
    // Do not change sessionType, sessionCount, or save session
  }, [sessionType, settings, setTime]);

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
    // 3. Increment session count if leaving a WORK session
    let newSessionCount = sessionCount;
    let nextSessionType = sessionType;
    if (sessionType === "work") {
      if (sessionCount < settings.sessionsUntilLongBreak) {
        nextSessionType = "shortBreak";
        newSessionCount = sessionCount + 1;
      } else {
        nextSessionType = "longBreak";
        newSessionCount = 1;
      }
    } else if (sessionType === "shortBreak" || sessionType === "longBreak") {
      nextSessionType = "work";
      // sessionCount stays the same
    }
    setSessionType(nextSessionType);
    setSessionCount(newSessionCount);
    // 5. Set timer to new session's full duration
    const newDuration = getSessionFullDuration(nextSessionType);
    setTime(newDuration);
    // 6. Check auto-start settings
    if ((nextSessionType === "shortBreak" || nextSessionType === "longBreak") && settings.autoStartBreaks) {
      setIsRunning(true);
    } else if (nextSessionType === "work" && settings.autoStartWork) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [isRunning, sessionType, sessionCount, settings, setTime, setIsRunning, setSessionType, setSessionCount, saveCompletedSession, selectedTaskId, incrementTaskPomodoros, currentTask, time]);

  // Cycle to next session type (Down)
  const nextSessionTypeCycle = useCallback(() => {
    setIsRunning(false);
    let nextType: "work" | "shortBreak" | "longBreak";
    if (sessionType === "work") nextType = "shortBreak";
    else if (sessionType === "shortBreak") nextType = "longBreak";
    else nextType = "work";
    setSessionType(nextType);
    setTime(getSessionFullDuration(nextType));
    // Do not change sessionCount or save session
  }, [sessionType, setSessionType, setTime, settings]);

  // Cycle to previous session type (Up)
  const previousSessionType = useCallback(() => {
    setIsRunning(false);
    let prevType: "work" | "shortBreak" | "longBreak";
    if (sessionType === "work") prevType = "longBreak";
    else if (sessionType === "shortBreak") prevType = "work";
    else prevType = "shortBreak";
    setSessionType(prevType);
    setTime(getSessionFullDuration(prevType));
    // Do not change sessionCount or save session
  }, [sessionType, setSessionType, setTime, settings]);

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
      // Increment session count
      setSessionCount(prev => prev + 1);
      
      // Determine next session type
      const nextSessionType = sessionCount % settings.sessionsUntilLongBreak === 0 ? "longBreak" : "shortBreak";
      setSessionType(nextSessionType);
      
      // Reset timer with new duration
      const newDuration = nextSessionType === "longBreak" 
        ? settings.longBreakDuration * 60 
        : settings.breakDuration * 60;
      
      resetTimer(newDuration);
      
      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        toggleTimer();
      }
    }
  }, [selectedTaskId, userId, tasks, toggleTaskCompletion, selectTaskByIdNoReorder, setTasks, updateTaskOrder, sessionType, isRunning, sessionCount, settings, resetTimer, toggleTimer]);

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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    toggleTimer,
    resetTimer,
    nextTask,
    skipToNextSession,
    goTasks: () => router.push("/tasks"),
    goAnalytics: () => router.push("/analytics"),
    goSettings: () => router.push("/settings"),
    goMenu: () => router.push("/menu"),
  });
  const { shortcuts } = useKeyboardShortcuts({});

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
    completedTasks,
    getSessionsByDate,
    getTodaysFocusTime,
    getSessionStats,
    getSessionsForTask,
    getTaskPomodoros,

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

    // Shortcuts info
    shortcuts,

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
