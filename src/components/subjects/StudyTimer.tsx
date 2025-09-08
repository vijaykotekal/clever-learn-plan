import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Topic {
  id: string;
  title: string;
  estimatedHours: number;
  difficulty: "easy" | "medium" | "hard";
  timeSpent: number;
}

interface StudyTimerProps {
  topic: Topic;
  isOpen: boolean;
  onClose: () => void;
  onTimeUpdate: (timeSpent: number) => void;
}

export const StudyTimer = ({ topic, isOpen, onClose, onTimeUpdate }: StudyTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0); // in seconds
  const [sessionTime, setSessionTime] = useState(0); // in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load saved timer state for this topic
  useEffect(() => {
    const savedState = localStorage.getItem(`timer-${topic.id}`);
    if (savedState) {
      try {
        const { timeLeft, totalTime, isRunning } = JSON.parse(savedState);
        setTimeLeft(timeLeft);
        setTotalTime(totalTime);
        // Don't restore isRunning state - always start paused
      } catch (error) {
        console.error("Error loading timer state:", error);
      }
    } else {
      // Initialize with topic's estimated hours
      const initialTime = topic.estimatedHours * 60 * 60; // convert to seconds
      setTimeLeft(initialTime);
      setTotalTime(initialTime);
    }
  }, [topic.id, topic.estimatedHours]);

  // Save timer state whenever it changes
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(`timer-${topic.id}`, JSON.stringify({
        timeLeft,
        totalTime,
        isRunning
      }));
    }
  }, [timeLeft, totalTime, isRunning, topic.id, isOpen]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setSessionTime(prev => prev + 1);
            toast({
              title: "Timer completed!",
              description: `You've finished studying ${topic.title}. Great job!`,
            });
            // Auto-update the time spent
            onTimeUpdate(Math.floor(sessionTime / 60) + 1); // Convert to minutes and add the final minute
            return 0;
          }
          return prev - 1;
        });
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, sessionTime, topic.title, toast, onTimeUpdate]);

  const handleStart = () => {
    setIsRunning(true);
    toast({
      title: "Timer started",
      description: `Study session for ${topic.title} has begun.`,
    });
  };

  const handlePause = () => {
    setIsRunning(false);
    // Save session time when pausing
    if (sessionTime > 0) {
      onTimeUpdate(Math.floor(sessionTime / 60));
      setSessionTime(0);
    }
    toast({
      title: "Timer paused",
      description: "Your progress has been saved.",
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    const initialTime = topic.estimatedHours * 60 * 60;
    setTimeLeft(initialTime);
    setTotalTime(initialTime);
    if (sessionTime > 0) {
      onTimeUpdate(Math.floor(sessionTime / 60));
    }
    setSessionTime(0);
    // Clear saved state
    localStorage.removeItem(`timer-${topic.id}`);
    toast({
      title: "Timer reset",
      description: "Timer has been reset to original duration.",
    });
  };

  const handleClose = () => {
    if (isRunning) {
      setIsRunning(false);
    }
    if (sessionTime > 0) {
      onTimeUpdate(Math.floor(sessionTime / 60));
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-success";
      case "medium": return "text-warning";
      case "hard": return "text-danger";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Study Timer
          </DialogTitle>
          <DialogDescription>
            Focus on {topic.title} with our dedicated study timer
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Topic Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{topic.title}</h3>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className={getDifficultyColor(topic.difficulty)}>
                  {topic.difficulty.toUpperCase()} Level
                </span>
                <span>{topic.estimatedHours}h estimated</span>
              </div>
            </CardContent>
          </Card>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold font-mono text-primary">
              {formatTime(timeLeft)}
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={getProgressPercentage()} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress: {Math.round(getProgressPercentage())}%</span>
                <span>Session: {formatTime(sessionTime)}</span>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="gradient-primary px-6"
                disabled={timeLeft === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="outline"
                className="px-6"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Study Stats */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                <h4 className="font-medium">Study Statistics</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Studied</p>
                  <p className="font-medium">
                    {Math.floor(topic.timeSpent / 60)}h {topic.timeSpent % 60}m
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today's Session</p>
                  <p className="font-medium">{formatTime(sessionTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Tips based on difficulty */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Study Tip</h4>
              <p className="text-sm text-muted-foreground">
                {topic.difficulty === "easy" && "Take breaks every 25 minutes to maintain focus. Review key concepts actively."}
                {topic.difficulty === "medium" && "Use active recall techniques. Test yourself regularly and explain concepts aloud."}
                {topic.difficulty === "hard" && "Break complex problems into smaller parts. Use multiple resources and practice extensively."}
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};