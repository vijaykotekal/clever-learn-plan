import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StudyPlan {
  id: string;
  user_id: string;
  plan_type: 'daily' | 'exam';
  plan_data: any;
  created_at: string;
}

export const useStudyPlans = () => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPlans((data || []) as StudyPlan[]);
    } catch (error: any) {
      toast({
        title: "Error loading study plans",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const savePlan = async (planType: 'daily' | 'exam', planData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('study_plans')
        .insert({
          user_id: user.id,
          plan_type: planType,
          plan_data: planData,
        });

      if (error) throw error;

      await fetchPlans();
      
      toast({
        title: "Study plan saved!",
        description: "Your study plan has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving study plan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    plans,
    loading,
    savePlan,
    refetch: fetchPlans,
  };
};