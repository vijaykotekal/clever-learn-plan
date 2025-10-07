import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, ArrowLeft, BookOpen, Target, Settings, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";

interface ExamStudyPlannerProps {
  onBack: () => void;
}

interface Topic {
  id: string;
  title: string;
  estimatedHours: number;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  progress: number;
}

interface Subject {
  id: string;
  name: string;
  examDate: string;
  topics: Topic[];
  dailyHours: number;
  progress: number;
}

interface GlobalSettings {
  dailyStudyHours: number;
  examWeekStart: string;
  examWeekEnd: string;
}

interface TimetableEntry {
  date: string;
  dayOfWeek: string;
  subjects: {
    subject: Subject;
    topics: Topic[];
    allocatedHours: number;
    timeSlot: string;
  }[];
}

export const ExamStudyPlanner = ({ onBack }: ExamStudyPlannerProps) => {
  const { subjects: dbSubjects, loading } = useSubjects();
  const { savePlan } = useStudyPlans();
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    dailyStudyHours: 8,
    examWeekStart: "",
    examWeekEnd: ""
  });
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasGeneratedTimetable, setHasGeneratedTimetable] = useState(false);
  const { toast } = useToast();

  // Transform database subjects to local format
  const subjects: Subject[] = dbSubjects.map(s => ({
    id: s.id,
    name: s.name,
    examDate: s.created_at,
    dailyHours: 2,
    progress: 0,
    topics: (s.topics || []).map(t => ({
      id: t.id,
      title: t.name,
      estimatedHours: t.time_allocated / 60,
      difficulty: "medium" as const,
      completed: t.is_completed,
      progress: t.is_completed ? 100 : 0
    }))
  }));

  useEffect(() => {
    const savedSettings = localStorage.getItem("examStudySettings");
    if (savedSettings) {
      try {
        setGlobalSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }
  }, []);

  const saveGlobalSettings = () => {
    if (!globalSettings.examWeekStart || !globalSettings.examWeekEnd) {
      toast({
        title: "Invalid dates",
        description: "Please set both exam week start and end dates.",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date(globalSettings.examWeekStart);
    const endDate = new Date(globalSettings.examWeekEnd);
    
    if (startDate >= endDate) {
      toast({
        title: "Invalid date range",
        description: "Exam week end date must be after start date.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem("examStudySettings", JSON.stringify(globalSettings));
    setIsSettingsOpen(false);

    toast({
      title: "Settings saved!",
      description: "Global study time settings have been saved.",
    });
  };

  const generateExamTimetable = () => {
    if (!globalSettings.examWeekStart || !globalSettings.examWeekEnd || subjects.length === 0) {
      toast({
        title: "Missing information",
        description: "Please set exam dates and add subjects first.",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date(globalSettings.examWeekStart);
    const endDate = new Date(globalSettings.examWeekEnd);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const newTimetable: TimetableEntry[] = [];
    const totalSubjects = subjects.length;
    const hoursPerSubject = globalSettings.dailyStudyHours / totalSubjects;
    
    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dateString = currentDate.toDateString();
      
      // Rotate subjects across days for balanced coverage
      const todaysSubjects = subjects.map((subject, index) => {
        const topicsPerDay = Math.ceil(subject.topics.length / totalDays);
        const startTopicIndex = (day * topicsPerDay) % subject.topics.length;
        const endTopicIndex = Math.min(startTopicIndex + topicsPerDay, subject.topics.length);
        const todaysTopics = subject.topics.slice(startTopicIndex, endTopicIndex);
        
        const startHour = 9 + (index * hoursPerSubject);
        const endHour = startHour + hoursPerSubject;
        
        return {
          subject,
          topics: todaysTopics,
          allocatedHours: hoursPerSubject,
          timeSlot: `${Math.floor(startHour)}:${(startHour % 1 * 60).toString().padStart(2, '0')} - ${Math.floor(endHour)}:${(endHour % 1 * 60).toString().padStart(2, '0')}`
        };
      });

      newTimetable.push({
        date: dateString,
        dayOfWeek,
        subjects: todaysSubjects
      });
    }

    setTimetable(newTimetable);
    setHasGeneratedTimetable(true);
    localStorage.setItem("examTimetable", JSON.stringify(newTimetable));

    toast({
      title: "Timetable generated!",
      description: `Created a ${totalDays}-day study plan for your exam week.`,
    });
  };

  const getTotalTopics = () => {
    return subjects.reduce((total, subject) => total + subject.topics.length, 0);
  };

  const getCompletedTopics = () => {
    return subjects.reduce((total, subject) => 
      total + subject.topics.filter(topic => topic.completed).length, 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Study Modes
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">Exam-wise Study Planning</h2>
          <p className="text-muted-foreground">Global time allocation for comprehensive exam preparation</p>
        </div>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Global Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Global Study Settings</DialogTitle>
              <DialogDescription>
                Set global parameters that will apply to all subjects and topics
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dailyHours">Daily Study Hours</Label>
                <Input
                  id="dailyHours"
                  type="number"
                  min="1"
                  max="16"
                  value={globalSettings.dailyStudyHours}
                  onChange={(e) => setGlobalSettings(prev => ({ 
                    ...prev, 
                    dailyStudyHours: Number(e.target.value) 
                  }))}
                  placeholder="8"
                />
                <p className="text-sm text-muted-foreground">
                  This time will be distributed equally across all subjects
                </p>
              </div>
              <div>
                <Label htmlFor="examStart">Exam Week Start Date</Label>
                <Input
                  id="examStart"
                  type="date"
                  value={globalSettings.examWeekStart}
                  onChange={(e) => setGlobalSettings(prev => ({ 
                    ...prev, 
                    examWeekStart: e.target.value 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="examEnd">Exam Week End Date</Label>
                <Input
                  id="examEnd"
                  type="date"
                  value={globalSettings.examWeekEnd}
                  onChange={(e) => setGlobalSettings(prev => ({ 
                    ...prev, 
                    examWeekEnd: e.target.value 
                  }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveGlobalSettings} className="flex-1">
                  Save Settings
                </Button>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-lg font-semibold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Topics</p>
                <p className="text-lg font-semibold">{getTotalTopics()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Daily Hours</p>
                <p className="text-lg font-semibold">{globalSettings.dailyStudyHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">{getCompletedTopics()}/{getTotalTopics()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects Overview</CardTitle>
          <CardDescription>All subjects with equal time allocation</CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No subjects added yet. Please add subjects first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{subject.name}</h4>
                    <Badge variant="outline">
                      {globalSettings.dailyStudyHours / subjects.length}h daily
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Exam Date</p>
                      <p className="text-sm">{new Date(subject.examDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Topics</p>
                      <p className="text-sm">{subject.topics.length} topics</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={subject.progress} className="h-2 flex-1" />
                        <span className="text-sm">{Math.round(subject.progress)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Timetable */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Exam Timetable</CardTitle>
          <CardDescription>Create a comprehensive study schedule for your exam period</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateExamTimetable} 
            className="flex items-center gap-2"
            disabled={subjects.length === 0 || !globalSettings.examWeekStart || !globalSettings.examWeekEnd}
          >
            <Play className="h-4 w-4" />
            Generate Timetable
          </Button>
        </CardContent>
      </Card>

      {/* Generated Timetable */}
      {hasGeneratedTimetable && timetable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Exam Study Timetable</CardTitle>
            <CardDescription>Daily schedule from {globalSettings.examWeekStart} to {globalSettings.examWeekEnd}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {timetable.map((day, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{day.dayOfWeek}</h4>
                    <Badge variant="outline">{day.date}</Badge>
                  </div>
                  <div className="space-y-2">
                    {day.subjects.map((subjectEntry, subIndex) => (
                      <div key={subIndex} className="bg-muted/50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{subjectEntry.subject.name}</h5>
                          <Badge>{subjectEntry.timeSlot}</Badge>
                        </div>
                        {subjectEntry.topics.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Topics: {subjectEntry.topics.map(t => t.title).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};