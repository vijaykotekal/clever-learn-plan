import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, ArrowLeft, BookOpen, Target, Settings, Play, Eye, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { SubjectDetails } from "@/components/subjects/SubjectDetails";

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
  const { subjects: dbSubjects, loading, addSubject } = useSubjects();
  const { savePlan } = useStudyPlans();
  const [viewingSubject, setViewingSubject] = useState<typeof dbSubjects[0] | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    dailyStudyHours: 8,
    examWeekStart: "",
    examWeekEnd: ""
  });
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [hasGeneratedTimetable, setHasGeneratedTimetable] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({
    name: "",
    examDate: "",
    dailyHours: 2,
    topics: [""]
  });
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

        const startHour = 17 + (index * hoursPerSubject);
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
    
    // Save to database
    savePlan('exam', {
      globalSettings,
      timetable: newTimetable,
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name,
        topics: s.topics
      }))
    });

    toast({
      title: "Schedule generated!",
      description: "Your AI-powered study plan is ready. Check the AI Schedule tab.",
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

  const handleAddSubject = async () => {
    if (!newSubjectData.name.trim() || !newSubjectData.examDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const validTopics = newSubjectData.topics.filter(t => t.trim());
    if (validTopics.length === 0) {
      toast({
        title: "No topics",
        description: "Please add at least one topic",
        variant: "destructive",
      });
      return;
    }

    await addSubject(
      newSubjectData.name,
      newSubjectData.examDate,
      newSubjectData.dailyHours,
      validTopics
    );

    setNewSubjectData({
      name: "",
      examDate: "",
      dailyHours: 2,
      topics: [""]
    });
    setIsAddingSubject(false);
    
    toast({
      title: "Subject added!",
      description: "Your subject has been added successfully.",
    });
  };

  const addTopicField = () => {
    setNewSubjectData(prev => ({
      ...prev,
      topics: [...prev.topics, ""]
    }));
  };

  const updateTopicField = (index: number, value: string) => {
    setNewSubjectData(prev => ({
      ...prev,
      topics: prev.topics.map((t, i) => i === index ? value : t)
    }));
  };

  const removeTopicField = (index: number) => {
    setNewSubjectData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const hoursPerTopic = newSubjectData.topics.filter(t => t.trim()).length > 0
    ? newSubjectData.dailyHours / newSubjectData.topics.filter(t => t.trim()).length
    : 0;

  if (viewingSubject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewingSubject(null)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Subjects
          </Button>
        </div>

        <SubjectDetails subject={viewingSubject} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Study Modes
          </Button>
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
              <p className="text-sm text-muted-foreground mt-1">
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

      <div>
        <h2 className="text-3xl font-bold">Exam-wise Study Planning</h2>
        <p className="text-muted-foreground">Global time allocation for comprehensive exam preparation</p>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Topics</p>
                <p className="text-2xl font-bold">{getTotalTopics()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Daily Hours</p>
                <p className="text-2xl font-bold">{globalSettings.dailyStudyHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{getCompletedTopics()}/{getTotalTopics()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subjects Overview</CardTitle>
              <CardDescription>All subjects with equal time allocation</CardDescription>
            </div>
            <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a subject with topics for your exam preparation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input
                      id="subjectName"
                      value={newSubjectData.name}
                      onChange={(e) => setNewSubjectData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="examDate">Exam Date</Label>
                    <Input
                      id="examDate"
                      type="date"
                      value={newSubjectData.examDate}
                      onChange={(e) => setNewSubjectData(prev => ({ ...prev, examDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyHours">Daily Study Hours</Label>
                    <Input
                      id="dailyHours"
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={newSubjectData.dailyHours}
                      onChange={(e) => setNewSubjectData(prev => ({ ...prev, dailyHours: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Topics</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTopicField}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Topic
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {newSubjectData.topics.map((topic, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={topic}
                            onChange={(e) => updateTopicField(index, e.target.value)}
                            placeholder={`Topic ${index + 1}`}
                          />
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {hoursPerTopic.toFixed(1)}h
                          </Badge>
                          {newSubjectData.topics.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTopicField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Each topic will get approximately {hoursPerTopic.toFixed(1)} hours per day
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddSubject} className="flex-1">
                      Add Subject
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingSubject(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No subjects added yet. Click "Add Subject" to get started.</p>
              <Button onClick={() => setIsAddingSubject(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Subject
              </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      const dbSubject = dbSubjects.find(s => s.id === subject.id);
                      if (dbSubject) setViewingSubject(dbSubject);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Resources
                  </Button>
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