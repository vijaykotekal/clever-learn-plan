import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Calendar, User, Settings } from "lucide-react";

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  userName?: string;
}

export const Header = ({ 
  currentView, 
  onViewChange, 
  isLoggedIn, 
  onLogin, 
  onLogout,
  userName 
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-soft">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
            AI Study Planner
          </h1>
        </div>

        {isLoggedIn && (
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant={currentView === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("dashboard")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === "subjects" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("subjects")}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Subjects
            </Button>
            <Button
              variant={currentView === "schedule" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("schedule")}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              AI Schedule
            </Button>
            <Button
              variant={currentView === "study-modes" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("study-modes")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Study Modes
            </Button>
          </nav>
        )}

        <div className="flex items-center space-x-2">
          {isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{userName || "Student"}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button variant="study" size="sm" onClick={onLogin}>
              Get Started
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};