-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table with enhanced pomodoro tracking
CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  estimated_pomodoros INTEGER DEFAULT 1,
  actual_pomodoros INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create sessions table with task_id reference
CREATE TABLE IF NOT EXISTS public.sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id BIGINT REFERENCES public.tasks(id) ON DELETE SET NULL,
  task TEXT NOT NULL,
  duration INTEGER NOT NULL,
  date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  work_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  long_break_duration INTEGER DEFAULT 15,
  sessions_until_long_break INTEGER DEFAULT 4,
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_volume DECIMAL(3,2) DEFAULT 0.5,
  auto_start_breaks BOOLEAN DEFAULT TRUE,
  auto_start_work BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(user_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON public.sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- Add constraints for data integrity
ALTER TABLE public.tasks 
ADD CONSTRAINT check_completed_at 
CHECK (
  (completed = true AND completed_at IS NOT NULL) OR 
  (completed = false AND completed_at IS NULL)
);

-- Function to increment pomodoros for a task
CREATE OR REPLACE FUNCTION increment_pomodoros(task_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.tasks 
  SET actual_pomodoros = actual_pomodoros + 1
  WHERE id = task_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get average pomodoros per task
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
