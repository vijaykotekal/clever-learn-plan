import { Button } from "@/components/ui/button";
import { Brain, Calendar, BookOpen, Target, Zap, BarChart3 } from "lucide-react";
import heroImage from "@/assets/hero-study.jpg";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 gradient-hero opacity-10"></div>
      
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Study Planning
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Master Your{" "}
                <span className="gradient-hero bg-clip-text text-transparent">
                  Studies
                </span>{" "}
                with AI
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transform your learning with intelligent scheduling, adaptive planning, 
                and personalized study strategies. Let AI optimize your path to academic success.
              </p>
            </div>

            <div className="flex justify-center">
              <Button variant="hero" size="lg" onClick={onGetStarted} className="text-lg px-8 py-6">
                Start Planning Now
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Smart Scheduling</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">Goal Tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">Adaptive Learning</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Subject Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">Progress Analytics</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">AI Insights</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-3xl opacity-20 blur-2xl transform rotate-6"></div>
            <div className="relative gradient-card rounded-3xl p-1 shadow-large">
              <img
                src={heroImage}
                alt="AI Study Planner Dashboard"
                className="w-full h-auto rounded-3xl shadow-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Students Helped</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-secondary">85%</div>
              <div className="text-sm text-muted-foreground">Improved Grades</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent">4.8★</div>
              <div className="text-sm text-muted-foreground">User Rating</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">500+</div>
              <div className="text-sm text-muted-foreground">Universities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};