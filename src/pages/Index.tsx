import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/hero/HeroSection";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { SubjectManager } from "@/components/subjects/SubjectManager";
import { ScheduleView } from "@/components/schedule/ScheduleView";

const Index = () => {
  const [currentView, setCurrentView] = useState("hero");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Check for existing user session
  useEffect(() => {
    const savedUser = localStorage.getItem("studyPlannerUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setCurrentView("dashboard");
    }
  }, []);

  const handleLogin = () => {
    setIsAuthDialogOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("studyPlannerUser");
    localStorage.removeItem("studyPlannerSubjects");
    localStorage.removeItem("scheduleProgress");
    setUser(null);
    setCurrentView("hero");
  };

  const handleAuthSuccess = (userData: { name: string; email: string }) => {
    setUser(userData);
    setCurrentView("dashboard");
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard onNavigate={handleViewChange} />;
      case "subjects":
        return <SubjectManager />;
      case "schedule":
        return <ScheduleView />;
      default:
        return <HeroSection onGetStarted={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentView={currentView}
        onViewChange={handleViewChange}
        isLoggedIn={!!user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        userName={user?.name}
      />
      
      <main className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </main>

      <AuthDialog 
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
