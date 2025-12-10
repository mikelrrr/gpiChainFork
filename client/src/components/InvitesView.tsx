import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InviteLinkCard from "./InviteLinkCard";
import { Plus, Copy, Check, Link2, Users } from "lucide-react";

// todo: remove mock functionality
const mockInvites = [
  { id: "1", token: "abc123xyz789", usesCount: 0, maxUses: 1, status: "active" as const, createdAt: new Date("2024-12-10") },
  { id: "2", token: "def456uvw123", usesCount: 1, maxUses: 1, status: "used" as const, createdAt: new Date("2024-12-08"), usedByName: "Alice Johnson" },
  { id: "3", token: "ghi789rst456", usesCount: 1, maxUses: 1, status: "used" as const, createdAt: new Date("2024-12-05"), usedByName: "Bob Smith" },
  { id: "4", token: "jkl012mno789", usesCount: 0, maxUses: 1, status: "expired" as const, createdAt: new Date("2024-11-20") },
];

export default function InvitesView() {
  const [isOpen, setIsOpen] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateInvite = () => {
    setGenerating(true);
    // todo: remove mock functionality
    setTimeout(() => {
      const token = Math.random().toString(36).substring(2, 15);
      setNewLink(`${window.location.origin}/register?invite=${token}`);
      setGenerating(false);
    }, 500);
  };

  const handleCopy = async () => {
    if (newLink) {
      await navigator.clipboard.writeText(newLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setNewLink(null);
    setCopied(false);
  };

  const activeInvites = mockInvites.filter(i => i.status === "active");
  const usedInvites = mockInvites.filter(i => i.status === "used");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invites</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-invite">
              <Plus className="h-4 w-4 mr-2" />
              New Invite
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Invite Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {!newLink ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Link2 className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate a unique invite link to share with someone you'd like to invite to the community.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={handleGenerateInvite}
                    disabled={generating}
                    data-testid="button-generate-invite"
                  >
                    {generating ? "Generating..." : "Generate Invite Link"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Your invite link is ready! Share it with someone to invite them.
                  </p>
                  <div className="flex gap-2">
                    <Input value={newLink} readOnly className="font-mono text-xs" data-testid="input-new-invite-url" />
                    <Button
                      size="icon"
                      variant={copied ? "default" : "outline"}
                      onClick={handleCopy}
                      data-testid="button-copy-new-invite"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <Link2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeInvites.length}</p>
              <p className="text-xs text-muted-foreground">Active Links</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usedInvites.length}</p>
              <p className="text-xs text-muted-foreground">People Invited</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeInvites.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Active Links</h2>
          {activeInvites.map(invite => (
            <InviteLinkCard key={invite.id} {...invite} />
          ))}
        </div>
      )}

      {usedInvites.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Used Links</h2>
          {usedInvites.map(invite => (
            <InviteLinkCard key={invite.id} {...invite} />
          ))}
        </div>
      )}
    </div>
  );
}
