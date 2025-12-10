import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Link2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InviteLinkCardProps {
  id: string;
  token: string;
  usesCount: number;
  maxUses: number | null;
  status: "active" | "disabled" | "expired" | "used";
  createdAt: Date;
  usedByName?: string;
  baseUrl?: string;
}

const statusStyles = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  disabled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  used: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function InviteLinkCard({
  id,
  token,
  usesCount,
  maxUses,
  status,
  createdAt,
  usedByName,
  baseUrl = window.location.origin,
}: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false);
  
  const inviteUrl = `${baseUrl}/register?invite=${token}`;
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4" data-testid={`card-invite-${id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <Badge className={cn("text-xs border-0", statusStyles[status])}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(createdAt, "MMM d, yyyy")}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          value={inviteUrl}
          readOnly
          className="font-mono text-xs"
          data-testid={`input-invite-url-${id}`}
        />
        <Button
          size="icon"
          variant={copied ? "default" : "outline"}
          onClick={handleCopy}
          disabled={status !== "active"}
          data-testid={`button-copy-invite-${id}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-muted-foreground">
          Uses: {usesCount}{maxUses ? ` / ${maxUses}` : ""}
        </span>
        {usedByName && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            Used by {usedByName}
          </span>
        )}
      </div>
    </Card>
  );
}
