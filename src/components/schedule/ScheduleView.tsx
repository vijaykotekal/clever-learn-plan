import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Brain, CheckCircle2, AlertCircle, Download, RefreshCw, Youtube, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";

export const ScheduleView = () => {
  const { subjects: dbSubjects } = useSubjects();
  const { plans, loading } = useStudyPlans();
  const [schedulePlan, setSchedulePlan] = useState<any>(null);
  const [examPlan, setExamPlan] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("daily");
  const { toast } = useToast();

  useEffect(() => {
    loadScheduleData();
  }, [plans]);

  const loadScheduleData = () => {
    if (plans.length === 0) return;

    // Load the most recent daily plan
    const dailyPlan = plans.find(p => p.plan_type === 'daily');
    if (dailyPlan) {
      setSchedulePlan(dailyPlan.plan_data);
    }

    // Load the most recent exam plan
    const examPlanData = plans.find(p => p.plan_type === 'exam');
    if (examPlanData) {
      setExamPlan(examPlanData.plan_data);
    }
  };

  const markTaskCompleted = (taskId: string) => {
    if (!schedulePlan) return;
    
    const completedTask = schedulePlan.dailyTasks.find((task: any) => task.id === taskId);
    if (!completedTask) return;

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

    // Save to completed tasks history
    const savedTasks = localStorage.getItem("completedTasks");
    const completedTasks = savedTasks ? JSON.parse(savedTasks) : [];
    completedTasks.push({
      ...completedTask,
      completed: true,
      completedAt: new Date().toISOString(),
      actualHours: completedTask.estimatedHours
    });
    localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4 animate-study-pulse" />
          <h3 className="text-xl font-semibold mb-2">Loading schedules...</h3>
        </div>
      </div>
    );
  }

  if (!schedulePlan && !examPlan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No schedule generated</h3>
          <p className="text-muted-foreground mb-4">Go to Daily-wise or Exam-wise Study mode and generate a schedule</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">AI Study Schedule</h2>
          <p className="text-muted-foreground">Your personalized, AI-optimized study plan</p>
        </div>
        <div className="flex gap-2">
          {schedulePlan && (
            <Button variant="outline" onClick={exportSchedule}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="daily" disabled={!schedulePlan}>Daily-wise Schedule</TabsTrigger>
          <TabsTrigger value="exam" disabled={!examPlan}>Exam-wise Schedule</TabsTrigger>
        </TabsList>

        {/* Daily Schedule Tab */}
        <TabsContent value="daily" className="space-y-6">
          {schedulePlan && <DailyScheduleContent 
            schedulePlan={schedulePlan}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            markTaskCompleted={markTaskCompleted}
            getWeekDates={getWeekDates}
            getTasksForDate={getTasksForDate}
            getDifficultyColor={getDifficultyColor}
          />}
        </TabsContent>

        {/* Exam Schedule Tab */}
        <TabsContent value="exam" className="space-y-6">
          {examPlan && <ExamScheduleContent examPlan={examPlan} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Daily Schedule Content Component
const DailyScheduleContent = ({ 
  schedulePlan, 
  selectedWeek, 
  setSelectedWeek,
  selectedTask,
  setSelectedTask,
  markTaskCompleted,
  getWeekDates,
  getTasksForDate,
  getDifficultyColor
}: any) => {
  const weekDates = getWeekDates(selectedWeek);
  
  return (
    <>
      {/* Schedule Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <Card className="gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Study Hours</p>
              <p className="text-3xl font-bold">{schedulePlan.totalHours?.toFixed(1) || 0}</p>
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
              <p className="text-3xl font-bold">{schedulePlan.daysUntilExams || 0}</p>
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
              <p className="text-3xl font-bold">{schedulePlan.averageHoursPerDay?.toFixed(1) || 0}</p>
            </div>
            <Brain className="h-8 w-8 text-secondary" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* AI Recommendations */}
    {schedulePlan.recommendations && schedulePlan.recommendations.length > 0 && (
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
    )}

    {/* Week Navigation */}
    <div className="flex items-center justify-center gap-4">
      <Button 
        variant="outline" 
        onClick={() => setSelectedWeek(selectedWeek - 1)}
        disabled={selectedWeek <= -4}
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
        disabled={selectedWeek >= 8}
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
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedTask(task)}
                          title="View details"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
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
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>

    {/* Task Details Dialog */}
    {selectedTask && (
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedTask.topicTitle}
              </DialogTitle>
              <DialogDescription>
                Study materials and resources for {selectedTask.subjectName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Task Info */}
              <div className="flex items-center gap-4">
                <Badge className={getDifficultyColor(selectedTask.difficulty)}>
                  {selectedTask.difficulty.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {selectedTask.estimatedHours} hours
                </Badge>
                <Badge variant="outline">
                  {new Date(selectedTask.date).toLocaleDateString()}
                </Badge>
              </div>

              {/* YouTube Resources */}
              {selectedTask.youtubeLinks && selectedTask.youtubeLinks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Youtube className="h-5 w-5" />
                    YouTube Learning Resources
                  </h3>
                  <div className="grid gap-3">
                    {selectedTask.youtubeLinks.map((link: string, index: number) => {
                      const titles = [
                        "📚 Tutorial & Explanation",
                        "💡 Worked Examples", 
                        "🎯 Practice Problems",
                        "⚡ Crash Course",
                        "📋 Step-by-Step Guide"
                      ];
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{titles[index] || `Resource ${index + 1}`}</h4>
                            <p className="text-sm text-muted-foreground">YouTube search results</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(link, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Study Notes */}
              {selectedTask.notes && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    AI Study Notes
                  </h3>
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {selectedTask.notes}
                    </pre>
                  </div>
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>
    )}
  </>
);
};

// Exam Schedule Content Component
const ExamScheduleContent = ({ examPlan }: any) => {
  const { timetable, globalSettings } = examPlan;

  if (!timetable || timetable.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No exam schedule available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Study Hours</p>
                <p className="text-3xl font-bold">{globalSettings?.dailyStudyHours || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Days</p>
                <p className="text-3xl font-bold">{timetable.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-3xl font-bold">{examPlan.subjects?.length || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timetable */}
      <div className="space-y-4">
        {timetable.map((entry: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{entry.dayOfWeek}</span>
                <Badge variant="outline">{new Date(entry.date).toLocaleDateString()}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entry.subjects.map((subjectEntry: any, subIndex: number) => (
                  <div key={subIndex} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{subjectEntry.subject.name}</h4>
                      <Badge>{subjectEntry.timeSlot}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-1">Topics: {subjectEntry.topics.map((t: any) => t.title).join(', ')}</p>
                      <p>Allocated Hours: {subjectEntry.allocatedHours.toFixed(1)}h</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};