-- ============================================================================
-- Pomodoro Timer — complete database rebuild
-- ============================================================================
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Safe to re-run: every statement is idempotent.
--
-- Reconstructed from lib/supabase/types.ts (generated against the live DB)
-- cross-checked with the recovered scripts/01-04 migrations. The recovered
-- migrations alone were incomplete — they predated 7 task columns and
-- settings.timer_display_mode.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  completed           BOOLEAN NOT NULL DEFAULT FALSE,
  position            INTEGER NOT NULL DEFAULT 0,
  estimated_pomodoros INTEGER NOT NULL DEFAULT 1,
  actual_pomodoros    INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,

  -- added after the recovered migrations were written
  category            TEXT,
  priority            TEXT,
  due_date            TIMESTAMPTZ,
  notes               TEXT,
  is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
  parent_task_id      BIGINT REFERENCES public.tasks(id) ON DELETE SET NULL,

  -- vestigial: declared in lib/supabase/types.ts but no query reads it.
  -- Kept so `select("*")` still matches the generated types. Safe to drop
  -- once you regenerate types.ts.
  task_id_in_sessions UUID
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id      BIGINT REFERENCES public.tasks(id) ON DELETE SET NULL,
  task         TEXT NOT NULL,
  duration     INTEGER NOT NULL,
  date         DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id                        BIGSERIAL PRIMARY KEY,
  user_id                   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  work_duration             INTEGER NOT NULL DEFAULT 25,
  break_duration            INTEGER NOT NULL DEFAULT 5,
  long_break_duration       INTEGER NOT NULL DEFAULT 15,
  sessions_until_long_break INTEGER NOT NULL DEFAULT 4,
  sound_enabled             BOOLEAN NOT NULL DEFAULT TRUE,
  sound_volume              NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  auto_start_breaks         BOOLEAN NOT NULL DEFAULT TRUE,
  auto_start_work           BOOLEAN NOT NULL DEFAULT FALSE,
  timer_display_mode        TEXT NOT NULL DEFAULT 'countdown',
  notifications_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 2. Constraints
-- ---------------------------------------------------------------------------
-- completed and completed_at must agree. pomodoroService.toggleTaskCompletion
-- nulls completed_at when un-completing, so this holds.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND constraint_name = 'check_completed_at'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT check_completed_at CHECK (
        (completed = TRUE  AND completed_at IS NOT NULL) OR
        (completed = FALSE AND completed_at IS NULL)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND constraint_name = 'check_task_priority'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT check_task_priority
        CHECK (priority IS NULL OR priority IN ('high', 'medium', 'low'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'settings'
      AND constraint_name = 'check_timer_display_mode'
  ) THEN
    ALTER TABLE public.settings
      ADD CONSTRAINT check_timer_display_mode
        CHECK (timer_display_mode IN ('countdown', 'elapsed'));
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_tasks_user_id     ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position    ON public.tasks(user_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_completed   ON public.tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_tasks_archived    ON public.tasks(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_parent      ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id  ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date     ON public.sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_task_id  ON public.sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id  ON public.settings(user_id);


-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
-- This is the only thing standing between your anon key and your data.
-- Do not skip it.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- profiles keys off id; the other three key off user_id
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['tasks', 'sessions', 'settings'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)',
      t || '_select_own', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)',
      t || '_insert_own', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      t || '_update_own', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)',
      t || '_delete_own', t);
  END LOOP;
END $$;


-- ---------------------------------------------------------------------------
-- 5. Functions the app calls
-- ---------------------------------------------------------------------------
-- increment_pomodoros is invoked via supabase.rpc() on every completed work
-- session. It runs as SECURITY DEFINER so it bypasses RLS, which means it
-- MUST check ownership itself — otherwise any signed-in user could bump
-- anyone's counter by guessing an id.

CREATE OR REPLACE FUNCTION public.increment_pomodoros(task_id_param BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tasks
     SET actual_pomodoros = actual_pomodoros + 1
   WHERE id = task_id_param
     AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_average_pomodoros_per_task(user_id_param UUID)
RETURNS TABLE (
  total_tasks            BIGINT,
  completed_tasks        BIGINT,
  total_pomodoros        BIGINT,
  avg_pomodoros_per_task NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ignore the argument if it isn't the caller; prevents reading others' stats
  IF user_id_param IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE completed)::BIGINT,
    COALESCE(SUM(actual_pomodoros), 0)::BIGINT,
    CASE WHEN COUNT(*) > 0
         THEN ROUND(COALESCE(SUM(actual_pomodoros), 0)::NUMERIC / COUNT(*), 2)
         ELSE 0
    END
  FROM public.tasks
  WHERE user_id = user_id_param;
END;
$$;


-- ---------------------------------------------------------------------------
-- 6. Signup trigger
-- ---------------------------------------------------------------------------
-- Creates a profile + default settings row for every new user.
-- The EXCEPTION block matters: if this function raises, Supabase signup fails
-- with an opaque "Database error saving new user" and you cannot create an
-- account at all. Better to let signup succeed and backfill (section 7).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, COALESCE(NEW.email, ''))
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------
-- Supabase's default privileges normally handle this automatically for tables
-- created in `public`. Doing it explicitly costs nothing and avoids an
-- opaque "permission denied for table tasks" if those defaults aren't set.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 8. Backfill
-- ---------------------------------------------------------------------------
-- If your auth users survived (tables dropped, project intact) the trigger
-- above never fired for them. This gives every existing user a profile and
-- a settings row. No-op on a fresh project.

INSERT INTO public.profiles (id, email)
SELECT u.id, COALESCE(u.email, '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (user_id)
SELECT u.id
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 9. Verify
-- ---------------------------------------------------------------------------

SELECT 'tables' AS check, string_agg(table_name, ', ' ORDER BY table_name) AS result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'tasks', 'sessions', 'settings')
UNION ALL
SELECT 'rls enabled', string_agg(relname, ', ' ORDER BY relname)
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relrowsecurity
UNION ALL
SELECT 'policy count', COUNT(*)::TEXT
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'functions', string_agg(routine_name, ', ' ORDER BY routine_name)
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT 'users backfilled',
       (SELECT COUNT(*) FROM public.profiles)::TEXT || ' profiles / ' ||
       (SELECT COUNT(*) FROM public.settings)::TEXT || ' settings';
