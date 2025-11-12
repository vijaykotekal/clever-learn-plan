-- Add exam_date to subjects and enable realtime on subjects/topics
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS exam_date date;

-- Ensure full row data for realtime
ALTER TABLE public.subjects REPLICA IDENTITY FULL;
ALTER TABLE public.topics REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.topics;