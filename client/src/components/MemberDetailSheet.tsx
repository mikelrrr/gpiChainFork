import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import LevelBadge from "./LevelBadge";
import StatusDot from "./StatusDot";
import { Calendar, Users, Link2, User, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

interface UserWithDetails extends UserType {
  inviter?: UserType;
  invitees: UserType[];
  inviteCount: number;
}

interface MemberDetailSheetProps {
  memberId: string | null;
  onClose: () => void;
}

export default function MemberDetailSheet({ memberId, onClose }: MemberDetailSheetProps) {
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [justification, setJustification] = useState("");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: member, isLoading } = useQuery<UserWithDetails>({
    queryKey: ["/api/users", memberId],
    enabled: !!memberId,
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

  const handlePromoteSubmit = () => {
    if (!member) return;

    createPromotionMutation.mutate({
      candidateUserId: member.id,
      currentLevel: member.level,
      proposedLevel: parseInt(selectedLevel),
      justification,
    });
  };

  const isOpen = !!memberId;
  const displayName = member ? `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unknown" : "";
  
  const canPropose = currentUser && 
    member && 
    currentUser.id !== member.id && 
    currentUser.level >= 4 && 
    member.level < currentUser.level;

  const availableLevels = member && currentUser 
    ? [2, 3, 4, 5].filter(l => l > member.level && l <= currentUser.level)
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Member Profile</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
          </div>
        ) : member ? (
          <div className="space-y-6 mt-6">
            <div className="flex flex-col items-center text-center">
              <UserAvatar
                name={displayName}
                imageUrl={member.profileImageUrl || undefined}
                level={member.level as 1 | 2 | 3 | 4 | 5}
                size="lg"
              />
              <h2 className="text-xl font-bold mt-4">{displayName}</h2>
              {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
              <div className="flex items-center gap-2 mt-2">
                <LevelBadge level={member.level as 1 | 2 | 3 | 4 | 5} />
                <StatusDot status={member.status as "active" | "suspended" | "expelled"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-xs">Joined</span>
                  </div>
                  <p className="font-medium text-sm">
                    {member.createdAt ? format(new Date(member.createdAt), "MMM d, yyyy") : "Unknown"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Link2 className="h-3.5 w-3.5" />
                    <span className="text-xs">Invited</span>
                  </div>
                  <p className="font-medium text-sm">{member.inviteCount} people</p>
                </CardContent>
              </Card>
            </div>

            {member.inviter && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 text-muted-foreground mb-3">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Invited by</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={`${member.inviter.firstName || ""} ${member.inviter.lastName || ""}`.trim() || "Unknown"}
                      imageUrl={member.inviter.profileImageUrl || undefined}
                      level={member.inviter.level as 1 | 2 | 3 | 4 | 5}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {`${member.inviter.firstName || ""} ${member.inviter.lastName || ""}`.trim() || member.inviter.email}
                      </p>
                      <LevelBadge level={member.inviter.level as 1 | 2 | 3 | 4 | 5} size="sm" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {member.invitees && member.invitees.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 text-muted-foreground mb-3">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">People Invited ({member.invitees.length})</span>
                  </div>
                  <div className="space-y-2">
                    {member.invitees.slice(0, 5).map((invitee) => (
                      <div key={invitee.id} className="flex items-center gap-2">
                        <UserAvatar
                          name={`${invitee.firstName || ""} ${invitee.lastName || ""}`.trim() || "Unknown"}
                          imageUrl={invitee.profileImageUrl || undefined}
                          level={invitee.level as 1 | 2 | 3 | 4 | 5}
                          size="sm"
                        />
                        <span className="text-sm">
                          {`${invitee.firstName || ""} ${invitee.lastName || ""}`.trim() || invitee.email}
                        </span>
                        <LevelBadge level={invitee.level as 1 | 2 | 3 | 4 | 5} size="sm" />
                      </div>
                    ))}
                    {member.invitees.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        + {member.invitees.length - 5} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {canPropose && (
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => setIsPromoteDialogOpen(true)}
                data-testid="button-propose-promotion-sheet"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Propose Promotion
              </Button>
            )}
          </div>
        ) : null}

        <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propose Level Promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <UserAvatar
                  name={displayName}
                  imageUrl={member?.profileImageUrl || undefined}
                  level={member?.level as 1 | 2 | 3 | 4 | 5}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-sm">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Currently Level {member?.level}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Propose New Level</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger data-testid="select-new-level-sheet">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.map(level => (
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
                  data-testid="input-justification-sheet"
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
                disabled={!selectedLevel || justification.length < 10 || createPromotionMutation.isPending}
                data-testid="button-submit-promotion-sheet"
              >
                {createPromotionMutation.isPending ? "Submitting..." : "Submit Proposal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
