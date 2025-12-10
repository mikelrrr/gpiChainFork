import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: 1 | 2 | 3 | 4 | 5;
  size?: "sm" | "default";
  className?: string;
}

const levelColors: Record<number, string> = {
  1: "bg-slate-400 text-white dark:bg-slate-500",
  2: "bg-blue-500 text-white",
  3: "bg-teal-500 text-white",
  4: "bg-amber-500 text-white",
  5: "bg-purple-500 text-white",
};

const levelLabels: Record<number, string> = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3",
  4: "Level 4",
  5: "Level 5",
};

export default function LevelBadge({ level, size = "default", className }: LevelBadgeProps) {
  return (
    <Badge 
      className={cn(
        levelColors[level],
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1",
        "font-medium border-0",
        className
      )}
      data-testid={`badge-level-${level}`}
    >
      {levelLabels[level]}
    </Badge>
  );
}
