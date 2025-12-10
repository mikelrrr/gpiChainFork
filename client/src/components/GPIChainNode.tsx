import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import UserAvatar from "./UserAvatar";
import LevelBadge from "./LevelBadge";
import { cn } from "@/lib/utils";

interface ChainNode {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  imageUrl?: string;
  invitees?: ChainNode[];
}

interface GPIChainNodeProps {
  node: ChainNode;
  depth?: number;
  onSelectUser?: (id: string) => void;
}

export default function GPIChainNode({ node, depth = 0, onSelectUser }: GPIChainNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.invitees && node.invitees.length > 0;

  return (
    <div className="relative" data-testid={`gpi-node-${node.id}`}>
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-md hover-elevate cursor-pointer",
          depth > 0 && "ml-6 border-l-2 border-border pl-4"
        )}
        onClick={() => onSelectUser?.(node.id)}
      >
        {hasChildren ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            data-testid={`button-toggle-${node.id}`}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-6 shrink-0" />
        )}
        
        <UserAvatar name={node.name} imageUrl={node.imageUrl} level={node.level} size="sm" />
        <span className="font-medium text-sm truncate">{node.name}</span>
        <LevelBadge level={node.level} size="sm" />
        
        {hasChildren && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Users className="h-3 w-3" />
            {node.invitees!.length}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="ml-3">
          {node.invitees!.map((child) => (
            <GPIChainNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectUser={onSelectUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
