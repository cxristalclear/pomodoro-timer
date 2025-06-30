import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTimer } from "./useTimer";
import { useTasks } from "./useTasks";
import { useSessions } from "./useSessions";
import { useSettings } from "./useSettings";
import { useAudio } from "./useAudio";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useEffect, useState, useCallback } from "react";

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
    onComplete: () => {}, // You can wire up your completion logic here
    autoStart: false,
  });
  const { time, isRunning, toggleTimer, resetTimer } = timer;

  // Tasks
  const tasksHook = useTasks(userId);
  const { tasks, setTasks, newTaskInput, setNewTaskInput, addTask, deleteTask, selectTask, currentTask, selectedTaskId, loadTasks } = tasksHook;

  // Sessions
  const sessionsHook = useSessions(userId);
  const { sessions, setSessions, addSession, getSessionsByDate, getTodaysFocusTime, getSessionStats } = sessionsHook;
  const [completedTasks, setCompletedTasks] = useState(0);

  // Audio/Notifications
  const audioHook = useAudio({ soundEnabled: settings.soundEnabled, soundVolume: settings.soundVolume });
  const { testSound, requestNotificationPermission, areNotificationsEnabled } = audioHook;

  // Data loading state
  const [dataLoading, setDataLoading] = useState(false);

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
      } else {
        setTasks([]);
      }
    }
  }, [userId, authLoading, loadTasksWithLoading, setTasks]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    toggleTimer,
    resetTimer,
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
    setTasks,

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
  };
}
