import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import UserAvatar from "./UserAvatar";
import LevelBadge from "./LevelBadge";
import StatusDot from "./StatusDot";
import GPIChainNode from "./GPIChainNode";
import ThemeToggle from "./ThemeToggle";
import { Calendar, Users, ArrowUpCircle, Shield, LogOut, Settings } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockUser = {
  id: "current",
  name: "Eve Wilson",
  email: "eve@example.com",
  level: 5 as const,
  status: "active" as const,
  inviteCount: 23,
  joinedAt: new Date("2023-01-15"),
};

const mockInviter = {
  id: "founder",
  name: "System Admin",
  level: 5 as const,
};

const mockChain = {
  id: "current",
  name: "Eve Wilson",
  level: 5 as const,
  invitees: [
    {
      id: "2",
      name: "Bob Smith",
      level: 4 as const,
      invitees: [
        { id: "4", name: "Alice Johnson", level: 3 as const, invitees: [
          { id: "6", name: "Frank Lee", level: 2 as const },
          { id: "7", name: "Grace Kim", level: 1 as const },
        ]},
        { id: "5", name: "Carlos Diaz", level: 2 as const },
      ],
    },
    {
      id: "3",
      name: "Diana Lee",
      level: 3 as const,
      invitees: [
        { id: "8", name: "Henry Park", level: 2 as const },
      ],
    },
  ],
};

export default function ProfileView() {
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [justification, setJustification] = useState("");
  const { toast } = useToast();

  const handleLogout = () => {
    console.log("Logout triggered");
    toast({ title: "Logged out", description: "You have been signed out successfully." });
  };

  const handlePromoteSubmit = () => {
    console.log("Promotion request:", { selectedLevel, justification });
    toast({ 
      title: "Promotion Request Created", 
      description: "Level 4+ members will now vote on this promotion."
    });
    setIsPromoteDialogOpen(false);
    setSelectedLevel("");
    setJustification("");
  };

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
            <UserAvatar name={mockUser.name} level={mockUser.level} size="lg" />
            <h2 className="text-xl font-bold mt-4">{mockUser.name}</h2>
            <p className="text-sm text-muted-foreground">{mockUser.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <LevelBadge level={mockUser.level} />
              <StatusDot status={mockUser.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">Joined</span>
              </div>
              <p className="font-medium text-sm">{format(mockUser.joinedAt, "MMM d, yyyy")}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Invited</span>
              </div>
              <p className="font-medium text-sm">{mockUser.inviteCount} people</p>
            </div>
          </div>

          {mockInviter && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-2">Invited by</p>
              <div className="flex items-center gap-2">
                <UserAvatar name={mockInviter.name} level={mockInviter.level} size="sm" />
                <span className="font-medium text-sm">{mockInviter.name}</span>
                <LevelBadge level={mockInviter.level} size="sm" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {mockUser.level >= 4 && (
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
                    <Select>
                      <SelectTrigger data-testid="select-member">
                        <SelectValue placeholder="Choose a member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alice">Alice Johnson (Level 3)</SelectItem>
                        <SelectItem value="diana">Diana Lee (Level 2)</SelectItem>
                        <SelectItem value="frank">Frank Miller (Level 1)</SelectItem>
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
                        <SelectItem value="2">Level 2</SelectItem>
                        <SelectItem value="3">Level 3</SelectItem>
                        <SelectItem value="4">Level 4</SelectItem>
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
                    disabled={!selectedLevel || justification.length < 10}
                    data-testid="button-submit-promotion"
                  >
                    Submit Proposal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            My Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GPIChainNode
            node={mockChain}
            onSelectUser={(id) => console.log("Selected user:", id)}
          />
        </CardContent>
      </Card>

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
