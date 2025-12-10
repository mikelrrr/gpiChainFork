import { Home, Link2, Vote, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: "dashboard" | "invites" | "promotions" | "profile";
  onTabChange: (tab: "dashboard" | "invites" | "promotions" | "profile") => void;
  pendingVotes?: number;
}

const tabs = [
  { id: "dashboard" as const, label: "Home", icon: Home },
  { id: "invites" as const, label: "Invites", icon: Link2 },
  { id: "promotions" as const, label: "Votes", icon: Vote },
  { id: "profile" as const, label: "Profile", icon: User },
];

export default function BottomNav({ activeTab, onTabChange, pendingVotes = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-bottom" data-testid="nav-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full relative",
                "transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              data-testid={`button-nav-${tab.id}`}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                {tab.id === "promotions" && pendingVotes > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingVotes > 9 ? "9+" : pendingVotes}
                  </span>
                )}
              </div>
              <span className={cn("text-xs", isActive && "font-medium")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
