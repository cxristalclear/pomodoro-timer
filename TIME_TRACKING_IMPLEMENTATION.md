# Task Time Tracking Implementation Guide

## Overview

This document outlines the step-by-step implementation of granular task time tracking in the Pomodoro Timer application. This feature will allow us to track partial work sessions, interruptions, and provide more detailed analytics.

## Why This Feature?

Currently, we only track completed Pomodoro sessions. This means we're missing valuable data about:
- Partial work sessions when users stop early
- Task switching behavior
- Interruption patterns
- Actual time spent vs. estimated time
- Work patterns and productivity trends

## Implementation Steps

### 1. Database Schema Updates

```sql
-- Create new table for granular time tracking
create table task_time_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  task_id bigint references tasks(id),
  date date not null,
  session_type text check (session_type in ('work', 'shortBreak', 'longBreak')),
  planned_pomodoros integer,
  completed_pomodoros integer,
  partial_time_spent integer,  -- Time spent in milliseconds for incomplete sessions
  total_time_spent integer,    -- Total time including complete and incomplete sessions
  interruptions integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add indexes for common queries
create index idx_task_time_records_user_date on task_time_records(user_id, date);
create index idx_task_time_records_task on task_time_records(task_id);
```

Why these fields?
- uuid for id: Consistent with Supabase auth.users
- session_type: Tracks what kind of session was in progress
- planned vs completed pomodoros: Measures estimation accuracy
- partial_time_spent: Captures interrupted/incomplete session time
- total_time_spent: Makes analytics queries simpler
- interruptions: Tracks focus quality
- indexes: Optimize common analytics queries by user and date

### 1.1 Existing Table Modifications

We need to add some columns to the existing `tasks` table to better support time tracking:

```sql
-- Add columns to tasks table
alter table tasks
  add column if not exists estimated_pomodoros integer default 1,
  add column if not exists actual_pomodoros integer default 0,
  add column if not exists last_active_at timestamp with time zone,
  add column if not exists total_focus_time integer default 0;

-- Add indexes for new columns
create index if not exists idx_tasks_last_active on tasks(last_active_at);
create index if not exists idx_tasks_total_focus_time on tasks(total_focus_time);
```

Why these columns?
- `estimated_pomodoros`: User's initial estimate of how many pomodoros the task will take
- `actual_pomodoros`: Number of full pomodoros completed for this task
- `last_active_at`: Timestamp when the task was last worked on (helps with task sorting and activity tracking)
- `total_focus_time`: Aggregate of all time spent on the task (including partial sessions)

These columns will help us:
1. Compare estimated vs actual time spent
2. Sort tasks by recent activity
3. Track total focus time including partial sessions
4. Provide better analytics about task estimation accuracy

The new columns complement the new `task_time_records` table rather than duplicating data, as they store aggregate values for quick access while the detailed time records are stored in the new table.

### 2. Type Definitions

Create a new file: `/types/timeTracking.ts`

```typescript
export interface TaskTimeRecord {
  id: string;
  userId: string;
  taskId: number;
  date: string;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  plannedPomodoros: number;
  completedPomodoros: number;
  partialTimeSpent: number;
  totalTimeSpent: number;
  interruptions: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeTrackingStats {
  dailyStats: {
    date: string;
    totalTimeSpent: number;
    completedPomodoros: number;
    interruptions: number;
  }[];
  taskStats: {
    taskId: number;
    taskName: string;
    totalTimeSpent: number;
    completedPomodoros: number;
    efficiency: number;
  }[];
}
```

### 3. State Management Updates

#### 3.1 Update PomodoroContext

Add to `/contexts/PomodoroContext.ts`:
```typescript
export interface PomodoroContextType {
  // ... existing properties ...
  
  // Time tracking
  startTaskTracking: (taskId: number) => void;
  pauseTaskTracking: () => void;
  recordInterruption: (reason: string) => void;
  getTaskTimeStats: (taskId: number) => Promise<TimeTrackingStats>;
}
```

#### 3.2 Update usePomodoro Hook

Add to `/hooks/usePomodoro.ts`:
```typescript
export function usePomodoroLogic() {
  // ... existing state ...
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [currentSessionStats, setCurrentSessionStats] = useState<{
    startTime: number;
    pausedTime: number;
    interruptions: number;
  } | null>(null);

  // Add time tracking methods
  const startTaskTracking = useCallback((taskId: number) => {
    setTaskStartTime(Date.now());
    setCurrentSessionStats({
      startTime: Date.now(),
      pausedTime: 0,
      interruptions: 0
    });
  }, []);

  const pauseTaskTracking = useCallback(async () => {
    if (!taskStartTime || !currentSessionStats) return;
    
    const now = Date.now();
    const timeSpent = now - taskStartTime;
    
    await savePartialSession({
      taskId: selectedTaskId!,
      duration: timeSpent,
      sessionType,
      interruptions: currentSessionStats.interruptions
    });
    
    setTaskStartTime(null);
    setCurrentSessionStats(null);
  }, [taskStartTime, currentSessionStats, selectedTaskId, sessionType]);
}
```

### 4. Database Service Layer

Add to `/services/pomodoroService.ts`:
```typescript
export const pomodoroService = {
  // ... existing code ...
  
  timeRecords: {
    async create(record: Omit<TaskTimeRecord, 'id' | 'createdAt' | 'updatedAt'>) {
      const { data, error } = await supabase
        .from('task_time_records')
        .insert([record])
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getByDateRange(userId: string, startDate: string, endDate: string) {
      const { data, error } = await supabase
        .from('task_time_records')
        .select('*, tasks(name)')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (error) throw error;
      return data;
    }
  }
};
```

### 5. Analytics Integration

#### 5.1 Analytics Hook

Create `/hooks/useTimeAnalytics.ts`:
```typescript
export function useTimeAnalytics(userId: string) {
  const [timeStats, setTimeStats] = useState<TimeTrackingStats | null>(null);
  
  const fetchTimeStats = useCallback(async (startDate: Date, endDate: Date) => {
    const records = await pomodoroService.timeRecords.getByDateRange(
      userId,
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    const stats = processTimeRecords(records);
    setTimeStats(stats);
  }, [userId]);
  
  return {
    timeStats,
    fetchTimeStats
  };
}
```

#### 5.2 Analytics Processing

Add to `/utils/analytics.ts`:
```typescript
export function processTimeRecords(records: TaskTimeRecord[]): TimeTrackingStats {
  // Group by date for daily stats
  const dailyStats = records.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        totalTimeSpent: 0,
        completedPomodoros: 0,
        interruptions: 0
      };
    }
    
    acc[date].totalTimeSpent += record.totalTimeSpent;
    acc[date].completedPomodoros += record.completedPomodoros;
    acc[date].interruptions += record.interruptions;
    
    return acc;
  }, {} as Record<string, TimeTrackingStats['dailyStats'][0]>);
  
  // Group by task for task stats
  const taskStats = records.reduce((acc, record) => {
    // ... similar reduction for task-based stats
  }, {} as Record<number, TimeTrackingStats['taskStats'][0]>);
  
  return {
    dailyStats: Object.values(dailyStats),
    taskStats: Object.values(taskStats)
  };
}
```

### 6. Event Handling

Update timer-related components to handle:
1. Page visibility changes
2. Browser close/refresh
3. Task switching
4. Timer controls

Add event listeners in appropriate components:
```typescript
useEffect(() => {
  // Page visibility
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Before unload
  window.addEventListener('beforeunload', saveCurrentSession);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', saveCurrentSession);
  };
}, []);
```

### 6.1 Task Completion Shortcut

Add to `/hooks/useKeyboardShortcuts.ts`:
```typescript
interface TaskCompletionHandlers {
  completeTask: (taskId: number) => Promise<void>;
  isTaskActive: boolean;
}

export const useTaskCompletionShortcut = ({ completeTask, isTaskActive }: TaskCompletionHandlers) => {
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isTaskActive) {
        const activeTaskId = selectedTaskId;
        if (activeTaskId) {
          // First, save the partial time spent
          await pauseTaskTracking();
          
          // Then complete the task
          await completeTask(activeTaskId);
          
          // Update task stats
          await pomodoroService.tasks.update(activeTaskId, {
            completed_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            actual_pomodoros: Math.ceil(totalTimeSpent / (25 * 60 * 1000)) // Convert ms to pomodoros
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [completeTask, isTaskActive, selectedTaskId]);
};
```

This integration:
1. Records partial time when completing a task early
2. Updates task statistics
3. Marks the task as completed
4. Preserves the time tracking data

Add to existing Implementation Order (Section 9):
```markdown
3. Create database table
4. Add TypeScript types
5. Implement base tracking logic
6. Add service layer methods
7. Update UI components
8. Add analytics processing
9. Implement tests
10. Deploy and monitor
11. Implement task completion shortcut
  - Add keyboard shortcut handler
  - Integrate with time tracking
  - Update task completion logic
  - Add partial session saving
```

### 7. UI Updates

1. Update Analytics page to show new metrics
2. Add interruption tracking UI
3. Show partial session progress
4. Add detailed task time breakdowns

### 8. Testing Plan

1. Unit Tests:
   - Time calculation functions
   - Stats processing
   - State management logic

2. Integration Tests:
   - Database operations
   - Real-time tracking
   - Analytics calculations

3. E2E Tests:
   - Complete session flow
   - Interruption handling
   - Task switching
   - Analytics display

### 9. Migration Strategy

1. Create new table without affecting existing functionality
2. Implement tracking logic
3. Add UI components
4. Test thoroughly
5. Deploy and monitor

### 10. Error Handling & Recovery

#### 10.1 Client-Side Error Handling
```typescript
interface ErrorState {
  type: 'network' | 'database' | 'sync' | 'validation';
  message: string;
  timestamp: number;
  recoveryAttempts: number;
}

// Add to usePomodoro.ts
const handleTimeTrackingError = async (error: Error) => {
  // Store failed updates in localStorage
  const failedUpdate = {
    taskId: selectedTaskId,
    timeSpent: calculateTimeSpent(),
    timestamp: Date.now(),
    retryCount: 0
  };
  
  await storeFailedUpdate(failedUpdate);
  scheduleRetry(failedUpdate);
};

const retryFailedUpdates = async () => {
  const updates = await getFailedUpdates();
  for (const update of updates) {
    try {
      await pomodoroService.timeRecords.create(update);
      await removeFailedUpdate(update.id);
    } catch (error) {
      if (update.retryCount < 3) {
        await incrementRetryCount(update.id);
      }
    }
  }
};
```

#### 10.2 Data Recovery Strategies
1. Local Storage Backup
```typescript
const backupToLocalStorage = (timeRecord: TaskTimeRecord) => {
  const key = `timeRecord_${timeRecord.id}`;
  localStorage.setItem(key, JSON.stringify({
    ...timeRecord,
    lastBackup: Date.now()
  }));
};

const recoverFromLocalStorage = async () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('timeRecord_'));
  for (const key of keys) {
    const record = JSON.parse(localStorage.getItem(key)!);
    await syncRecordWithServer(record);
    localStorage.removeItem(key);
  }
};
```

2. Periodic Sync
```typescript
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

const startPeriodicSync = () => {
  return setInterval(async () => {
    if (navigator.onLine) {
      await syncPendingRecords();
    }
  }, SYNC_INTERVAL);
};
```

### 11. Performance Optimizations

#### 11.1 Data Caching
```typescript
interface CacheConfig {
  maxAge: number;
  maxItems: number;
}

class AnalyticsCache {
  private cache: Map<string, {
    data: TimeTrackingStats;
    timestamp: number;
  }>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  get(key: string): TimeTrackingStats | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: TimeTrackingStats): void {
    if (this.cache.size >= this.config.maxItems) {
      // Remove oldest entry
      const oldestKey = [...this.cache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

#### 11.2 Query Optimization
```sql
-- Add materialized view for common analytics queries
create materialized view daily_task_stats as
select
  date_trunc('day', date) as day,
  user_id,
  sum(total_time_spent) as total_time,
  sum(completed_pomodoros) as completed_pomodoros,
  sum(interruptions) as total_interruptions
from task_time_records
group by 1, 2;

-- Create refresh function
create function refresh_daily_stats()
returns trigger as $$
begin
  refresh materialized view concurrently daily_task_stats;
  return null;
end;
$$ language plpgsql;

-- Create trigger to refresh materialized view
create trigger refresh_daily_stats_trigger
after insert or update or delete on task_time_records
execute function refresh_daily_stats();
```

### 12. Security Considerations

#### 12.1 Data Access Control
```sql
-- Row Level Security
alter table task_time_records enable row level security;

create policy "Users can only access their own time records"
  on task_time_records
  for all
  using (auth.uid() = user_id);

-- Validate data integrity
create trigger validate_time_record
  before insert or update on task_time_records
  for each row
  execute function validate_time_record();
```

#### 12.2 Data Validation
```typescript
interface TimeRecordValidation {
  isValid: boolean;
  errors: string[];
}

const validateTimeRecord = (record: TaskTimeRecord): TimeRecordValidation => {
  const errors: string[] = [];
  
  // Time validation
  if (record.totalTimeSpent < 0) {
    errors.push('Total time spent cannot be negative');
  }
  
  // Pomodoro count validation
  if (record.completedPomodoros > record.plannedPomodoros) {
    errors.push('Completed pomodoros cannot exceed planned pomodoros');
  }
  
  // Date validation
  if (new Date(record.date) > new Date()) {
    errors.push('Cannot track time for future dates');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 13. Analytics Dashboard Enhancement

#### 13.1 New Metrics to Display
```typescript
interface EnhancedAnalytics extends TimeTrackingStats {
  productivity: {
    focusScore: number;       // Based on interruption frequency
    completionRate: number;   // Completed vs planned pomodoros
    peakHours: number[];     // Hours with highest completion rate
    taskSwitchFrequency: number;
  };
  trends: {
    dailyProgress: {
      date: string;
      improvement: number;
    }[];
    focusImprovement: number;
    estimationAccuracy: number;
  };
}
```

#### 13.2 Visualization Components
```typescript
// Add to analytics page
const ProductivityChart: React.FC<{data: EnhancedAnalytics}> = ({ data }) => {
  // Implementation using recharts or similar
  return (
    <div className="analytics-chart">
      <LineChart data={data.trends.dailyProgress}>
        {/* Chart configuration */}
      </LineChart>
      <FocusScoreGauge value={data.productivity.focusScore} />
      <TaskCompletionPie
        completed={data.productivity.completionRate}
        remaining={1 - data.productivity.completionRate}
      />
    </div>
  );
};
```

### 14. Backup & Recovery Procedures

```bash
# Backup command for task_time_records
pg_dump -t task_time_records > time_records_backup.sql

# Recovery procedure
psql -d your_database -f time_records_backup.sql

# Scheduled backup cron job
0 0 * * * pg_dump -t task_time_records > "/backups/time_records_$(date +%Y%m%d).sql"
```

### 15. Rollback Plan

In case of issues during deployment or unexpected problems:

```sql
-- Rollback database changes
drop table if exists task_time_records cascade;
drop materialized view if exists daily_task_stats;

-- Remove added columns from tasks table
alter table tasks 
  drop column if exists estimated_pomodoros,
  drop column if exists actual_pomodoros,
  drop column if exists last_active_at,
  drop column if exists total_focus_time;

-- Remove indexes
drop index if exists idx_tasks_last_active;
drop index if exists idx_tasks_total_focus_time;
```

### 16. Feature Flag Implementation

Add to `.env` and `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_TIME_TRACKING=true
```

Add to `/lib/featureFlags.ts`:
```typescript
export const FeatureFlags = {
  TIME_TRACKING: process.env.NEXT_PUBLIC_ENABLE_TIME_TRACKING === 'true',
} as const;

// Usage example in components:
const TimeTrackingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!FeatureFlags.TIME_TRACKING) return null;
  return <>{children}</>;
};
```

This allows for:
1. Easy feature toggle during development
2. Gradual rollout to users
3. Quick disable if issues arise
4. A/B testing capabilities

Update Implementation Order to include these new steps:

## Implementation Order

1. Set up feature flags
2. Create database table with rollback script ready
3. Add TypeScript types
4. Implement base tracking logic
5. Add service layer methods
6. Update UI components
7. Add analytics processing
8. Implement tests
9. Deploy with feature flag off
10. Test in production environment
11. Gradually enable feature for users
12. Monitor and adjust as needed
13. Implement task completion shortcut
    - Add keyboard shortcut handler
    - Integrate with time tracking
    - Update task completion logic
    - Add partial session saving

## Monitoring Considerations

1. Performance Metrics:
   - Database query performance
   - Analytics calculation time
   - Client-side performance impact
   - Cache hit rates
   - API response times

2. User Experience Metrics:
   - Average session completion rate
   - Interruption frequency
   - Task estimation accuracy
   - Feature adoption rate
   - Error rates by type

3. System Health Metrics:
   - Database connection pool status
   - Background job processing rates
   - Storage usage and growth rate
   - API endpoint health
   - WebSocket connection stability

4. Business Metrics:
   - Daily/weekly active users
   - Feature engagement rates
   - User retention impact
   - Task completion trends
   - Peak usage patterns

## Future Enhancements

1. AI and Machine Learning:
   - Task estimation prediction
   - Productivity pattern analysis
   - Focus time optimization
   - Interruption pattern detection
   - Personalized pomodoro length recommendations

2. Integration Features:
   - Calendar app synchronization
   - Team collaboration tools
   - Project management platforms
   - Time tracking exports
   - Third-party analytics tools

3. Advanced Analytics:
   - Team productivity insights
   - Comparative performance metrics
   - Custom report builder
   - Data visualization options
   - Trend forecasting

4. User Experience Improvements:
   - Custom interruption categories
   - Flexible work schedule templates
   - Multiple timer strategies
   - Dark/light theme optimization
   - Accessibility enhancements

5. Infrastructure Improvements:
   - Multi-region support
   - Enhanced caching strategies
   - Real-time sync optimization
   - Offline mode enhancement
   - Background task optimization
