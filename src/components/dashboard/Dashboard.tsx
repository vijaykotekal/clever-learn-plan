import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  BookOpen, 
  Brain, 
  Clock, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { AIScheduler } from "@/utils/aiScheduler";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { subjects: dbSubjects, loading } = useSubjects();
  const { addCompletedTask } = useCompletedTasks();
  const [schedulePlan, setSchedulePlan] = useState<any>(null);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes
  const [currentTask, setCurrentTask] = useState<any>(null);
  const { toast } = useToast();

  const scheduler = new AIScheduler();

  // Transform database subjects to match the expected format
  const subjects = dbSubjects.map(s => ({
    id: s.id,
    name: s.name,
    examDate: s.exam_date || s.created_at,
    dailyHours: 2, // Default value
    progress: 0,
    topics: (s.topics || []).map(t => ({
      id: t.id,
      title: t.name,
      estimatedHours: t.time_allocated / 60,
      difficulty: "medium" as const,
      completed: t.is_completed,
      progress: t.is_completed ? 100 : 0,
      subjectId: s.id,
      subjectName: s.name
    }))
  }));

  useEffect(() => {
    if (subjects.length > 0) {
      loadDashboardData();
    }
  }, [dbSubjects.length]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-subjects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subjects'
        },
        () => {
          // Reload dashboard when subjects change
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics'
        },
        () => {
          // Reload dashboard when topics change
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = () => {
    if (subjects.length === 0) return;
    
    // Generate AI schedule
    const plan = scheduler.generateSchedule(subjects);
    setSchedulePlan(plan);
    
    // Get today's tasks
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = plan.dailyTasks.filter((task: any) => task.date === today);
    setTodaysTasks(todayTasks);
  };

  const completeTask = async (taskId: string) => {
    const completedTask = todaysTasks.find(task => task.id === taskId);
    if (!completedTask) return;

    // Update today's tasks
    setTodaysTasks(todaysTasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: true, actualHours: task.estimatedHours }
        : task
    ));

    // Save to database
    await addCompletedTask({
      ...completedTask,
      completed: true,
      completedAt: new Date().toISOString(),
      actualHours: completedTask.estimatedHours
    });

    toast({
      title: "Task completed!",
      description: "Great progress on your study goals.",
    });
  };

  const startPomodoro = (task: any) => {
    setCurrentTask(task);
    setPomodoroActive(true);
    setPomodoroTime(25 * 60);
    
    const timer = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPomodoroActive(false);
          toast({
            title: "Pomodoro completed!",
            description: "Take a 5-minute break before continuing.",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate chart data
  const generateProgressData = () => {
    return subjects.map(subject => ({
      name: subject.name,
      progress: Math.round(subject.progress || 0),
      totalTopics: subject.topics?.length || 0,
      completedTopics: subject.topics?.filter((t: any) => t.completed).length || 0
    }));
  };

  const generateStudyTimeData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        planned: Math.floor(Math.random() * 6) + 2, // Mock data
        actual: Math.floor(Math.random() * 6) + 1
      };
    });
    return last7Days;
  };

  const difficultyColors = {
    easy: "#10b981",
    medium: "#f59e0b", 
    hard: "#ef4444"
  };

  if (!schedulePlan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No study plan yet</h3>
          <p className="text-muted-foreground mb-4">Add subjects and topics to generate your AI-powered study schedule</p>
          <div className="flex gap-2">
            <Button variant="study" onClick={() => onNavigate("subjects")}>
              Add Your First Subject
            </Button>
            <Button variant="outline" onClick={() => onNavigate("study-modes")}>
              Study Modes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Study Dashboard</h2>
          <p className="text-muted-foreground">Track your progress and stay on schedule</p>
        </div>
        <Button variant="outline" onClick={loadDashboardData}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-3xl font-bold">{subjects.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Until Exam</p>
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
                <p className="text-sm text-muted-foreground">Today's Tasks</p>
                <p className="text-3xl font-bold">{todaysTasks.length}</p>
              </div>
              <Target className="h-8 w-8 text-secondary" />
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
              <Clock className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pomodoro Timer */}
          {pomodoroActive && currentTask && (
            <Card className="gradient-primary text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Focus Session</h3>
                  <p className="text-sm opacity-90 mb-4">{currentTask.topicTitle}</p>
                  <div className="text-4xl font-bold mb-4">{formatTime(pomodoroTime)}</div>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPomodoroActive(false)}>
                      <Pause className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Study Plan
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No tasks scheduled for today. Great job!
                  </p>
                </div>
              ) : (
                todaysTasks.map((task) => (
                  <Card key={task.id} className={`p-4 ${task.completed ? "bg-success/10 border-success" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{task.topicTitle}</h4>
                          <Badge variant="outline">{task.subjectName}</Badge>
                          <Badge 
                            variant="secondary"
                            style={{ backgroundColor: difficultyColors[task.difficulty as keyof typeof difficultyColors] }}
                            className="text-white"
                          >
                            {task.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {task.estimatedHours} hours
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!task.completed && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startPomodoro(task)}
                              disabled={pomodoroActive}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => completeTask(task.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {task.completed && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <div>
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {schedulePlan.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="time">Study Time</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="progress"
                    data={generateProgressData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {generateProgressData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(difficultyColors)[index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Study Time</CardTitle>
              <CardDescription>Planned vs Actual study hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateStudyTimeData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="planned" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subjects" className="space-y-4">
          <div className="grid gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{subject.name}</h4>
                    <Badge variant="outline">
                      Exam: {new Date(subject.examDate).toLocaleDateString()}
                    </Badge>
                  </div>
                  <Progress value={subject.progress || 0} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{subject.topics?.length || 0} topics</span>
                    <span>{Math.round(subject.progress || 0)}% complete</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};