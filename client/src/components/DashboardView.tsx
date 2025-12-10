import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "./StatsCard";
import UserCard from "./UserCard";
import LevelFilter from "./LevelFilter";
import SearchInput from "./SearchInput";
import MemberDetailSheet from "./MemberDetailSheet";
import { Users, Vote, Link2, Plus, BarChart3 } from "lucide-react";
import type { User } from "@shared/schema";

interface Stats {
  totalMembers: number;
  myInviteCount: number;
  pendingPromotions: number;
  pendingMyVote: number;
  levelDistribution: { level: number; count: number }[];
}

interface DashboardViewProps {
  onNavigate: (tab: "invites" | "promotions" | "profile") => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [search, setSearch] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const handleToggleLevel = (level: number) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const filteredUsers = users.filter(user => {
    const displayName = user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";
    const matchesSearch = search === "" || 
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      (user.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(user.level);
    return matchesSearch && matchesLevel;
  });

  const levelDistribution = stats?.levelDistribution || [];
  const totalMembers = stats?.totalMembers || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => onNavigate("invites")} data-testid="button-quick-invite">
          <Plus className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statsLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24 col-span-2 md:col-span-1" />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Members"
              value={stats?.totalMembers || 0}
              icon={Users}
            />
            <StatsCard
              title="Pending Votes"
              value={stats?.pendingPromotions || 0}
              icon={Vote}
              description={stats?.pendingMyVote ? `${stats.pendingMyVote} need your vote` : undefined}
            />
            <StatsCard
              title="My Invites"
              value={stats?.myInviteCount || 0}
              icon={Link2}
              className="col-span-2 md:col-span-1"
            />
          </>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Level Distribution</h3>
        </div>
        {statsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-3" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {levelDistribution.map(({ level, count }) => {
              const percent = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
              return (
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
              );
            })}
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Members</h2>
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

        {usersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.slice(0, 10).map(user => (
              <UserCard
                key={user.id}
                id={user.id}
                name={user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown"}
                email={user.email || undefined}
                level={user.level as 1 | 2 | 3 | 4 | 5}
                status={user.status as "active" | "suspended" | "expelled"}
                inviteCount={0}
                joinedAt={new Date(user.createdAt || Date.now())}
                imageUrl={user.profileImageUrl || undefined}
                onViewProfile={(id) => setSelectedMemberId(id)}
              />
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No members found</p>
            )}
          </div>
        )}
      </div>

      <MemberDetailSheet
        memberId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  );
}
