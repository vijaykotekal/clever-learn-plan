import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, BookOpen, Target, ArrowLeft } from "lucide-react";
import { DailyStudyPlanner } from "@/components/study-modes/DailyStudyPlanner";
import { ExamStudyPlanner } from "@/components/study-modes/ExamStudyPlanner";

interface StudyModesProps {
  onBack: () => void;
}

export const StudyModes = ({ onBack }: StudyModesProps) => {
  const [selectedMode, setSelectedMode] = useState<"daily" | "exam" | null>(null);

  if (selectedMode === "daily") {
    return <DailyStudyPlanner onBack={() => setSelectedMode(null)} />;
  }

  if (selectedMode === "exam") {
    return <ExamStudyPlanner onBack={() => setSelectedMode(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Study Planning Modes</h2>
          <p className="text-muted-foreground">Choose your preferred study planning approach</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily-wise Study Mode */}
        <Card className="cursor-pointer transition-smooth hover:shadow-medium gradient-card" onClick={() => setSelectedMode("daily")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Daily-wise Study</CardTitle>
                <CardDescription>Individual subject timing with daily planning</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Set individual time for each subject</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>Flexible daily study schedule</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Progress tracking per subject</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Perfect for regular study routines with different subjects requiring different time allocations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Exam-wise Study Mode */}
        <Card className="cursor-pointer transition-smooth hover:shadow-medium gradient-card" onClick={() => setSelectedMode("exam")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Exam-wise Study</CardTitle>
                <CardDescription>Global time allocation for exam preparation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Set one global study time for all subjects</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Auto-generate timetable until exam week</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Optimized for exam preparation</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Ideal for intensive exam preparation with equal time distribution across all subjects and topics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};