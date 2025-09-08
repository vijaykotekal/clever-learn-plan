import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Plus, Clock, Trash2, Edit, Youtube, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Topic {
  id: string;
  title: string;
  estimatedHours: number;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  progress: number;
  youtubeLinks?: string[];
  notes?: string;
}

interface Subject {
  id: string;
  name: string;
  examDate: string;
  topics: Topic[];
  dailyHours: number;
  progress: number;
}

export const SubjectManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedTopicForYoutube, setSelectedTopicForYoutube] = useState<Topic | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const { toast } = useToast();

  // Load data from localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem("studyPlannerSubjects");
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("studyPlannerSubjects", JSON.stringify(subjects));
  }, [subjects]);

  const addSubject = (data: { name: string; examDate: string; dailyHours: number }) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: data.name,
      examDate: data.examDate,
      dailyHours: data.dailyHours,
      topics: [],
      progress: 0,
    };
    setSubjects([...subjects, newSubject]);
    setIsAddingSubject(false);
    toast({
      title: "Subject added!",
      description: `${data.name} has been added to your study plan.`,
    });
  };

  const addTopic = (subjectId: string, data: { title: string; estimatedHours: number; difficulty: "easy" | "medium" | "hard" }) => {
    const newTopic: Topic = {
      id: Date.now().toString(),
      title: data.title,
      estimatedHours: data.estimatedHours,
      difficulty: data.difficulty,
      completed: false,
      progress: 0,
      youtubeLinks: generateYouTubeLinks(data.title),
      notes: generateTopicNotes(data.title, data.difficulty),
    };

    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? { ...subject, topics: [...subject.topics, newTopic] }
        : subject
    ));
    setIsAddingTopic(false);
    toast({
      title: "Topic added!",
      description: `${data.title} has been added to the subject.`,
    });
  };

  const generateYouTubeLinks = (topicTitle: string): string[] => {
    // Generate multiple specific YouTube search queries for better learning resources
    const baseUrl = "https://www.youtube.com/results?search_query=";
    return [
      `${baseUrl}${encodeURIComponent(`${topicTitle} tutorial explanation`)}`,
      `${baseUrl}${encodeURIComponent(`${topicTitle} examples solved`)}`,
      `${baseUrl}${encodeURIComponent(`${topicTitle} practice problems`)}`,
      `${baseUrl}${encodeURIComponent(`${topicTitle} crash course`)}`,
      `${baseUrl}${encodeURIComponent(`${topicTitle} step by step guide`)}`,
    ];
  };

  const generateTopicNotes = (topicTitle: string, difficulty: string): string => {
    // Generate AI-like study notes based on topic and difficulty
    const notes = {
      easy: `📚 Study Notes for ${topicTitle}

🎯 Learning Objectives:
• Understand the basic concepts of ${topicTitle}
• Apply fundamental principles
• Solve simple problems

📖 Key Concepts:
• Start with the definition and basic principles
• Focus on understanding rather than memorization
• Practice with simple examples

💡 Study Tips:
• Spend 20% time on theory, 80% on practice
• Use visual aids and diagrams
• Review regularly to reinforce learning

⏰ Recommended Study Approach:
1. Read and understand basic concepts (30 mins)
2. Work through examples (45 mins)
3. Practice simple problems (45 mins)
4. Review and summarize (30 mins)`,

      medium: `📚 Study Notes for ${topicTitle}

🎯 Learning Objectives:
• Master intermediate concepts of ${topicTitle}
• Apply knowledge to complex scenarios
• Develop problem-solving strategies

📖 Key Concepts:
• Build upon basic foundations
• Understand relationships between concepts
• Learn multiple approaches to problem-solving

💡 Study Tips:
• Create concept maps to visualize connections
• Practice with varied problem types
• Teach the concept to someone else
• Use active recall techniques

⏰ Recommended Study Approach:
1. Review prerequisites (20 mins)
2. Study new concepts thoroughly (60 mins)
3. Work through medium-level problems (90 mins)
4. Create summary notes (30 mins)
5. Test understanding with practice questions (60 mins)`,

      hard: `📚 Study Notes for ${topicTitle}

🎯 Learning Objectives:
• Master advanced concepts of ${topicTitle}
• Synthesize knowledge from multiple sources
• Solve complex, multi-step problems

📖 Key Concepts:
• Advanced theoretical understanding required
• Integration with other topics essential
• Critical thinking and analysis needed

💡 Study Tips:
• Break down complex problems into smaller parts
• Use multiple resources and perspectives
• Form study groups for discussion
• Create detailed concept maps
• Practice explaining complex ideas simply

⏰ Recommended Study Approach:
1. Thorough review of related topics (45 mins)
2. Deep study of advanced concepts (90 mins)
3. Analyze complex examples (75 mins)
4. Work through challenging problems (120 mins)
5. Create comprehensive notes (45 mins)
6. Test with advanced practice questions (90 mins)

🔄 Review Schedule:
• Daily: Quick concept review (15 mins)
• Weekly: Practice problems (60 mins)
• Monthly: Comprehensive review (3 hours)`
    };

    return notes[difficulty as keyof typeof notes] || notes.medium;
  };

  const updateTopicProgress = (subjectId: string, topicId: string, progress: number) => {
    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? {
            ...subject,
            topics: subject.topics.map(topic =>
              topic.id === topicId 
                ? { ...topic, progress, completed: progress === 100 }
                : topic
            )
          }
        : subject
    ));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success";
      case "medium": return "bg-warning";
      case "hard": return "bg-danger";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Subject Management</h2>
          <p className="text-muted-foreground">Organize your subjects and topics for optimal learning</p>
        </div>
        <AddSubjectDialog onAdd={addSubject} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Subjects List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold">Your Subjects</h3>
          {subjects.length === 0 ? (
            <Card className="gradient-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No subjects yet</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Add your first subject to start planning your studies
                </p>
              </CardContent>
            </Card>
          ) : (
            subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className={`cursor-pointer transition-smooth hover:shadow-medium ${
                  selectedSubject?.id === subject.id ? "ring-2 ring-primary shadow-medium" : ""
                }`}
                onClick={() => setSelectedSubject(subject)}
              >
                <CardContent className="p-4">
                  <h4 className="font-semibold">{subject.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Exam: {new Date(subject.examDate).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(subject.progress)}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Clock className="h-4 w-4 mr-1" />
                    {subject.dailyHours}h/day
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Topics Details */}
        <div className="lg:col-span-2">
          {selectedSubject ? (
            <Card className="gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {selectedSubject.name} Topics
                    </CardTitle>
                    <CardDescription>
                      Manage your study topics and track progress
                    </CardDescription>
                  </div>
                  <AddTopicDialog 
                    subjectId={selectedSubject.id} 
                    onAdd={(data) => addTopic(selectedSubject.id, data)} 
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSubject.topics.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No topics yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Add topics to break down your subject into manageable chunks
                    </p>
                  </div>
                ) : (
                  selectedSubject.topics.map((topic) => (
                    <Card key={topic.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{topic.title}</h4>
                            <Badge 
                              variant="secondary" 
                              className={`${getDifficultyColor(topic.difficulty)} text-white`}
                            >
                              {topic.difficulty}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            {topic.estimatedHours} hours estimated
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{topic.progress}%</span>
                            </div>
                            <Progress value={topic.progress} className="h-2" />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateTopicProgress(selectedSubject.id, topic.id, 25)}
                              >
                                25%
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateTopicProgress(selectedSubject.id, topic.id, 50)}
                              >
                                50%
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateTopicProgress(selectedSubject.id, topic.id, 75)}
                              >
                                75%
                              </Button>
                              <Button 
                                size="sm" 
                                variant="success"
                                onClick={() => updateTopicProgress(selectedSubject.id, topic.id, 100)}
                              >
                                Complete
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedTopic(topic)}
                            title="View study notes"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedTopicForYoutube(topic)}
                            title="YouTube resources"
                          >
                            <Youtube className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="gradient-card">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a subject</h3>
                <p className="text-muted-foreground text-center">
                  Choose a subject from the left to view and manage its topics
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Topic Notes Dialog */}
      {selectedTopic && (
        <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Study Notes: {selectedTopic.title}
              </DialogTitle>
              <DialogDescription>
                AI-generated study notes tailored for {selectedTopic.difficulty} difficulty level
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(selectedTopic.difficulty)}>
                  {selectedTopic.difficulty.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {selectedTopic.estimatedHours} hours
                </Badge>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {selectedTopic.notes}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* YouTube Resources Dialog */}
      {selectedTopicForYoutube && (
        <Dialog open={!!selectedTopicForYoutube} onOpenChange={() => setSelectedTopicForYoutube(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5" />
                YouTube Resources: {selectedTopicForYoutube.title}
              </DialogTitle>
              <DialogDescription>
                Curated learning resources to help you master this topic
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {selectedTopicForYoutube.youtubeLinks?.map((link, index) => {
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Add Subject Dialog Component
const AddSubjectDialog = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    examDate: "",
    dailyHours: 2,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: "", examDate: "", dailyHours: 2 });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="study">
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>
            Create a new subject to add to your study plan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject-name">Subject Name</Label>
            <Input
              id="subject-name"
              placeholder="e.g., Mathematics, Physics, History"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="exam-date">Exam Date</Label>
            <Input
              id="exam-date"
              type="date"
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="daily-hours">Daily Study Hours</Label>
            <Input
              id="daily-hours"
              type="number"
              min="1"
              max="12"
              value={formData.dailyHours}
              onChange={(e) => setFormData({ ...formData, dailyHours: parseInt(e.target.value) })}
              required
            />
          </div>
          <Button type="submit" className="w-full" variant="study">
            Add Subject
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add Topic Dialog Component
const AddTopicDialog = ({ subjectId, onAdd }: { subjectId: string; onAdd: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    title: "",
    estimatedHours: 4,
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ title: "", estimatedHours: 4, difficulty: "medium" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Topic</DialogTitle>
          <DialogDescription>
            Break down your subject into manageable topics
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="topic-title">Topic Title</Label>
            <Input
              id="topic-title"
              placeholder="e.g., Calculus Derivatives, World War II"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="estimated-hours">Estimated Hours</Label>
            <Input
              id="estimated-hours"
              type="number"
              min="1"
              max="50"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select 
              value={formData.difficulty} 
              onValueChange={(value: "easy" | "medium" | "hard") => 
                setFormData({ ...formData, difficulty: value })
              }
            >
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
          <Button type="submit" className="w-full" variant="study">
            Add Topic
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};