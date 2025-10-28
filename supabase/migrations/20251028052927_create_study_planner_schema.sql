/*
  # Create Study Planner Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `name` (text)
      - `created_at` (timestamptz)
    - `subjects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `study_time_preference` (text)
      - `created_at` (timestamptz)
    - `topics`
      - `id` (uuid, primary key)
      - `subject_id` (uuid, references subjects)
      - `name` (text)
      - `time_allocated` (integer, minutes)
      - `is_completed` (boolean)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
    - `study_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_type` (text, 'daily' or 'exam')
      - `plan_data` (jsonb)
      - `created_at` (timestamptz)
    - `completed_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `task_data` (jsonb)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Policies ensure users can only access their own profiles, subjects, topics, study plans, and completed tasks

  3. Triggers
    - Automatically create profile when new user signs up
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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Subjects policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Users can view their own subjects'
  ) THEN
    CREATE POLICY "Users can view their own subjects"
      ON public.subjects FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Users can insert their own subjects'
  ) THEN
    CREATE POLICY "Users can insert their own subjects"
      ON public.subjects FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Users can update their own subjects'
  ) THEN
    CREATE POLICY "Users can update their own subjects"
      ON public.subjects FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Users can delete their own subjects'
  ) THEN
    CREATE POLICY "Users can delete their own subjects"
      ON public.subjects FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Topics policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'topics' AND policyname = 'Users can view topics of their subjects'
  ) THEN
    CREATE POLICY "Users can view topics of their subjects"
      ON public.topics FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = topics.subject_id
        AND subjects.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'topics' AND policyname = 'Users can insert topics to their subjects'
  ) THEN
    CREATE POLICY "Users can insert topics to their subjects"
      ON public.topics FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = topics.subject_id
        AND subjects.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'topics' AND policyname = 'Users can update topics of their subjects'
  ) THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'topics' AND policyname = 'Users can delete topics of their subjects'
  ) THEN
    CREATE POLICY "Users can delete topics of their subjects"
      ON public.topics FOR DELETE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = topics.subject_id
        AND subjects.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Study plans policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'study_plans' AND policyname = 'Users can view their own study plans'
  ) THEN
    CREATE POLICY "Users can view their own study plans"
      ON public.study_plans FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'study_plans' AND policyname = 'Users can insert their own study plans'
  ) THEN
    CREATE POLICY "Users can insert their own study plans"
      ON public.study_plans FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Completed tasks policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'completed_tasks' AND policyname = 'Users can view their own completed tasks'
  ) THEN
    CREATE POLICY "Users can view their own completed tasks"
      ON public.completed_tasks FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'completed_tasks' AND policyname = 'Users can insert their own completed tasks'
  ) THEN
    CREATE POLICY "Users can insert their own completed tasks"
      ON public.completed_tasks FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;