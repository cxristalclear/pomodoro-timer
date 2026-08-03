-- Check database schema for task completion tracking features
-- Run this to verify the database is properly set up

-- Check if tasks table has the new columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if sessions table has task_id column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('increment_pomodoros', 'get_average_pomodoros_per_task');

-- Check if the constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'tasks' 
  AND table_schema = 'public'
  AND constraint_name = 'check_completed_at';

-- Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('tasks', 'sessions')
  AND indexname LIKE 'idx_%';

-- Test inserting a sample task (this will fail if schema is wrong)
-- Uncomment the lines below to test task insertion
/*
INSERT INTO public.tasks (
  user_id, 
  name, 
  position, 
  estimated_pomodoros, 
  actual_pomodoros
) VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'Test Task', 
  0, 
  1, 
  0
) ON CONFLICT DO NOTHING;

-- Clean up test data
DELETE FROM public.tasks WHERE user_id = '00000000-0000-0000-0000-000000000000';
*/ 