import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StatsCard from "./StatsCard";
import UserCard from "./UserCard";
import LevelFilter from "./LevelFilter";
import SearchInput from "./SearchInput";
import { Users, Vote, Link2, Plus, BarChart3 } from "lucide-react";

// todo: remove mock functionality
const mockUsers = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", level: 3 as const, status: "active" as const, invitedBy: "Bob Smith", inviteCount: 12, joinedAt: new Date("2024-03-15") },
  { id: "2", name: "Carlos Diaz", email: "carlos@example.com", level: 5 as const, status: "active" as const, inviteCount: 45, joinedAt: new Date("2023-08-01") },
  { id: "3", name: "Diana Lee", email: "diana@example.com", level: 2 as const, status: "active" as const, invitedBy: "Carlos Diaz", inviteCount: 5, joinedAt: new Date("2024-06-20") },
  { id: "4", name: "Frank Miller", email: "frank@example.com", level: 1 as const, status: "suspended" as const, invitedBy: "Alice Johnson", inviteCount: 0, joinedAt: new Date("2024-11-01") },
];

const levelDistribution = [
  { level: 1, count: 85, percent: 34 },
  { level: 2, count: 72, percent: 29 },
  { level: 3, count: 52, percent: 21 },
  { level: 4, count: 28, percent: 11 },
  { level: 5, count: 10, percent: 4 },
];

interface DashboardViewProps {
  onNavigate: (tab: "invites" | "promotions" | "profile") => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [search, setSearch] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);

  const handleToggleLevel = (level: number) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  // todo: remove mock functionality
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = search === "" || 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(user.level);
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => onNavigate("invites")} data-testid="button-quick-invite">
          <Plus className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatsCard
          title="Total Members"
          value={247}
          icon={Users}
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Pending Votes"
          value={5}
          icon={Vote}
          description="3 need your vote"
        />
        <StatsCard
          title="My Invites"
          value={18}
          icon={Link2}
          className="col-span-2 md:col-span-1"
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Level Distribution</h3>
        </div>
        <div className="space-y-2">
          {levelDistribution.map(({ level, count, percent }) => (
            <div key={level} className="flex items-center gap-3">
              <span className="text-xs font-medium w-12">Level {level}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    level === 1 ? "bg-slate-400" :
                    level === 2 ? "bg-blue-500" :
                    level === 3 ? "bg-teal-500" :
                    level === 4 ? "bg-amber-500" :
                    "bg-purple-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent Members</h2>
          <Button variant="ghost" size="sm" data-testid="button-view-all-members">
            View All
          </Button>
        </div>
        
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search members..."
        />
        
        <LevelFilter
          selectedLevels={selectedLevels}
          onToggleLevel={handleToggleLevel}
        />

        <div className="space-y-3">
          {filteredUsers.map(user => (
            <UserCard
              key={user.id}
              {...user}
              onViewProfile={(id) => console.log("View profile:", id)}
            />
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No members found</p>
          )}
        </div>
      </div>
    </div>
  );
}
