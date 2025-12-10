import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "./UserAvatar";
import LevelBadge from "./LevelBadge";
import StatusDot from "./StatusDot";
import GPIChainNode from "./GPIChainNode";
import ThemeToggle from "./ThemeToggle";
import { Calendar, Users, ArrowUpCircle, Shield, LogOut, Settings } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface UserWithInvitees extends User {
  inviter?: User;
  invitees: User[];
  inviteCount: number;
}

function buildGPITree(user: UserWithInvitees): any {
  return {
    id: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown",
    level: user.level as 1 | 2 | 3 | 4 | 5,
    imageUrl: user.profileImageUrl || undefined,
    invitees: user.invitees?.map(inv => ({
      id: inv.id,
      name: `${inv.firstName || ""} ${inv.lastName || ""}`.trim() || "Unknown",
      level: inv.level as 1 | 2 | 3 | 4 | 5,
      imageUrl: inv.profileImageUrl || undefined,
    })) || [],
  };
}

export default function ProfileView() {
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [justification, setJustification] = useState("");
  const { toast } = useToast();
  const { user: authUser, isLoading: authLoading } = useAuth();

  const { data: profileData, isLoading: profileLoading } = useQuery<UserWithInvitees>({
    queryKey: ["/api/users", authUser?.id],
    enabled: !!authUser?.id,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!authUser && authUser.level >= 4,
  });

  const createPromotionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/promotions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Promotion Request Created", 
        description: "Level 4+ members will now vote on this promotion."
      });
      setIsPromoteDialogOpen(false);
      setSelectedMember("");
      setSelectedLevel("");
      setJustification("");
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Promotion",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handlePromoteSubmit = () => {
    const candidate = allUsers.find(u => u.id === selectedMember);
    if (!candidate) return;

    createPromotionMutation.mutate({
      candidateUserId: selectedMember,
      currentLevel: candidate.level,
      proposedLevel: parseInt(selectedLevel),
      justification,
    });
  };

  const isLoading = authLoading || profileLoading;
  const user = profileData || authUser;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to view your profile</p>
      </div>
    );
  }

  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
  const gpiTree = profileData ? buildGPITree(profileData) : null;

  // Members eligible for promotion (lower level than proposer)
  const eligibleMembers = allUsers.filter(u => u.level < user.level && u.id !== user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <UserAvatar 
              name={displayName} 
              imageUrl={user.profileImageUrl || undefined}
              level={user.level as 1 | 2 | 3 | 4 | 5} 
              size="lg" 
            />
            <h2 className="text-xl font-bold mt-4">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <LevelBadge level={user.level as 1 | 2 | 3 | 4 | 5} />
              <StatusDot status={user.status as "active" | "suspended" | "expelled"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">Joined</span>
              </div>
              <p className="font-medium text-sm">
                {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "Unknown"}
              </p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Invited</span>
              </div>
              <p className="font-medium text-sm">{profileData?.inviteCount || 0} people</p>
            </div>
          </div>

          {profileData?.inviter && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-2">Invited by</p>
              <div className="flex items-center gap-2">
                <UserAvatar 
                  name={`${profileData.inviter.firstName || ""} ${profileData.inviter.lastName || ""}`.trim() || "Unknown"}
                  imageUrl={profileData.inviter.profileImageUrl || undefined}
                  level={profileData.inviter.level as 1 | 2 | 3 | 4 | 5} 
                  size="sm" 
                />
                <span className="font-medium text-sm">
                  {`${profileData.inviter.firstName || ""} ${profileData.inviter.lastName || ""}`.trim() || profileData.inviter.email}
                </span>
                <LevelBadge level={profileData.inviter.level as 1 | 2 | 3 | 4 | 5} size="sm" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {user.level >= 4 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline" data-testid="button-propose-promotion">
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Propose Promotion
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Propose Level Promotion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Member</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger data-testid="select-member">
                        <SelectValue placeholder="Choose a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleMembers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {`${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email} (Level {member.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Propose New Level</Label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger data-testid="select-new-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4].filter(l => {
                          const candidate = allUsers.find(u => u.id === selectedMember);
                          return candidate && l > candidate.level && l <= user.level;
                        }).map(level => (
                          <SelectItem key={level} value={level.toString()}>
                            Level {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Justification</Label>
                    <Textarea
                      placeholder="Explain why this member deserves a promotion..."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={3}
                      data-testid="input-justification"
                    />
                    <p className="text-xs text-muted-foreground">{justification.length}/500 characters</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePromoteSubmit}
                    disabled={!selectedMember || !selectedLevel || justification.length < 10 || createPromotionMutation.isPending}
                    data-testid="button-submit-promotion"
                  >
                    {createPromotionMutation.isPending ? "Submitting..." : "Submit Proposal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {gpiTree && gpiTree.invitees && gpiTree.invitees.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              My Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GPIChainNode
              node={gpiTree}
              onSelectUser={(id) => console.log("Selected user:", id)}
            />
          </CardContent>
        </Card>
      )}

      <Button 
        variant="outline" 
        className="w-full text-destructive"
        onClick={handleLogout}
        data-testid="button-logout"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
