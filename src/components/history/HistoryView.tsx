import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  History, 
  CheckCircle2, 
  Clock, 
  Calendar,
  TrendingUp,
  BookOpen,
  Target,
  Award,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";

interface CompletedTask {
  id: string;
  topicTitle: string;
  subjectName: string;
  difficulty: string;
  estimatedHours: number;
  completedAt: string;
  date: string;
}

interface StudyPlan {
  id: string;
  createdAt: string;
  totalHours: number;
  daysUntilExams: number;
  averageHoursPerDay: number;
  totalTasks: number;
  subjects: any[];
}

export const HistoryView = () => {
  const { plans: studyPlans, loading: plansLoading } = useStudyPlans();
  const { tasks: completedTasksData, loading: tasksLoading } = useCompletedTasks();
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalHours: 0,
    streak: 0,
    avgHoursPerDay: 0
  });

  // Transform database tasks to local format
  const completedTasks: CompletedTask[] = completedTasksData.map(task => ({
    id: task.id,
    topicTitle: task.task_data.topicTitle || '',
    subjectName: task.task_data.subjectName || '',
    difficulty: task.task_data.difficulty || 'medium',
    estimatedHours: task.task_data.estimatedHours || 0,
    completedAt: task.completed_at,
    date: new Date(task.completed_at).toISOString().split('T')[0]
  }));

  useEffect(() => {
    if (completedTasks.length > 0) {
      calculateStats(completedTasks);
    }
  }, [completedTasksData]);

  const calculateStats = (tasks: CompletedTask[]) => {
    const totalCompleted = tasks.length;
    const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    
    // Calculate streak (consecutive days with completed tasks)
    const sortedDates = [...new Set(tasks.map(t => t.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const taskDate = new Date(sortedDates[i]);
      const daysDiff = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    const avgHoursPerDay = totalHours / Math.max(sortedDates.length, 1);

    setStats({
      totalCompleted,
      totalHours,
      streak,
      avgHoursPerDay
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success text-success-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "hard": return "bg-danger text-danger-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getWeeklyData = () => {
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateString = date.toISOString().split('T')[0];
      
      const dayTasks = completedTasks.filter(task => task.date === dateString);
      const hours = dayTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours,
        tasks: dayTasks.length
      };
    });
    
    return weekData;
  };

  const getSubjectBreakdown = () => {
    const subjectMap = new Map();
    
    completedTasks.forEach(task => {
      if (!subjectMap.has(task.subjectName)) {
        subjectMap.set(task.subjectName, {
          name: task.subjectName,
          completed: 0,
          hours: 0
        });
      }
      
      const subject = subjectMap.get(task.subjectName);
      subject.completed++;
      subject.hours += task.estimatedHours;
    });
    
    return Array.from(subjectMap.values());
  };

  if (completedTasks.length === 0 && studyPlans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
          <p className="text-muted-foreground mb-4">
            Complete some tasks and generate study plans to see your progress here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-8 w-8" />
          Study History & Progress
        </h2>
        <p className="text-muted-foreground">Track your achievements and view past study plans</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-3xl font-bold">{stats.totalCompleted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Study Hours</p>
                <p className="text-3xl font-bold">{stats.totalHours.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-3xl font-bold">{stats.streak} days</p>
              </div>
              <Award className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                <p className="text-3xl font-bold">{stats.avgHoursPerDay.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="plans">Past Plans</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks Timeline</CardTitle>
              <CardDescription>Your recent study achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedTasks.slice().reverse().slice(0, 20).map((task, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{task.topicTitle}</h4>
                      <Badge variant="outline">{task.subjectName}</Badge>
                      <Badge className={getDifficultyColor(task.difficulty)}>
                        {task.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimatedHours}h studied
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Study Pattern</CardTitle>
              <CardDescription>Hours studied per day (Last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getWeeklyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Task Completion</CardTitle>
              <CardDescription>Number of tasks completed (Last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getWeeklyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Subject Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress by Subject</CardTitle>
              <CardDescription>Completed tasks and hours per subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getSubjectBreakdown().map((subject, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{subject.name}</h4>
                      </div>
                      <Badge variant="outline">
                        {subject.completed} tasks • {subject.hours.toFixed(1)}h
                      </Badge>
                    </div>
                    <Progress 
                      value={(subject.completed / stats.totalCompleted) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {((subject.completed / stats.totalCompleted) * 100).toFixed(1)}% of total completed tasks
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Past Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {studyPlans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Past Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Generated study plans will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            studyPlans.slice().reverse().map((plan, index) => (
              <Card key={plan.id} className="gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Study Plan #{studyPlans.length - index}</span>
                    <Badge variant="outline">
                      {new Date(plan.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Generated {new Date(plan.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Subjects</p>
                        <p className="font-semibold">{Array.isArray(plan.plan_data?.subjects) ? plan.plan_data.subjects.length : 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tasks</p>
                        <p className="font-semibold">{plan.plan_data?.totalTasks || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                        <p className="font-semibold">{(plan.plan_data?.totalHours || 0).toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Days to Exam</p>
                        <p className="font-semibold">{plan.plan_data?.daysUntilExams || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};