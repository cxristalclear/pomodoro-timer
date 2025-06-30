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
      
      const sessionData = {
        task: sessionType === "work" ? currentTask || "Work Session" : sessionType === "shortBreak" ? "Short Break" : "Long Break",
        duration: sessionDuration,
        date: new Date().toLocaleDateString(),
      };
      
      await addSession(sessionData);
      
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
  const { time, isRunning, toggleTimer, resetTimer } = timer;

  // Tasks
  const tasksHook = useTasks(userId);
  const { tasks, setTasks, newTaskInput, setNewTaskInput, addTask, deleteTask, selectTask, currentTask, selectedTaskId, loadTasks, toggleTaskCompletion, updateTask } = tasksHook;

  // Sessions
  const sessionsHook = useSessions(userId);
  const { sessions, setSessions, addSession, getSessionsByDate, getTodaysFocusTime, getSessionStats } = sessionsHook;
  const [completedTasks, setCompletedTasks] = useState(0);

  // Audio/Notifications
  const audioHook = useAudio({ soundEnabled: settings.soundEnabled, soundVolume: settings.soundVolume });
  const { testSound, requestNotificationPermission, areNotificationsEnabled } = audioHook;

  // Data loading state
  const [dataLoading, setDataLoading] = useState(false);

  // Next task function - completes current task and moves to next session
  const nextTask = useCallback(async () => {
    if (!selectedTaskId || !userId) return;

    // Find the current task
    const currentTask = tasks.find(task => task.id === selectedTaskId);
    if (!currentTask || currentTask.completed) return;

    // Complete the current task
    await toggleTaskCompletion(selectedTaskId);

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
  }, [selectedTaskId, userId, tasks, toggleTaskCompletion, sessionType, isRunning, sessionCount, settings, resetTimer, toggleTimer]);

  // Skip to next session function
  const skipToNextSession = useCallback(() => {
    if (sessionType === "work") {
      // Move to break
      setSessionCount(prev => prev + 1);
      const nextSessionType = sessionCount % settings.sessionsUntilLongBreak === 0 ? "longBreak" : "shortBreak";
      setSessionType(nextSessionType);
      const newDuration = nextSessionType === "longBreak" 
        ? settings.longBreakDuration * 60 
        : settings.breakDuration * 60;
      resetTimer(newDuration);
      
      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        toggleTimer();
      }
    } else {
      // Move to work
      setSessionType("work");
      resetTimer(settings.workDuration * 60);
      
      // Auto-start work if enabled
      if (settings.autoStartWork) {
        toggleTimer();
      }
    }
  }, [sessionType, sessionCount, settings, resetTimer, toggleTimer]);

  // Memoize the loadTasks function to prevent infinite re-renders
  const loadTasksWithLoading = useCallback(async () => {
    if (!userId) return;
    console.log("Loading tasks for user:", userId);
    setDataLoading(true);
    try {
      await loadTasks();
      console.log("Tasks loaded successfully");
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setDataLoading(false);
    }
  }, [userId, loadTasks]);

  // Load tasks when userId changes and auth is not loading
  useEffect(() => {
    if (!authLoading) {
      if (userId) {
        loadTasksWithLoading();
        // Also load sessions
        sessionsHook.loadSessions();
      } else {
        setTasks([]);
      }
    }
  }, [userId, authLoading, loadTasksWithLoading]);

  // Auto-select first task when tasks are loaded and no task is selected
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId && !dataLoading) {
      const firstActiveTask = tasks.find(task => !task.completed);
      if (firstActiveTask) {
        console.log("Auto-selecting first task:", firstActiveTask.name);
        selectTask(firstActiveTask);
      }
    }
  }, [tasks, selectedTaskId, dataLoading, selectTask]);

  // Auto-select next task when current task is deleted or completed
  useEffect(() => {
    if (selectedTaskId && tasks.length > 0 && !dataLoading) {
      const currentTaskExists = tasks.find(task => task.id === selectedTaskId);
      if (!currentTaskExists) {
        // Current task was deleted, select the next available task
        const nextActiveTask = tasks.find(task => !task.completed);
        if (nextActiveTask) {
          console.log("Current task removed, selecting next task:", nextActiveTask.name);
          selectTask(nextActiveTask);
        }
      } else if (currentTaskExists.completed) {
        // Current task was completed, select the next available task
        const nextActiveTask = tasks.find(task => !task.completed);
        if (nextActiveTask) {
          console.log("Current task completed, selecting next task:", nextActiveTask.name);
          selectTask(nextActiveTask);
        }
      }
    }
  }, [tasks, selectedTaskId, dataLoading, selectTask]);

  // Select task and navigate to timer
  const selectTaskAndNavigate = useCallback(async (task: Task) => {
    // First select the task (this will trigger the reordering)
    await selectTask(task);
    
    // Then navigate
    router.push("/");
  }, [selectTask, router]);

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

  return {
    // Timer
    time,
    isRunning,
    sessionType,
    sessionCount,
    toggleTimer,
    resetTimer,

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

    // Sessions
    sessions,
    completedTasks,
    getSessionsByDate,
    getTodaysFocusTime,
    getSessionStats,

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
    updateSetting: updateSettings,
    resetSettings,
    hasTimerSettingsChanged,

    // Audio/Notifications
    testSound,
    requestNotificationPermission,
    areNotificationsEnabled,

    // Shortcuts info
    shortcuts,

    // Loading
    dataLoading,

    // Skip to next session
    skipToNextSession,
  };
}
