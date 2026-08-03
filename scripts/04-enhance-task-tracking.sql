-- Migration script to enhance task completion tracking
-- Run this after the initial tables are created

-- Add new columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add estimated_pomodoros column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'estimated_pomodoros') THEN
        ALTER TABLE public.tasks ADD COLUMN estimated_pomodoros INTEGER DEFAULT 1;
    END IF;
    
    -- Add actual_pomodoros column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'actual_pomodoros') THEN
        ALTER TABLE public.tasks ADD COLUMN actual_pomodoros INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add task_id column to sessions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'task_id') THEN
        ALTER TABLE public.sessions ADD COLUMN task_id BIGINT REFERENCES public.tasks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON public.sessions(task_id);

-- Add data integrity constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_completed_at') THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT check_completed_at 
        CHECK (
          (completed = true AND completed_at IS NOT NULL) OR 
          (completed = false AND completed_at IS NULL)
        );
    END IF;
END $$;

-- Create or replace functions
CREATE OR REPLACE FUNCTION increment_pomodoros(task_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.tasks 
  SET actual_pomodoros = actual_pomodoros + 1
  WHERE id = task_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_average_pomodoros_per_task(user_id_param UUID)
RETURNS TABLE(
  total_tasks BIGINT,
  completed_tasks BIGINT,
  total_pomodoros BIGINT,
  avg_pomodoros_per_task NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_tasks,
    COUNT(*) FILTER (WHERE completed = true)::BIGINT as completed_tasks,
    COALESCE(SUM(actual_pomodoros), 0)::BIGINT as total_pomodoros,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND(COALESCE(SUM(actual_pomodoros), 0)::NUMERIC / COUNT(*), 2)
      ELSE 0 
    END as avg_pomodoros_per_task
  FROM public.tasks 
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Update existing tasks to have default values
UPDATE public.tasks 
SET estimated_pomodoros = 1, actual_pomodoros = 0 
WHERE estimated_pomodoros IS NULL OR actual_pomodoros IS NULL;

-- Ensure completed_at is set for completed tasks
UPDATE public.tasks 
SET completed_at = created_at 
WHERE completed = true AND completed_at IS NULL; 