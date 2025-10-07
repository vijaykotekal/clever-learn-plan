import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  time_allocated: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  study_time_preference: string | null;
  created_at: string;
  topics?: Topic[];
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subjectsError) throw subjectsError;

      // Fetch topics for each subject
      const subjectsWithTopics = await Promise.all(
        (subjectsData || []).map(async (subject) => {
          const { data: topicsData } = await supabase
            .from('topics')
            .select('*')
            .eq('subject_id', subject.id)
            .order('created_at', { ascending: true });

          return {
            ...subject,
            topics: topicsData || [],
          };
        })
      );

      setSubjects(subjectsWithTopics);
    } catch (error: any) {
      toast({
        title: "Error loading subjects",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const addSubject = async (name: string, examDate: string, dailyHours: number, topicNames: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          name,
          study_time_preference: `${dailyHours}h/day until ${examDate}`,
        })
        .select()
        .single();

      if (subjectError) throw subjectError;

      // Add topics
      const timePerTopic = Math.floor((dailyHours * 60) / topicNames.length);
      const topicsToInsert = topicNames.map((topicName) => ({
        subject_id: subject.id,
        name: topicName,
        time_allocated: timePerTopic,
      }));

      const { error: topicsError } = await supabase
        .from('topics')
        .insert(topicsToInsert);

      if (topicsError) throw topicsError;

      await fetchSubjects();
      
      toast({
        title: "Subject added!",
        description: `${name} with ${topicNames.length} topics has been added.`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding subject",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addTopic = async (subjectId: string, topicName: string, timeAllocated: number) => {
    try {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          name: topicName,
          time_allocated: timeAllocated,
        });

      if (error) throw error;

      await fetchSubjects();
      
      toast({
        title: "Topic added!",
        description: `${topicName} has been added to the subject.`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding topic",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTopicProgress = async (topicId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', topicId);

      if (error) throw error;

      await fetchSubjects();
    } catch (error: any) {
      toast({
        title: "Error updating topic",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      await fetchSubjects();
      
      toast({
        title: "Subject deleted",
        description: "The subject has been removed from your study plan.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting subject",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    subjects,
    loading,
    addSubject,
    addTopic,
    updateTopicProgress,
    deleteSubject,
    refetch: fetchSubjects,
  };
};