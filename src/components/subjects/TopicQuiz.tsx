import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HelpCircle, CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Topic {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  quiz?: QuizQuestion[];
}

interface TopicQuizProps {
  topic: Topic;
  isOpen: boolean;
  onClose: () => void;
}

export const TopicQuiz = ({ topic, isOpen, onClose }: TopicQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { toast } = useToast();

  const questions = topic.quiz || [];
  const totalQuestions = questions.length;

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizCompleted) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      setShowResults(true);
      
      const score = calculateScore();
      const percentage = Math.round((score / totalQuestions) * 100);
      
      toast({
        title: "Quiz completed!",
        description: `You scored ${score}/${totalQuestions} (${percentage}%)`,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuizCompleted(false);
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return score + (answer === questions[index]?.correctAnswer ? 1 : 0);
    }, 0);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-danger";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success text-success-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "hard": return "bg-danger text-danger-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!questions.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Quiz: {topic.title}
            </DialogTitle>
            <DialogDescription>
              No quiz questions available for this topic yet.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Quiz questions will be generated automatically when you add this topic.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQ = questions[currentQuestion];
  const score = calculateScore();
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz: {topic.title}
          </DialogTitle>
          <DialogDescription>
            Test your knowledge with this {topic.difficulty} level quiz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quiz Header */}
          <div className="flex items-center justify-between">
            <Badge className={getDifficultyColor(topic.difficulty)}>
              {topic.difficulty.toUpperCase()}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {totalQuestions}
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2" />

          {showResults ? (
            /* Results View */
            <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Trophy className="h-6 w-6 text-warning" />
                    Quiz Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(percentage)}`}>
                    {score}/{totalQuestions}
                  </div>
                  <div className={`text-xl mb-4 ${getScoreColor(percentage)}`}>
                    {percentage}%
                  </div>
                  <div className="text-muted-foreground">
                    {percentage >= 80 && "Excellent work! You've mastered this topic."}
                    {percentage >= 60 && percentage < 80 && "Good job! Review the concepts you missed."}
                    {percentage < 60 && "Keep studying! Review the material and try again."}
                  </div>
                </CardContent>
              </Card>

              {/* Answer Review */}
              <div className="space-y-4">
                <h3 className="font-semibold">Answer Review</h3>
                {questions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-success' : 'border-l-danger'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-danger" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium mb-2">{question.question}</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-muted-foreground">
                                Your answer: <span className={isCorrect ? 'text-success' : 'text-danger'}>
                                  {question.options[userAnswer] || 'Not answered'}
                                </span>
                              </p>
                              {!isCorrect && (
                                <p className="text-muted-foreground">
                                  Correct answer: <span className="text-success">
                                    {question.options[question.correctAnswer]}
                                  </span>
                                </p>
                              )}
                              <p className="text-muted-foreground italic">
                                {question.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center gap-2">
                <Button onClick={handleRestart} className="gradient-primary">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            /* Question View */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentQ.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentQ.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestion] === index;
                    
                    return (
                      <Button
                        key={index}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full text-left justify-start h-auto p-4 ${
                          isSelected ? "bg-primary text-primary-foreground" : ""
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? "border-primary-foreground bg-primary-foreground text-primary" 
                              : "border-muted-foreground"
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-wrap">{option}</span>
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                  className="gradient-primary"
                >
                  {currentQuestion === totalQuestions - 1 ? "Finish Quiz" : "Next"}
                </Button>
              </div>

              {/* Question Progress */}
              <div className="text-center text-sm text-muted-foreground">
                {selectedAnswers.filter(answer => answer !== undefined).length} of {totalQuestions} questions answered
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};