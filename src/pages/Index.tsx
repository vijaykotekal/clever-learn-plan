import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/hero/HeroSection";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { SubjectManager } from "@/components/subjects/SubjectManager";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { StudyModes } from "./StudyModes";
import { HistoryView } from "@/components/history/HistoryView";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const Index = () => {
  const [currentView, setCurrentView] = useState("hero");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Check for existing user session
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          setUser({
            name: profile?.name || "User",
            email: session.user.email || "",
          });
          setCurrentView("dashboard");
        } else {
          setUser(null);
          setCurrentView("hero");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setUser({
          name: profile?.name || "User",
          email: session.user.email || "",
        });
        setCurrentView("dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setIsAuthDialogOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
      case "study-modes":
        return <StudyModes onBack={() => setCurrentView("dashboard")} />;
      case "history":
        return <HistoryView />;
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
