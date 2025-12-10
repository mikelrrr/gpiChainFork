import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Calendar } from "lucide-react";
import UserAvatar from "./UserAvatar";
import LevelBadge from "./LevelBadge";
import StatusDot from "./StatusDot";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface UserCardProps {
  id: string;
  name: string;
  email?: string;
  level: 1 | 2 | 3 | 4 | 5;
  status: "active" | "suspended" | "expelled";
  invitedBy?: string;
  inviteCount: number;
  joinedAt: Date;
  imageUrl?: string;
  onViewProfile?: (id: string) => void;
}

export default function UserCard({
  id,
  name,
  email,
  level,
  status,
  invitedBy,
  inviteCount,
  joinedAt,
  imageUrl,
  onViewProfile,
}: UserCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      className={cn(
        "p-4 transition-all duration-200",
        expanded && "ring-1 ring-ring"
      )}
      data-testid={`card-user-${id}`}
    >
      <div className="flex items-center gap-3">
        <UserAvatar name={name} imageUrl={imageUrl} level={level} size="md" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate" data-testid={`text-username-${id}`}>{name}</span>
            <LevelBadge level={level} size="sm" />
          </div>
          {email && <p className="text-sm text-muted-foreground truncate">{email}</p>}
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          data-testid={`button-expand-${id}`}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <StatusDot status={status} />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(joinedAt, "MMM d, yyyy")}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {invitedBy && (
              <span className="text-sm text-muted-foreground">
                Invited by <span className="font-medium text-foreground">{invitedBy}</span>
              </span>
            )}
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{inviteCount}</span>
              <span className="text-muted-foreground">invited</span>
            </div>
          </div>

          <Button 
            className="w-full mt-2" 
            onClick={() => onViewProfile?.(id)}
            data-testid={`button-view-profile-${id}`}
          >
            View Profile
          </Button>
        </div>
      )}
    </Card>
  );
}
