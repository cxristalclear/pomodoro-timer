# Pomodoro Timer Application

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/cxristalclears-projects/v0-pomodoro-timer-application)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/oXRlQeeXt2G)

## Overview

A comprehensive Pomodoro timer application with advanced task completion tracking, session management, and analytics. Built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

### 🍅 Core Pomodoro Timer
- **Work Sessions**: Configurable work duration (default: 25 minutes)
- **Break Sessions**: Short breaks (default: 5 minutes) and long breaks (default: 15 minutes)
- **Auto-start**: Automatic progression between work and break sessions
- **Keyboard Shortcuts**: Space to play/pause, Ctrl+R to reset, S to skip
- **Sound Notifications**: Audio alerts for session completion

### ✅ Task Management
- **Task Creation**: Add, edit, and delete tasks
- **Drag & Drop**: Reorder tasks by dragging
- **Task Selection**: Click to select current task for timer
- **Completion Tracking**: Mark tasks as complete/incomplete
- **Pomodoro Progress**: Track estimated vs actual pomodoros per task
- **Visual Indicators**: 
  - Blue left border for tasks with pomodoro progress
  - 🍅 emoji showing current/estimated pomodoros
  - Completion date for finished tasks

### 📊 Analytics & Insights
- **Session Statistics**: Total sessions, hours, daily averages
- **Task Completion Rate**: Visual progress bars and percentages
- **Pomodoro Efficiency**: Average pomodoros per task with insights
- **Activity Calendar**: 30-day activity heatmap
- **Task Breakdown**: Session count by task name
- **Real-time Updates**: Live statistics as you work

### 🔧 Settings & Customization
- **Timer Durations**: Customize work, break, and long break lengths
- **Session Count**: Configure sessions until long break
- **Sound Settings**: Enable/disable notifications and volume control
- **Auto-start Options**: Automatic progression between sessions
- **Display Modes**: Digital and analog timer displays

### 🛡️ Data Integrity & Validation
- **Database Constraints**: Ensures completed_at is set when task is completed
- **Validation Rules**: Prevents completion of empty tasks
- **Session Tracking**: Links sessions to specific tasks via task_id
- **Pomodoro Counting**: Automatic increment of actual_pomodoros
- **Data Consistency**: Maintains task positions and completion states

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **React Hooks**: Custom hooks for state management

### Backend & Database
- **Supabase**: PostgreSQL database with real-time features
- **Row Level Security (RLS)**: User-specific data access
- **Database Functions**: Custom SQL functions for analytics
- **TypeScript Types**: Generated from database schema

### State Management
- **React Context**: Global state for timer, tasks, and settings
- **Custom Hooks**: Modular state logic (useTimer, useTasks, useSessions)
- **Local Storage**: Settings persistence
- **Real-time Sync**: Database state synchronization

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  estimated_pomodoros INTEGER DEFAULT 1,
  actual_pomodoros INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  task_id BIGINT REFERENCES tasks(id),
  task TEXT NOT NULL,
  duration INTEGER NOT NULL,
  date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Key Patterns & Architecture

### Task Completion Tracking
1. **Manual Completion**: User clicks circle/checkmark to toggle completion
2. **Auto-increment**: Pomodoros automatically increment when work sessions complete
3. **Data Validation**: Prevents invalid states (completed without completed_at)
4. **Visual Feedback**: Progress indicators and completion dates

### Session Management
1. **Task Linking**: Sessions reference specific tasks via task_id
2. **Duration Tracking**: Accurate session duration recording
3. **Date Organization**: Sessions grouped by completion date
4. **Analytics Integration**: Session data powers analytics dashboard

### State Management
1. **Context Providers**: Global state for timer, tasks, settings
2. **Custom Hooks**: Encapsulated business logic
3. **Database Sync**: Real-time updates between UI and database
4. **Optimistic Updates**: Immediate UI feedback with background sync

## Development

### Prerequisites
- Node.js 18+
- pnpm or npm
- Supabase account and project

### Setup
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `scripts/01-create-tables.sql`
5. Start development server: `pnpm dev`

### Database Migrations
Run these scripts in order:
1. `scripts/01-create-tables.sql` - Initial schema
2. `scripts/02-enable-rls.sql` - Row Level Security
3. `scripts/03-create-functions.sql` - Database functions
4. `scripts/04-enhance-task-tracking.sql` - Task completion features

## Deployment

Your project is live at:

**[https://vercel.com/cxristalclears-projects/v0-pomodoro-timer-application](https://vercel.com/cxristalclears-projects/v0-pomodoro-timer-application)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/oXRlQeeXt2G](https://v0.dev/chat/projects/oXRlQeeXt2G)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Best Practices Implemented

### Code Organization
- **Separation of Concerns**: UI, business logic, and data access layers
- **Type Safety**: Full TypeScript coverage with generated types
- **Error Handling**: Graceful error handling with user feedback
- **Performance**: Optimized re-renders and database queries

### User Experience
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: ARIA labels and keyboard navigation
- **Visual Feedback**: Loading states and progress indicators
- **Intuitive Interface**: Clear visual hierarchy and interactions

### Data Management
- **Real-time Updates**: Live synchronization with database
- **Data Integrity**: Database constraints and validation
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Graceful handling of network issues
