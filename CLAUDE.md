# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # only package-lock.json is committed — use npm, not pnpm
npm run dev          # dev server on :3000
npm run build        # fails on type errors (see next.config.mjs)
npm run typecheck    # tsc --noEmit — run this before build for a faster loop
npm run lint         # BROKEN: no eslint config exists, drops into an interactive setup prompt
npm start            # serve a production build
```

`npm run build` can fail with `PageNotFoundError: Cannot find module for page: /analytics` when `.next/` is stale from a prior `dev` run. `rm -rf .next` and rebuild — the tree builds clean (all 7 routes static).

There is **no `.eslintrc*` / `eslint.config.*` anywhere**, so `next lint` is unconfigured: run interactively it asks how to configure ESLint, and the build's lint step silently no-ops even though `eslint.ignoreDuringBuilds` is `false`. Only typechecking is actually enforced. Setting up an ESLint config is an open task, not a solved one.

There is **no test framework installed** — no test runner, no test files, no `test` script. Don't invent test commands; verify changes with `npm run typecheck` and by exercising the app.

`next.config.mjs` deliberately sets `eslint.ignoreDuringBuilds: false` and `typescript.ignoreBuildErrors: false`. These were previously `true` and hid 10 type errors. Do not re-disable them to make a build pass.

## Half-wired state API

**20 of the ~21 "enhanced" context methods have zero consumers in `app/` or `components/`.** `addTaskWithDetails`, `bulkUpdateTasks`, `archiveTask`, `unarchiveTask`, `searchTasks`, `filterTasks`, `toggleTaskSelection`, `selectAllTasks`, `toggleBulkEditMode`, `getAvailableCategories`, `createCategory`, `getSubtasks`, `createSubtask`, `taskFilters`, `bulkEditMode`, `getSessionsForTask`, `getTaskPomodoros`, `getTaskStats`, `getSessionStats`, and `getTodaysFocusTime` are all built (hook → service → DB, ~150 lines of `usePomodoro.ts` plus RPCs and 6 `tasks` columns) but no screen calls them. Only `deleteSessionsByTaskId` is used.

Practical consequences: bugs in that layer are latent, not user-visible, so don't assume a reported symptom traces there. And when asked to "add categories/priorities/subtasks/filtering," the state and schema already exist — the work is UI, not plumbing. Check for an existing context method before writing a new one.

## Environment

`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). `lib/supabase/client.ts` throws at client-creation time if either is missing, so a misconfigured env surfaces as a runtime crash on first data access, not a build failure.

## Architecture

### One context, one composition hook

Nearly all application state lives in a single React context. The chain is:

```
app/layout.tsx
  └─ AuthProvider            (contexts/AuthContext.tsx — Supabase session)
       └─ PomodoroProvider   (components/PomodoroProvider.tsx — 19 lines, pure wrapper)
            └─ usePomodoroLogic()  (hooks/usePomodoro.ts — 635 lines, the real thing)
```

`usePomodoroLogic` composes six domain hooks (`useTimer`, `useTasks`, `useSessions`, `useSettings`, `useAudio`, `useKeyboardShortcuts`), wires cross-domain side effects, and returns one flat object. `contexts/PomodoroContext.ts` holds the `PomodoroContextType` interface, the domain types (`Task`, `Session`, `Settings`, `TaskFilters`), and the `usePomodoro()` consumer hook.

Consequences worth knowing before you edit:
- Both providers wrap **every** route including `/auth`, so `usePomodoro()` runs even when unauthenticated. The domain hooks all take `userId: string | undefined` and no-op when it's undefined — preserve that guard in new hooks.
- Adding state to the context means touching three files: the domain hook, the return object in `usePomodoro.ts`, and the `PomodoroContextType` interface.
- The context object is rebuilt every render with no memoization; every consumer re-renders on every timer tick (100ms while running). Keep that in mind before adding expensive consumers.

### Auth gating is per-page, not middleware

There is no `middleware.ts`. Each protected page wraps its content in `<ProtectedRoute>` (`components/ProtectedRoute.tsx`), which redirects to `/auth` once `loading` is false and there's no user. A new protected page must opt in explicitly. `AuthContext` has a hard 5-second timeout that forces `loading` to false to avoid an infinite loading screen.

### All database access goes through one service module

`services/pomodoroService.ts` is the only place that touches Supabase tables, organized as `pomodoroService.{tasks,sessions,settings}`. It owns the **camelCase ↔ snake_case boundary**: the app uses camelCase (`estimatedPomodoros`), the DB uses snake_case (`estimated_pomodoros`), and the service translates field-by-field with explicit `if (x !== undefined)` blocks.

The translation is **not uniform**, which is the most common source of bugs here:
- `tasks.list()` converts rows to camelCase before returning, so `useTasks.loadTasks` uses the result directly.
- `tasks.create()` returns the **raw snake_case row**, so both `useTasks.addTask` and `usePomodoro.addTaskWithDetails` hand-map every field. Adding a `Task` field means updating the service's `update`/`list` mappers *and* both of those hand-mappers.

Two Postgres RPCs are called instead of table writes: `increment_pomodoros(task_id_param)` and `get_average_pomodoros_per_task(user_id_param)`. `lib/supabase/types.ts` also declares `archive_task` and `bulk_update_tasks` RPCs, but the service implements those with direct table updates — the RPCs are unused.

### Timer is wall-clock based

`hooks/useTimer.ts` does **not** decrement a counter. It stores `startTimeRef`/`endTimeRef` as absolute `Date.now()` values and derives remaining time from the clock on a 100ms interval, plus a `visibilitychange` listener that recalculates when the tab regains focus. This is what makes the timer survive background throttling. Don't "simplify" it into `setTime(t => t - 1)`. Pausing stashes the remainder in `remainingTimeRef`; `incrementTime`/`decrementTime` adjust both `time` and `sessionDurationRef`.

### Session-completion side effects are duplicated

The "a session ended" logic exists in two places in `hooks/usePomodoro.ts`, and both must stay in sync:
1. `useTimer`'s `onComplete` callback (natural expiry).
2. `skipToNextSession` (manual skip — only persists if the session was >50% elapsed).

Both follow a required order: **save the session first, then increment pomodoros.** Work sessions save with `task_id` and bump `actual_pomodoros`; break sessions save with `task_id: null` and never bump. If you add a third exit path from a session, replicate both steps.

### `setTasks` writes to the database

The `setTasks` exposed on the context is `setTasksForContext` in `hooks/useTasks.ts`, which calls `updateTaskOrder` — a **sequential loop of one UPDATE per task** to persist `position`. So `setTasks` is not a cheap local state setter; reordering 20 tasks issues 20 round-trips. `selectTask` also reorders (moves the selected task to the top and persists), while `selectTaskByIdNoReorder` exists precisely to change selection without that write.

### Two competing keyboard-shortcut hooks

Both attach `window` `keydown` listeners and can be mounted simultaneously on `/`:
- `hooks/useKeyboardShortcuts.ts` — global/navigation (Space, →, ↓, Ctrl+R/T/A/S/M/H). Mounted by `ProtectedRoute` and **twice** inside `usePomodoro.ts` (the second call passes `{}` just to read the `shortcuts` array, which registers a redundant listener).
- `hooks/useTimerShortcuts.ts` — timer-specific (Space/Enter, bare `r`/`s`/`f`/`m`, ←/→/↑/↓, +/-). Mounted only by `TimerDisplay`.

Their bindings overlap (Space, ↓, Ctrl+R, Ctrl+H) and the two `shortcuts` arrays document different key sets. When changing shortcuts, check both files and expect a handler to fire more than once. `ProtectedRoute` passes `isTimerPage` to suppress the generic shortcuts modal on `/` because `TimerDisplay` renders its own.

### Settings

`hooks/useSettings.ts` holds hardcoded defaults (25/5/15, 4 sessions, sound on at 0.5, autoStartBreaks on, autoStartWork off, `timerDisplayMode: "elapsed"`) duplicated across the initial state and `resetSettings`. Settings persist to the `settings` table only — **there is no localStorage anywhere in this codebase**, despite the README claiming otherwise. `updateSettings` resets the timer when a duration changes, but only if the timer isn't running.

## Database

Four tables in `public`: `profiles`, `tasks`, `sessions`, `settings`. RLS is enabled on all four with per-operation `auth.uid() = user_id` policies. A trigger on `auth.users` inserts a `profiles` row on signup.

`scripts/00-rebuild-all.sql` is the canonical, idempotent, re-runnable schema — paste it into the Supabase SQL Editor. Scripts `01`–`06` are the historical migrations and are **incomplete** (they predate 7 `tasks` columns and `settings.timer_display_mode`); prefer `00`. `lib/supabase/types.ts` was generated against the live DB and is the most reliable schema reference. `DatabaseSchemas.md` is a plain-text column listing.

## Docs to distrust

- `TIME_TRACKING_IMPLEMENTATION.md` (22KB) is an **unimplemented plan**, not a record of work. It marks schema steps `[DONE]`, but `task_time_records` appears nowhere in the SQL, types, or code. Treat it as a proposal.
- `README.md` is partly v0.dev boilerplate and overstates the app: it claims localStorage settings persistence (none exists) and describes analytics features loosely. Verify against code.

## UI conventions

shadcn/ui via `components.json` (New York style, CSS variables, `@/components/ui`). Only 6 primitives are actually vendored (`alert`, `button`, `card`, `input`, `label`, `tabs`) even though ~30 `@radix-ui/*` packages are installed — pull in more with the shadcn CLI rather than hand-writing them. `recharts` is a dependency but unused; `app/analytics/page.tsx` (692 lines) hand-rolls its charts with divs. Dark theme is hardcoded via Tailwind classes (`bg-black text-white`), not `next-themes`, despite it being installed. Path alias is `@/*` → repo root.

The largest files are the page components (`analytics` 692, `settings` 584, `tasks` 461 lines) and `usePomodoro.ts` (635) — expect to read a lot of one file rather than many small ones.

## Debug logging

The codebase is heavily instrumented with emoji-prefixed `console.log` calls (🍅 timer, 💾 save, 🔢 pomodoro increment, 🗄️ DB, ✅/❌ outcome) tracing the session-save path, plus `components/DebugPanel.tsx` rendered on `/`. This is intentional diagnostic tooling for the task-linking flow — match the existing convention when adding logs to that path rather than stripping it.
