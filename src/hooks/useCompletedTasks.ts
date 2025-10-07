import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompletedTask {
  id: string;
  user_id: string;
  task_data: any;
  completed_at: string;
}

export const useCompletedTasks = () => {
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      setTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading completed tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addCompletedTask = async (taskData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('completed_tasks')
        .insert({
          user_id: user.id,
          task_data: taskData,
        });

      if (error) throw error;

      await fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error saving completed task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    tasks,
    loading,
    addCompletedTask,
    refetch: fetchTasks,
  };
};