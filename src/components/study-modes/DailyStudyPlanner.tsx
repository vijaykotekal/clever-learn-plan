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
import { Calendar, Clock, Plus, ArrowLeft, BookOpen, Target, Edit, Trash2, BarChart3, Sparkles, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { AIScheduler } from "@/utils/aiScheduler";
import { SubjectDetails } from "@/components/subjects/SubjectDetails";

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
  const { subjects: dbSubjects, loading, addTopic: dbAddTopic, addSubject } = useSubjects();
  const { savePlan } = useStudyPlans();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [viewingSubject, setViewingSubject] = useState<typeof dbSubjects[0] | null>(null);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTopicData, setNewTopicData] = useState({ title: "", difficulty: "medium" as const });
  const [newSubjectData, setNewSubjectData] = useState({
    name: "",
    examDate: "",
    dailyHours: 2,
    topics: [""]
  });
  const { toast } = useToast();
  const scheduler = new AIScheduler();

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

  const generateAISchedule = async () => {
    if (subjects.length === 0) {
      toast({
        title: "No subjects",
        description: "Please add subjects first before generating a schedule",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Transform subjects to AIScheduler format
    const aiSubjects = subjects.map(s => ({
      id: s.id,
      name: s.name,
      examDate: s.examDate,
      dailyHours: s.dailyHours,
      progress: s.progress,
      topics: s.topics.map(t => ({
        id: t.id,
        title: t.title,
        subjectId: s.id,
        subjectName: s.name,
        estimatedHours: t.estimatedHours,
        difficulty: t.difficulty,
        progress: t.progress,
        completed: t.completed
      }))
    }));

    // Simulate AI processing
    setTimeout(async () => {
      const plan = scheduler.generateSchedule(aiSubjects);
      await savePlan('daily', plan);
      
      setIsGenerating(false);
      toast({
        title: "Schedule generated!",
        description: "Your AI-powered daily study plan is ready. Check the AI Schedule tab.",
      });
    }, 1500);
  };

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Study Modes
        </Button>
      </div>

      <div>
        <h2 className="text-3xl font-bold">Daily-wise Study Planning</h2>
        <p className="text-muted-foreground">Manage subjects with individual time allocations</p>
      </div>

      {subjects.length === 0 ? (
        <>
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
              <p className="text-sm text-muted-foreground text-center">
                Add your first subject to start planning your daily studies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subject Management</CardTitle>
                  <CardDescription>Organize your subjects and topics for optimal learning</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="study" 
                    onClick={generateAISchedule}
                    disabled={isGenerating || subjects.length === 0}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate AI Schedule"}
                  </Button>
                  <Button variant="outline" disabled>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Progress Chart
                  </Button>
                  <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subject
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Subject</DialogTitle>
                        <DialogDescription>
                          Create a new subject with topics and study plan details
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                        <div>
                          <Label htmlFor="dailyHours">Daily Study Hours</Label>
                          <Input
                            id="dailyHours"
                            type="number"
                            min="1"
                            max="24"
                            value={newSubjectData.dailyHours}
                            onChange={(e) => setNewSubjectData(prev => ({ ...prev, dailyHours: parseInt(e.target.value) || 2 }))}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Time will be distributed equally among all topics
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Topics</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={addTopicField}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Topic
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {newSubjectData.topics.map((topic, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={topic}
                                  onChange={(e) => updateTopicField(index, e.target.value)}
                                  placeholder={`Topic ${index + 1}`}
                                />
                                {newSubjectData.topics.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTopicField(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Each topic will get approximately {hoursPerTopic.toFixed(1)} hours per day
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsAddingSubject(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddSubject}>
                            Add Subject
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-semibold mb-2">No subjects yet</h4>
                    <p className="text-sm text-muted-foreground text-center">
                      Add your first subject to start planning your studies
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-semibold mb-2">Select a subject</h4>
                    <p className="text-sm text-muted-foreground text-center">
                      Choose a subject from the left to view and manage its topics
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subject Management</CardTitle>
                  <CardDescription>Organize your subjects and topics for optimal learning</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Progress Chart
                  </Button>
                  <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subject
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Subject</DialogTitle>
                        <DialogDescription>
                          Create a new subject with topics and study plan details
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                        <div>
                          <Label htmlFor="dailyHours">Daily Study Hours</Label>
                          <Input
                            id="dailyHours"
                            type="number"
                            min="1"
                            max="24"
                            value={newSubjectData.dailyHours}
                            onChange={(e) => setNewSubjectData(prev => ({ ...prev, dailyHours: parseInt(e.target.value) || 2 }))}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Time will be distributed equally among all topics
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Topics</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={addTopicField}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Topic
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {newSubjectData.topics.map((topic, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={topic}
                                  onChange={(e) => updateTopicField(index, e.target.value)}
                                  placeholder={`Topic ${index + 1}`}
                                />
                                {newSubjectData.topics.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTopicField(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Each topic will get approximately {hoursPerTopic.toFixed(1)} hours per day
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsAddingSubject(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddSubject}>
                            Add Subject
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Subjects List */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Your Subjects</h3>
                  {subjects.map((subject) => (
                    <Card 
                      key={subject.id} 
                      className={`cursor-pointer transition-smooth hover:shadow-sm ${
                        selectedSubject?.id === subject.id ? "ring-2 ring-primary" : ""
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dbSubject = dbSubjects.find(s => s.id === subject.id);
                              if (dbSubject) setViewingSubject(dbSubject);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Resources
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Subject Details */}
                {selectedSubject ? (
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{selectedSubject.name} - Topics & Timetable</h3>
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
                  </div>
                ) : (
                  <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="font-semibold mb-2">Select a subject</h4>
                        <p className="text-sm text-muted-foreground text-center">
                          Choose a subject from the left to view and manage its topics
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};