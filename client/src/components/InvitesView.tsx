import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import InviteLinkCard from "./InviteLinkCard";
import { Plus, Copy, Check, Link2, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InviteLink } from "@shared/schema";

interface InviteLinkWithDetails extends InviteLink {
  usedByName?: string;
}

export default function InvitesView() {
  const [isOpen, setIsOpen] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: invites = [], isLoading } = useQuery<InviteLinkWithDetails[]>({
    queryKey: ["/api/invites"],
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/invites");
      return response.json();
    },
    onSuccess: (data: InviteLink) => {
      const url = `${window.location.origin}/register?invite=${data.token}`;
      setNewLink(url);
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const handleGenerateInvite = () => {
    createInviteMutation.mutate();
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

  const activeInvites = invites.filter(i => i.status === "active");
  const usedInvites = invites.filter(i => i.status === "used");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
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
                    disabled={createInviteMutation.isPending}
                    data-testid="button-generate-invite"
                  >
                    {createInviteMutation.isPending ? "Generating..." : "Generate Invite Link"}
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

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <>
          {activeInvites.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Active Links</h2>
              {activeInvites.map(invite => (
                <InviteLinkCard
                  key={invite.id}
                  id={invite.id}
                  token={invite.token}
                  usesCount={invite.usesCount}
                  maxUses={invite.maxUses}
                  status={invite.status as "active" | "disabled" | "expired" | "used"}
                  createdAt={new Date(invite.createdAt || Date.now())}
                />
              ))}
            </div>
          )}

          {usedInvites.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Used Links</h2>
              {usedInvites.map(invite => (
                <InviteLinkCard
                  key={invite.id}
                  id={invite.id}
                  token={invite.token}
                  usesCount={invite.usesCount}
                  maxUses={invite.maxUses}
                  status={invite.status as "active" | "disabled" | "expired" | "used"}
                  createdAt={new Date(invite.createdAt || Date.now())}
                  usedByName={invite.usedByName}
                />
              ))}
            </div>
          )}

          {invites.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No invite links yet. Create one to start inviting people!
            </p>
          )}
        </>
      )}
    </div>
  );
}
