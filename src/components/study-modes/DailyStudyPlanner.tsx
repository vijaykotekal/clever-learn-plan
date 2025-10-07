import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Plus, ArrowLeft, BookOpen, Target, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";

interface DailyStudyPlannerProps {
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

export const DailyStudyPlanner = ({ onBack }: DailyStudyPlannerProps) => {
  const { subjects: dbSubjects, loading, addTopic: dbAddTopic } = useSubjects();
  const { savePlan } = useStudyPlans();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicData, setNewTopicData] = useState({ title: "", difficulty: "medium" as const });
  const { toast } = useToast();

  // Transform database subjects to local format
  const subjects: Subject[] = dbSubjects.map(s => ({
    id: s.id,
    name: s.name,
    examDate: s.created_at, // You may want to add exam_date to subjects table
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

  const addTopicToSubject = async (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || !newTopicData.title.trim()) return;

    const estimatedHours = subject.dailyHours / (subject.topics.length + 1);
    await dbAddTopic(subjectId, newTopicData.title, Math.floor(estimatedHours * 60));
    
    setNewTopicData({ title: "", difficulty: "medium" });
    setIsAddingTopic(false);
  };

  const generateDailyTimetable = (subject: Subject) => {
    const today = new Date();
    const examDate = new Date(subject.examDate);
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExam <= 0) return [];

    const dailySchedule = [];
    const totalTopics = subject.topics.length;
    const hoursPerTopic = subject.dailyHours / totalTopics;

    for (let day = 0; day < Math.min(daysUntilExam, 30); day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      
      dailySchedule.push({
        date: currentDate.toDateString(),
        topics: subject.topics.map(topic => ({
          ...topic,
          allocatedTime: hoursPerTopic,
          timeSlot: `${9 + (topic.id.charCodeAt(0) % 8)}:00 - ${9 + (topic.id.charCodeAt(0) % 8) + hoursPerTopic}:00`
        }))
      });
    }

    return dailySchedule;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Study Modes
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Daily-wise Study Planning</h2>
          <p className="text-muted-foreground">Manage subjects with individual time allocations</p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card className="gradient-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No subjects yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Go back to the dashboard to add your first subject to start planning your daily studies
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subjects List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold">Your Subjects</h3>
            {subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className={`cursor-pointer transition-smooth hover:shadow-medium ${
                  selectedSubject?.id === subject.id ? "ring-2 ring-primary shadow-medium" : ""
                }`}
                onClick={() => setSelectedSubject(subject)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{subject.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Exam: {new Date(subject.examDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Daily Hours: {subject.dailyHours}h
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(subject.progress)}%</span>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Topics: {subject.topics.length}</span>
                      <Badge variant="secondary">{subject.topics.filter(t => t.completed).length} completed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subject Details */}
          {selectedSubject && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedSubject.name} - Topics & Timetable</h3>
                <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Topic
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Topic</DialogTitle>
                      <DialogDescription>
                        Add a new topic to {selectedSubject.name}. Time will be automatically distributed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="topicTitle">Topic Title</Label>
                        <Input
                          id="topicTitle"
                          value={newTopicData.title}
                          onChange={(e) => setNewTopicData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter topic title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select value={newTopicData.difficulty} onValueChange={(value: any) => setNewTopicData(prev => ({ ...prev, difficulty: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => addTopicToSubject(selectedSubject.id)} className="flex-1">
                          Add Topic
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddingTopic(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Topics List */}
              <div className="space-y-3">
                <h4 className="font-medium">Topics ({selectedSubject.topics.length})</h4>
                {selectedSubject.topics.map((topic) => (
                  <Card key={topic.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{topic.title}</h5>
                            <Badge variant={topic.difficulty === "easy" ? "secondary" : topic.difficulty === "medium" ? "default" : "destructive"}>
                              {topic.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Estimated: {topic.estimatedHours.toFixed(1)}h
                          </p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{Math.round(topic.progress)}%</span>
                            </div>
                            <Progress value={topic.progress} className="h-1" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Daily Timetable */}
              <div className="space-y-3">
                <h4 className="font-medium">Generated Daily Timetable</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generateDailyTimetable(selectedSubject).slice(0, 7).map((day, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2">{day.date}</h5>
                        <div className="space-y-2">
                          {day.topics.map((topic) => (
                            <div key={topic.id} className="flex items-center justify-between text-sm border rounded p-2">
                              <span>{topic.title}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{topic.timeSlot}</Badge>
                                <span>{topic.allocatedTime.toFixed(1)}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};