/*
  # Create Study Planner Database Schema

  ## Overview
  This migration creates the complete database schema for an AI-powered study planner application.

  ## New Tables
  1. **profiles**
     - `id` (uuid, primary key) - References auth.users
     - `email` (text) - User email
     - `name` (text) - User full name
     - `created_at` (timestamptz) - Account creation timestamp

  2. **subjects**
     - `id` (uuid, primary key)
     - `user_id` (uuid) - References auth.users
     - `name` (text) - Subject name
     - `study_time_preference` (text) - Study time configuration
     - `created_at` (timestamptz)

  3. **topics**
     - `id` (uuid, primary key)
     - `subject_id` (uuid) - References subjects table
     - `name` (text) - Topic name
     - `time_allocated` (integer) - Time in minutes
     - `is_completed` (boolean) - Completion status
     - `completed_at` (timestamptz) - Completion timestamp
     - `created_at` (timestamptz)

  4. **study_plans**
     - `id` (uuid, primary key)
     - `user_id` (uuid) - References auth.users
     - `plan_type` (text) - Type: 'daily' or 'exam'
     - `plan_data` (jsonb) - Serialized plan data
     - `created_at` (timestamptz)

  5. **completed_tasks**
     - `id` (uuid, primary key)
     - `user_id` (uuid) - References auth.users
     - `task_data` (jsonb) - Serialized task data
     - `completed_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for SELECT, INSERT, UPDATE, DELETE operations
  - Users can only access their own data
  - Topics access controlled through subject ownership

  ## Functions & Triggers
  - Auto-create profile on user signup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  study_time_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  time_allocated INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_plans table
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completed_tasks table
CREATE TABLE IF NOT EXISTS public.completed_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subjects policies
CREATE POLICY "Users can view their own subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subjects"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Topics policies
CREATE POLICY "Users can view topics of their subjects"
  ON public.topics FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = topics.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert topics to their subjects"
  ON public.topics FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = topics.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update topics of their subjects"
  ON public.topics FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = topics.subject_id
    AND subjects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = topics.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete topics of their subjects"
  ON public.topics FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = topics.subject_id
    AND subjects.user_id = auth.uid()
  ));

-- Study plans policies
CREATE POLICY "Users can view their own study plans"
  ON public.study_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study plans"
  ON public.study_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Completed tasks policies
CREATE POLICY "Users can view their own completed tasks"
  ON public.completed_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed tasks"
  ON public.completed_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();