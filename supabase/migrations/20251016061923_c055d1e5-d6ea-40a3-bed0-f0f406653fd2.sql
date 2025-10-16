-- Create storage bucket for user notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-notes', 'user-notes', false);

-- Create table for user notes metadata
CREATE TABLE public.user_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_notes
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notes
CREATE POLICY "Users can view their own notes"
  ON public.user_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.user_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.user_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for user-notes bucket
CREATE POLICY "Users can view their own uploaded notes"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own notes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'user-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploaded notes"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'user-notes' AND auth.uid()::text = (storage.foldername(name))[1]);