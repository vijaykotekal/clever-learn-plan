import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookOpen, Plus, Clock, Trash2, Edit, Youtube, FileText, ExternalLink, Play, Pause, RotateCcw, HelpCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudyTimer } from "./StudyTimer";
import { TopicQuiz } from "./TopicQuiz";
import { ProgressChart } from "./ProgressChart";

interface Topic {
  id: string;
  title: string;
  estimatedHours: number;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  progress: number;
  youtubeLinks?: string[];
  notes?: string;
  quiz?: QuizQuestion[];
  timeSpent: number; // in minutes
  sessions: StudySession[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface StudySession {
  id: string;
  date: string;
  duration: number; // in minutes
  completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  examDate: string;
  topics: Topic[];
  dailyHours: number;
  progress: number;
  totalTimeSpent: number; // in minutes
}

export const SubjectManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedTopicForYoutube, setSelectedTopicForYoutube] = useState<Topic | null>(null);
  const [selectedTopicForQuiz, setSelectedTopicForQuiz] = useState<Topic | null>(null);
  const [selectedTopicForTimer, setSelectedTopicForTimer] = useState<Topic | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showProgressChart, setShowProgressChart] = useState(false);
  const { toast } = useToast();

  // Load data from localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem("studyPlannerSubjects");
    if (savedSubjects) {
      try {
        setSubjects(JSON.parse(savedSubjects));
      } catch (error) {
        console.error("Error parsing saved subjects:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("studyPlannerSubjects", JSON.stringify(subjects));
    }
  }, [subjects, isLoaded]);

  const addSubject = (data: { name: string; examDate: string; dailyHours: number; topics: string[] }) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: data.name,
      examDate: data.examDate,
      dailyHours: data.dailyHours,
      topics: data.topics.map((topicTitle, index) => ({
        id: `${Date.now()}-${index}`,
        title: topicTitle,
        estimatedHours: data.dailyHours / data.topics.length, // Distribute hours equally
        difficulty: "medium" as const,
        completed: false,
        progress: 0,
        youtubeLinks: generateYouTubeLinks(topicTitle),
        notes: generateTopicNotes(topicTitle, "medium"),
        quiz: generateTopicQuiz(topicTitle),
        timeSpent: 0,
        sessions: []
      })),
      progress: 0,
      totalTimeSpent: 0,
    };
    setSubjects([...subjects, newSubject]);
    setIsAddingSubject(false);
    toast({
      title: "Subject added!",
      description: `${data.name} with ${data.topics.length} topics has been added to your study plan.`,
    });
  };

  const deleteSubject = (subjectId: string) => {
    setSubjects(subjects.filter(subject => subject.id !== subjectId));
    if (selectedSubject?.id === subjectId) {
      setSelectedSubject(null);
    }
    toast({
      title: "Subject deleted",
      description: "The subject has been removed from your study plan.",
    });
  };

  const addTopic = (subjectId: string, data: { title: string; estimatedHours?: number; difficulty: "easy" | "medium" | "hard" }) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    // Use existing subject's dailyHours divided by total topics if no hours specified
    const estimatedHours = data.estimatedHours || (subject.dailyHours / (subject.topics.length + 1));
    
    const newTopic: Topic = {
      id: Date.now().toString(),
      title: data.title,
      estimatedHours,
      difficulty: data.difficulty,
      completed: false,
      progress: 0,
      youtubeLinks: generateYouTubeLinks(data.title),
      notes: generateTopicNotes(data.title, data.difficulty),
      quiz: generateTopicQuiz(data.title),
      timeSpent: 0,
      sessions: []
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
    const notes = {
      easy: `📚 Study Notes for ${topicTitle}

🎯 Learning Objectives:
• Understand the basic concepts of ${topicTitle}
• Apply fundamental principles in simple scenarios
• Solve straightforward problems with confidence
• Build a solid foundation for advanced topics

📖 Key Concepts:
• Definition and fundamental principles
• Basic terminology and vocabulary
• Simple applications and examples
• Common patterns and approaches

💡 Study Tips:
• Start with visual aids and diagrams
• Practice with simple, clear examples
• Use repetition to reinforce concepts
• Connect to real-world applications
• Take frequent breaks to maintain focus

⏰ Recommended Study Approach:
1. Introduction and overview (20 mins)
2. Core concept explanation (40 mins)
3. Simple examples walkthrough (45 mins)
4. Basic practice problems (30 mins)
5. Summary and key points review (15 mins)

🔄 Review Schedule:
• Daily: Quick concept review (10 mins)
• Weekly: Practice problems (30 mins)
• Before exam: Comprehensive review (1 hour)

🎯 Success Metrics:
• Can explain basic concepts clearly
• Solves simple problems correctly
• Feels confident with fundamentals`,

      medium: `📚 Study Notes for ${topicTitle}

🎯 Learning Objectives:
• Master intermediate concepts of ${topicTitle}
• Apply knowledge to moderately complex scenarios
• Develop analytical and problem-solving strategies
• Connect concepts across different contexts

📖 Key Concepts:
• Advanced principles and theories
• Relationships between different concepts
• Multiple approaches to problem-solving
• Integration with related topics
• Common variations and exceptions

💡 Study Tips:
• Create detailed concept maps
• Practice with diverse problem types
• Explain concepts to others (teaching method)
• Use active recall and spaced repetition
• Analyze mistakes to improve understanding
• Form study groups for discussion

⏰ Recommended Study Approach:
1. Prerequisites review (25 mins)
2. New concept deep dive (70 mins)
3. Intermediate examples analysis (60 mins)
4. Problem-solving practice (90 mins)
5. Concept connections mapping (30 mins)
6. Self-assessment quiz (35 mins)

🔄 Review Schedule:
• Daily: Concept review with examples (20 mins)
• Weekly: Mixed practice problems (60 mins)
• Bi-weekly: Teaching/explaining to others (45 mins)
• Before exam: Intensive review (2.5 hours)

🎯 Success Metrics:
• Solves intermediate problems accurately
• Explains concepts with examples
• Makes connections between topics
• Applies knowledge to new situations`,

      hard: `📚 Study Notes for ${topicTitle}

🎯 Learning Objectives:
• Master advanced concepts of ${topicTitle}
• Synthesize knowledge from multiple sources
• Solve complex, multi-step problems efficiently
• Develop expert-level analytical skills
• Create innovative solutions and approaches

📖 Key Concepts:
• Advanced theoretical frameworks
• Complex interdependencies
• Multiple solution methodologies
• Edge cases and special conditions
• Research-level understanding
• Real-world applications and limitations

💡 Study Tips:
• Break complex problems into manageable parts
• Use multiple authoritative sources
• Engage in peer discussions and debates
• Create comprehensive mind maps
• Practice explaining complex ideas simply
• Analyze expert solutions and approaches
• Develop personal problem-solving frameworks

⏰ Recommended Study Approach:
1. Foundation review and reinforcement (45 mins)
2. Advanced theory deep study (90 mins)
3. Complex examples analysis (80 mins)
4. Multi-step problem solving (120 mins)
5. Case study analysis (60 mins)
6. Comprehensive note synthesis (45 mins)
7. Advanced practice and testing (90 mins)

🔄 Review Schedule:
• Daily: Core concept reinforcement (25 mins)
• Every 2 days: Complex problem practice (75 mins)
• Weekly: Comprehensive topic review (2 hours)
• Bi-weekly: Integration with other topics (90 mins)
• Before exam: Intensive mastery review (4+ hours)

🎯 Success Metrics:
• Solves complex problems independently
• Explains advanced concepts to others
• Integrates knowledge across disciplines
• Develops innovative solutions
• Demonstrates expert-level understanding

🚀 Advanced Extensions:
• Research current developments in the field
• Explore practical applications in industry
• Connect with expert practitioners
• Contribute to academic discussions
• Develop teaching materials for others`
    };

    return notes[difficulty as keyof typeof notes] || notes.medium;
  };

  const generateTopicQuiz = (topicTitle: string): QuizQuestion[] => {
    // Generate 5 quiz questions for each topic
    return [
      {
        id: `${Date.now()}-1`,
        question: `What is the fundamental concept behind ${topicTitle}?`,
        options: [
          "A basic principle that forms the foundation",
          "An advanced technique used by experts",
          "A mathematical formula",
          "A memorization strategy"
        ],
        correctAnswer: 0,
        explanation: `The fundamental concept of ${topicTitle} refers to the basic principle that forms the foundation for understanding this topic.`
      },
      {
        id: `${Date.now()}-2`,
        question: `Which approach is most effective when learning ${topicTitle}?`,
        options: [
          "Memorizing all details",
          "Understanding concepts and practicing",
          "Reading once quickly",
          "Skipping difficult parts"
        ],
        correctAnswer: 1,
        explanation: "Understanding concepts and practicing is the most effective approach for deep learning and retention."
      },
      {
        id: `${Date.now()}-3`,
        question: `What is a common mistake when studying ${topicTitle}?`,
        options: [
          "Taking too many breaks",
          "Focusing only on theory without practice",
          "Using multiple resources",
          "Taking notes"
        ],
        correctAnswer: 1,
        explanation: "Focusing only on theory without practice is a common mistake. Balanced learning includes both understanding and application."
      },
      {
        id: `${Date.now()}-4`,
        question: `How should you review ${topicTitle} for long-term retention?`,
        options: [
          "Study once and forget",
          "Cram before exams",
          "Regular spaced review",
          "Only review when confused"
        ],
        correctAnswer: 2,
        explanation: "Regular spaced review is scientifically proven to be the most effective method for long-term retention."
      },
      {
        id: `${Date.now()}-5`,
        question: `What indicates you've mastered ${topicTitle}?`,
        options: [
          "You can read about it",
          "You can teach it to others",
          "You've seen it before",
          "You can copy examples"
        ],
        correctAnswer: 1,
        explanation: "Being able to teach a topic to others is the highest indicator of mastery, as it requires deep understanding."
      }
    ];
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

  const updateTopicTime = (subjectId: string, topicId: string, timeSpent: number) => {
    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? {
            ...subject,
            topics: subject.topics.map(topic =>
              topic.id === topicId 
                ? { 
                    ...topic, 
                    timeSpent: topic.timeSpent + timeSpent,
                    sessions: [...topic.sessions, {
                      id: Date.now().toString(),
                      date: new Date().toISOString(),
                      duration: timeSpent,
                      completed: true
                    }]
                  }
                : topic
            ),
            totalTimeSpent: subject.totalTimeSpent + timeSpent
          }
        : subject
    ));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success text-success-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "hard": return "bg-danger text-danger-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Subject Management</h2>
          <p className="text-muted-foreground">Organize your subjects and topics for optimal learning</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowProgressChart(true)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Progress Chart
          </Button>
          <AddSubjectDialog onAdd={addSubject} />
        </div>
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {subject.dailyHours}h/day
                        </div>
                        <div className="text-xs">
                          {Math.floor(subject.totalTimeSpent / 60)}h {subject.totalTimeSpent % 60}m studied
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger hover:bg-danger/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{subject.name}"? This action cannot be undone and will remove all associated topics and progress.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSubject(subject.id)}
                            className="bg-danger text-danger-foreground hover:bg-danger/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                            <Badge className={getDifficultyColor(topic.difficulty)}>
                              {topic.difficulty}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {topic.estimatedHours}h estimated
                            </div>
                            <div className="text-xs">
                              {Math.floor(topic.timeSpent / 60)}h {topic.timeSpent % 60}m studied
                            </div>
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
                                className="bg-success text-success-foreground hover:bg-success/90"
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
                            onClick={() => setSelectedTopicForTimer(topic)}
                            title="Study timer"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
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
                            onClick={() => setSelectedTopicForQuiz(topic)}
                            title="Take quiz"
                          >
                            <HelpCircle className="h-4 w-4" />
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

      {/* Study Timer Dialog */}
      {selectedTopicForTimer && (
        <StudyTimer
          topic={selectedTopicForTimer}
          isOpen={!!selectedTopicForTimer}
          onClose={() => setSelectedTopicForTimer(null)}
          onTimeUpdate={(timeSpent) => {
            if (selectedSubject) {
              updateTopicTime(selectedSubject.id, selectedTopicForTimer.id, timeSpent);
            }
          }}
        />
      )}

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

      {/* Topic Quiz Dialog */}
      {selectedTopicForQuiz && (
        <TopicQuiz
          topic={selectedTopicForQuiz}
          isOpen={!!selectedTopicForQuiz}
          onClose={() => setSelectedTopicForQuiz(null)}
        />
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(selectedTopicForYoutube.difficulty)}>
                  {selectedTopicForYoutube.difficulty.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {selectedTopicForYoutube.estimatedHours} hours
                </Badge>
              </div>
              <div className="space-y-3">
                {selectedTopicForYoutube.youtubeLinks?.map((link, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-smooth">
                    <Youtube className="h-5 w-5 text-danger" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {index === 0 && "Tutorial & Explanation"}
                        {index === 1 && "Solved Examples"}
                        {index === 2 && "Practice Problems"}
                        {index === 3 && "Crash Course"}
                        {index === 4 && "Step-by-Step Guide"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Curated videos for {selectedTopicForYoutube.difficulty} level
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Progress Chart Dialog */}
      {showProgressChart && (
        <ProgressChart
          subjects={subjects}
          isOpen={showProgressChart}
          onClose={() => setShowProgressChart(false)}
        />
      )}
    </div>
  );
};

// Enhanced Add Subject Dialog with topic management
const AddSubjectDialog = ({ onAdd }: { onAdd: (data: { name: string; examDate: string; dailyHours: number; topics: string[] }) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [topics, setTopics] = useState<string[]>([""]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && examDate && topics.some(topic => topic.trim())) {
      onAdd({
        name,
        examDate,
        dailyHours,
        topics: topics.filter(topic => topic.trim())
      });
      setName("");
      setExamDate("");
      setDailyHours(2);
      setTopics([""]);
      setIsOpen(false);
    }
  };

  const addTopicField = () => {
    setTopics([...topics, ""]);
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const removeTopic = (index: number) => {
    if (topics.length > 1) {
      setTopics(topics.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>
            Create a new subject with topics and study plan details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-date">Exam Date</Label>
              <Input
                id="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="daily-hours">Daily Study Hours</Label>
            <Input
              id="daily-hours"
              type="number"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseInt(e.target.value) || 1)}
              min="1"
              max="12"
              required
            />
            <p className="text-sm text-muted-foreground">
              Time will be distributed equally among all topics
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Topics</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTopicField}>
                <Plus className="h-4 w-4 mr-1" />
                Add Topic
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {topics.map((topic, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={topic}
                    onChange={(e) => updateTopic(index, e.target.value)}
                    placeholder={`Topic ${index + 1}`}
                    className="flex-1"
                  />
                  {topics.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTopic(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Each topic will get approximately {(dailyHours / topics.filter(t => t.trim()).length || 1).toFixed(1)} hours per day
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary">
              Add Subject
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add Topic Dialog (for adding individual topics to existing subjects)
const AddTopicDialog = ({ subjectId, onAdd }: { subjectId: string; onAdd: (data: { title: string; estimatedHours: number; difficulty: "easy" | "medium" | "hard" }) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd({ title, estimatedHours, difficulty });
      setTitle("");
      setEstimatedHours(2);
      setDifficulty("medium");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Topic</DialogTitle>
          <DialogDescription>
            Add a new topic to this subject
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-title">Topic Title</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Linear Equations"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimated-hours">Estimated Hours</Label>
            <Input
              id="estimated-hours"
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 1)}
              min="1"
              max="20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary">
              Add Topic
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};