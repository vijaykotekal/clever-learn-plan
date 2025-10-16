import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserNote {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export const useUserNotes = (subjectId: string, topicId?: string | null) => {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject_id', subjectId);

      if (topicId !== undefined) {
        query = topicId ? query.eq('topic_id', topicId) : query.is('topic_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [subjectId, topicId]);

  const uploadNote = async (file: File) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-notes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('user_notes')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          topic_id: topicId || null,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      await fetchNotes();
      
      toast({
        title: "Note uploaded!",
        description: `${file.name} has been added successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error uploading note",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteNote = async (noteId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-notes')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId);

      if (dbError) throw dbError;

      await fetchNotes();
      
      toast({
        title: "Note deleted",
        description: "The note has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadNote = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-notes')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error downloading note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    notes,
    loading,
    uploading,
    uploadNote,
    deleteNote,
    downloadNote,
    refetch: fetchNotes,
  };
};
