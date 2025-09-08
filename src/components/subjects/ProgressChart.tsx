import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Target, BookOpen, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Topic {
  id: string;
  title: string;
  estimatedHours: number;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  progress: number;
  timeSpent: number;
  sessions: StudySession[];
}

interface StudySession {
  id: string;
  date: string;
  duration: number;
  completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  examDate: string;
  topics: Topic[];
  dailyHours: number;
  progress: number;
  totalTimeSpent: number;
}

interface ProgressChartProps {
  subjects: Subject[];
  isOpen: boolean;
  onClose: () => void;
}

export const ProgressChart = ({ subjects, isOpen, onClose }: ProgressChartProps) => {
  // Prepare data for charts
  const subjectProgressData = subjects.map(subject => ({
    name: subject.name,
    progress: Math.round(subject.progress),
    timeSpent: Math.round(subject.totalTimeSpent / 60), // Convert to hours
    estimatedTime: subject.topics.reduce((total, topic) => total + topic.estimatedHours, 0),
    topics: subject.topics.length
  }));

  const difficultyData = subjects.flatMap(subject => 
    subject.topics.map(topic => ({
      difficulty: topic.difficulty,
      progress: topic.progress,
      timeSpent: topic.timeSpent
    }))
  ).reduce((acc, topic) => {
    const existing = acc.find(item => item.difficulty === topic.difficulty);
    if (existing) {
      existing.count += 1;
      existing.avgProgress = Math.round((existing.avgProgress * (existing.count - 1) + topic.progress) / existing.count);
      existing.totalTime += Math.round(topic.timeSpent / 60);
    } else {
      acc.push({
        difficulty: topic.difficulty,
        count: 1,
        avgProgress: Math.round(topic.progress),
        totalTime: Math.round(topic.timeSpent / 60)
      });
    }
    return acc;
  }, [] as any[]);

  // Daily study data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyStudyData = last7Days.map(date => {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    const totalMinutes = subjects.reduce((total, subject) => {
      return total + subject.topics.reduce((topicTotal, topic) => {
        return topicTotal + topic.sessions
          .filter(session => session.date.split('T')[0] === date)
          .reduce((sessionTotal, session) => sessionTotal + session.duration, 0);
      }, 0);
    }, 0);
    
    return {
      day: dayName,
      hours: Math.round((totalMinutes / 60) * 10) / 10 // Round to 1 decimal place
    };
  });

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const totalSubjects = subjects.length;
  const totalTopics = subjects.reduce((total, subject) => total + subject.topics.length, 0);
  const completedTopics = subjects.reduce((total, subject) => 
    total + subject.topics.filter(topic => topic.completed).length, 0
  );
  const totalTimeStudied = subjects.reduce((total, subject) => total + subject.totalTimeSpent, 0);
  const avgProgress = totalTopics > 0 ? Math.round(
    subjects.reduce((total, subject) => 
      total + subject.topics.reduce((topicTotal, topic) => topicTotal + topic.progress, 0), 0
    ) / totalTopics
  ) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Study Progress Analytics
          </DialogTitle>
          <DialogDescription>
            Comprehensive overview of your study progress and patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{totalSubjects}</p>
                    <p className="text-sm text-muted-foreground">Subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{completedTopics}/{totalTopics}</p>
                    <p className="text-sm text-muted-foreground">Topics Done</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{Math.floor(totalTimeStudied / 60)}h</p>
                    <p className="text-sm text-muted-foreground">Time Studied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{avgProgress}%</p>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress Overview</CardTitle>
              <CardDescription>
                Progress and time spent for each subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'progress' ? `${value}%` : `${value}h`,
                        name === 'progress' ? 'Progress' : name === 'timeSpent' ? 'Time Spent' : 'Estimated Time'
                      ]}
                    />
                    <Bar dataKey="progress" fill="#3b82f6" name="Progress %" />
                    <Bar dataKey="timeSpent" fill="#10b981" name="Time Spent (h)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Study Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Study Pattern</CardTitle>
                <CardDescription>
                  Your study hours over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStudyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}h`, 'Study Hours']} />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Topics by Difficulty</CardTitle>
                <CardDescription>
                  Distribution of your study topics by difficulty level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        dataKey="count"
                        nameKey="difficulty"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ difficulty, count }) => `${difficulty}: ${count}`}
                      >
                        {difficultyData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.difficulty === 'easy' ? '#10b981' :
                              entry.difficulty === 'medium' ? '#f59e0b' : '#ef4444'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Details */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Details</CardTitle>
              <CardDescription>
                Detailed breakdown of each subject's progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const completedTopicsCount = subject.topics.filter(topic => topic.completed).length;
                  const daysUntilExam = Math.ceil(
                    (new Date(subject.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <Card key={subject.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{subject.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {daysUntilExam > 0 ? `${daysUntilExam} days left` : 'Exam passed'}
                            </Badge>
                            <Badge variant="outline">
                              {completedTopicsCount}/{subject.topics.length} topics
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span>{Math.round(subject.progress)}%</span>
                          </div>
                          <Progress value={subject.progress} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Time Studied</p>
                            <p className="font-medium">
                              {Math.floor(subject.totalTimeSpent / 60)}h {subject.totalTimeSpent % 60}m
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Daily Goal</p>
                            <p className="font-medium">{subject.dailyHours}h/day</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Topics</p>
                            <p className="font-medium">{subject.topics.length} total</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};