import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Brain, CheckCircle2, AlertCircle, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIScheduler } from "@/utils/aiScheduler";

export const ScheduleView = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schedulePlan, setSchedulePlan] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const scheduler = new AIScheduler();

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = () => {
    const savedSubjects = localStorage.getItem("studyPlannerSubjects");
    if (savedSubjects) {
      const subjectsData = JSON.parse(savedSubjects);
      setSubjects(subjectsData);
      generateSchedule(subjectsData);
    }
  };

  const generateSchedule = async (subjectsData: any[]) => {
    setIsGenerating(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const plan = scheduler.generateSchedule(subjectsData);
      setSchedulePlan(plan);
      setIsGenerating(false);
      
      toast({
        title: "Schedule generated!",
        description: "Your AI-powered study plan is ready.",
      });
    }, 1500);
  };

  const markTaskCompleted = (taskId: string) => {
    if (!schedulePlan) return;
    
    const updatedTasks = schedulePlan.dailyTasks.map((task: any) => 
      task.id === taskId 
        ? { ...task, completed: true, actualHours: task.estimatedHours }
        : task
    );
    
    setSchedulePlan({
      ...schedulePlan,
      dailyTasks: updatedTasks
    });
    
    // Save to localStorage
    localStorage.setItem("scheduleProgress", JSON.stringify(updatedTasks));
    
    toast({
      title: "Task completed!",
      description: "Progress saved to your study plan.",
    });
  };

  const exportSchedule = () => {
    if (!schedulePlan) return;
    
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-schedule.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Schedule exported!",
      description: "Your study plan has been downloaded as CSV.",
    });
  };

  const generateCSVContent = () => {
    const headers = ['Date', 'Subject', 'Topic', 'Estimated Hours', 'Difficulty', 'Status'];
    const rows = schedulePlan.dailyTasks.map((task: any) => [
      task.date,
      task.subjectName,
      task.topicTitle,
      task.estimatedHours,
      task.difficulty,
      task.completed ? 'Completed' : 'Pending'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getTasksForDate = (date: Date) => {
    if (!schedulePlan) return [];
    const dateString = date.toISOString().split('T')[0];
    return schedulePlan.dailyTasks.filter((task: any) => task.date === dateString);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success text-success-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "hard": return "bg-danger text-danger-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!schedulePlan && !isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No schedule generated</h3>
          <p className="text-muted-foreground mb-4">Add subjects and topics to generate your AI-powered study schedule</p>
          <Button variant="study" onClick={loadScheduleData}>
            Generate Schedule
          </Button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4 animate-study-pulse" />
          <h3 className="text-xl font-semibold mb-2">AI is generating your schedule...</h3>
          <p className="text-muted-foreground">Analyzing your subjects and optimizing your study plan</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(selectedWeek);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">AI Study Schedule</h2>
          <p className="text-muted-foreground">Your personalized, AI-optimized study plan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSchedule}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="study" onClick={loadScheduleData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Schedule Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Study Hours</p>
                <p className="text-3xl font-bold">{schedulePlan.totalHours.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Until Exams</p>
                <p className="text-3xl font-bold">{schedulePlan.daysUntilExams}</p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                <p className="text-3xl font-bold">{schedulePlan.averageHoursPerDay.toFixed(1)}</p>
              </div>
              <Brain className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Study Recommendations
          </CardTitle>
          <CardDescription>
            Personalized insights based on your schedule and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {schedulePlan.recommendations.map((rec: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedWeek(selectedWeek - 1)}
          disabled={selectedWeek <= -4} // Limit to 4 weeks in the past
        >
          Previous Week
        </Button>
        <div className="text-center">
          <h3 className="font-semibold">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedWeek === 0 ? "This Week" : 
             selectedWeek > 0 ? `${selectedWeek} week${selectedWeek > 1 ? 's' : ''} ahead` :
             `${Math.abs(selectedWeek)} week${Math.abs(selectedWeek) > 1 ? 's' : ''} ago`}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSelectedWeek(selectedWeek + 1)}
          disabled={selectedWeek >= 8} // Limit to 8 weeks in the future
        >
          Next Week
        </Button>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const tasks = getTasksForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date() && !isToday;
          
          return (
            <Card key={index} className={`${isToday ? 'ring-2 ring-primary' : ''} ${isPast ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">
                  <div className="text-sm text-muted-foreground">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                    {date.getDate()}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No tasks scheduled
                  </div>
                ) : (
                  tasks.map((task: any) => (
                    <div key={task.id} className={`p-2 rounded-lg border ${task.completed ? 'bg-success/10 border-success' : 'bg-card border-border'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getDifficultyColor(task.difficulty)}`}
                        >
                          {task.difficulty}
                        </Badge>
                        {task.completed && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <h4 className="text-xs font-medium truncate" title={task.topicTitle}>
                        {task.topicTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground">{task.subjectName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {task.estimatedHours}h
                        </span>
                        {!task.completed && !isPast && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs px-2"
                            onClick={() => markTaskCompleted(task.id)}
                          >
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};