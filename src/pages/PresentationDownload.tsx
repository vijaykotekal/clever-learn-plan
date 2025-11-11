import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pptxgen from "pptxgenjs";
import { toast } from "sonner";

const PresentationDownload = () => {
  const navigate = useNavigate();

  const generatePresentation = () => {
    const pptx = new pptxgen();

    // Slide 1: Title Slide
    const slide1 = pptx.addSlide();
    slide1.background = { color: "1a1f2e" };
    slide1.addText("Smart Study Planner", {
      x: 1,
      y: 2,
      w: 8,
      h: 1.5,
      fontSize: 48,
      bold: true,
      color: "FFFFFF",
      align: "center",
    });
    slide1.addText("Your AI-Powered Learning Companion", {
      x: 1,
      y: 3.8,
      w: 8,
      h: 0.5,
      fontSize: 24,
      color: "9b87f5",
      align: "center",
    });

    // Slide 2: Key Features
    const slide2 = pptx.addSlide();
    slide2.background = { color: "1a1f2e" };
    slide2.addText("Key Features", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 36,
      bold: true,
      color: "FFFFFF",
    });
    slide2.addText(
      [
        { text: "• Subject Management: ", options: { bold: true, color: "9b87f5" } },
        { text: "Track multiple subjects with progress monitoring", options: { color: "FFFFFF" } },
        { text: "\n• Study Timer: ", options: { bold: true, color: "9b87f5" } },
        { text: "Built-in Pomodoro timer for focused study sessions", options: { color: "FFFFFF" } },
        { text: "\n• Smart Scheduling: ", options: { bold: true, color: "9b87f5" } },
        { text: "Daily and exam-based study planning", options: { color: "FFFFFF" } },
        { text: "\n• AI Chatbot: ", options: { bold: true, color: "9b87f5" } },
        { text: "Get instant help and study guidance", options: { color: "FFFFFF" } },
      ],
      {
        x: 0.8,
        y: 1.5,
        w: 8.5,
        h: 4,
        fontSize: 20,
        lineSpacing: 35,
      }
    );

    // Slide 3: Study Modes
    const slide3 = pptx.addSlide();
    slide3.background = { color: "1a1f2e" };
    slide3.addText("Flexible Study Modes", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 36,
      bold: true,
      color: "FFFFFF",
    });
    slide3.addText(
      [
        { text: "Daily-Wise Study\n", options: { bold: true, fontSize: 24, color: "9b87f5" } },
        { text: "Plan your daily study routine with structured schedules and reminders\n\n", options: { fontSize: 18, color: "FFFFFF" } },
        { text: "Exam-Wise Study\n", options: { bold: true, fontSize: 24, color: "9b87f5" } },
        { text: "Create targeted study plans for upcoming exams with deadline tracking", options: { fontSize: 18, color: "FFFFFF" } },
      ],
      {
        x: 1,
        y: 1.8,
        w: 8,
        h: 4,
      }
    );

    // Slide 4: Progress Tracking
    const slide4 = pptx.addSlide();
    slide4.background = { color: "1a1f2e" };
    slide4.addText("Track Your Progress", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 36,
      bold: true,
      color: "FFFFFF",
    });
    slide4.addText(
      [
        { text: "• Visual Charts: ", options: { bold: true, color: "9b87f5" } },
        { text: "See your study time distribution across subjects\n", options: { color: "FFFFFF" } },
        { text: "• Study History: ", options: { bold: true, color: "9b87f5" } },
        { text: "Review past study sessions and completed tasks\n", options: { color: "FFFFFF" } },
        { text: "• Topic Quizzes: ", options: { bold: true, color: "9b87f5" } },
        { text: "Test your knowledge and track improvement\n", options: { color: "FFFFFF" } },
        { text: "• Real-time Analytics: ", options: { bold: true, color: "9b87f5" } },
        { text: "Monitor your learning progress with detailed statistics", options: { color: "FFFFFF" } },
      ],
      {
        x: 1,
        y: 1.8,
        w: 8,
        h: 4,
        fontSize: 20,
        lineSpacing: 32,
      }
    );

    // Slide 5: Call to Action
    const slide5 = pptx.addSlide();
    slide5.background = { color: "1a1f2e" };
    slide5.addText("Start Your Learning Journey Today", {
      x: 1,
      y: 2.3,
      w: 8,
      h: 1,
      fontSize: 40,
      bold: true,
      color: "FFFFFF",
      align: "center",
    });
    slide5.addText("Organize • Study • Succeed", {
      x: 1,
      y: 3.5,
      w: 8,
      h: 0.5,
      fontSize: 28,
      color: "9b87f5",
      align: "center",
    });

    pptx.writeFile({ fileName: "Smart-Study-Planner-Presentation.pptx" });
    toast.success("Presentation downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Download Presentation</h1>
          <p className="text-muted-foreground mb-8">
            Download a professional 5-slide PowerPoint presentation about your Smart Study Planner app
          </p>
          
          <div className="space-y-4 mb-8 text-left">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Presentation Includes:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Slide 1: Title and introduction</li>
                <li>• Slide 2: Key features overview</li>
                <li>• Slide 3: Study modes explanation</li>
                <li>• Slide 4: Progress tracking capabilities</li>
                <li>• Slide 5: Call to action</li>
              </ul>
            </div>
          </div>

          <Button onClick={generatePresentation} size="lg" className="w-full sm:w-auto">
            <Download className="mr-2 h-5 w-5" />
            Download PowerPoint (PPTX)
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PresentationDownload;
