import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Square, Clock } from "lucide-react";
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
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [goalMinutes, setGoalMinutes] = useState(topic.estimatedHours * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Timer logic - counts UP indefinitely
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
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
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    toast({
      title: "Timer started",
      description: `Study session for ${topic.title} has begun.`,
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    if (elapsedTime > 0) {
      onTimeUpdate(Math.floor(elapsedTime / 60));
      toast({
        title: "Timer stopped",
        description: `Study time saved: ${formatTime(elapsedTime)}`,
      });
    }
    setElapsedTime(0);
  };

  const handleClose = () => {
    if (isRunning) {
      setIsRunning(false);
      if (elapsedTime > 0) {
        onTimeUpdate(Math.floor(elapsedTime / 60));
      }
    }
    setElapsedTime(0);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Study Timer
          </DialogTitle>
          <DialogDescription>
            Track your study time for {topic.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Topic Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{topic.title}</h3>
              <div className="text-sm text-muted-foreground">
                {topic.difficulty.toUpperCase()} Level
              </div>
            </CardContent>
          </Card>

          {/* Goal Setting */}
          <div className="space-y-2">
            <Label htmlFor="goal">Study Goal (minutes)</Label>
            <Input
              id="goal"
              type="number"
              value={goalMinutes}
              onChange={(e) => setGoalMinutes(Number(e.target.value))}
              disabled={isRunning}
              min={1}
              placeholder="Enter study goal in minutes"
            />
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-7xl font-bold font-mono text-primary">
              {formatTime(elapsedTime)}
            </div>
            
            {goalMinutes > 0 && (
              <div className="text-sm text-muted-foreground">
                Goal: {goalMinutes} minutes ({Math.round((elapsedTime / 60 / goalMinutes) * 100)}%)
              </div>
            )}
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="gradient-primary px-8"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Timer
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="px-8"
                size="lg"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Timer
              </Button>
            )}
          </div>

          {/* Study Stats */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Session Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Session</p>
                  <p className="font-medium">{formatTime(elapsedTime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Studied</p>
                  <p className="font-medium">
                    {Math.floor(topic.timeSpent / 60)}h {topic.timeSpent % 60}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};