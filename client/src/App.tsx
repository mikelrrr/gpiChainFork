import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import DashboardView from "@/components/DashboardView";
import InvitesView from "@/components/InvitesView";
import PromotionsView from "@/components/PromotionsView";
import ProfileView from "@/components/ProfileView";
import LoginView from "@/components/LoginView";
import FirstAdminSetup from "@/components/FirstAdminSetup";

type Tab = "dashboard" | "invites" | "promotions" | "profile";

// todo: remove mock functionality
type AppState = "first-setup" | "login" | "invite-login" | "authenticated";

function App() {
  // todo: remove mock functionality - replace with real auth state
  const [appState, setAppState] = useState<AppState>("authenticated");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  
  // todo: remove mock functionality - simulated invite token from URL
  const inviteToken = undefined; // new URLSearchParams(window.location.search).get("invite");
  const inviterName = inviteToken ? "Eve Wilson" : undefined;

  const handleLogin = () => {
    console.log("Login triggered");
    // todo: remove mock functionality - integrate real Google OAuth
    setAppState("authenticated");
  };

  const handleAdminSetup = () => {
    console.log("Admin setup triggered");
    // todo: remove mock functionality - integrate real Google OAuth for first admin
    setAppState("authenticated");
  };

  // First admin setup (empty database)
  if (appState === "first-setup") {
    return (
      <ThemeProvider>
        <FirstAdminSetup onSetup={handleAdminSetup} />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Login page (regular or invite)
  if (appState === "login" || appState === "invite-login") {
    return (
      <ThemeProvider>
        <LoginView 
          onLogin={handleLogin} 
          inviteToken={inviteToken || undefined}
          inviterName={inviterName}
        />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Authenticated - main app
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <main className="pb-20 px-4 pt-4 max-w-2xl mx-auto">
              {activeTab === "dashboard" && (
                <DashboardView onNavigate={setActiveTab} />
              )}
              {activeTab === "invites" && <InvitesView />}
              {activeTab === "promotions" && <PromotionsView />}
              {activeTab === "profile" && <ProfileView />}
            </main>
            <BottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              pendingVotes={2}
            />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
