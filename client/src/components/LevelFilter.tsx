import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LevelFilterProps {
  selectedLevels: number[];
  onToggleLevel: (level: number) => void;
  maxVisibleLevel?: number;
}

const levelColors: Record<number, { active: string; inactive: string }> = {
  1: { 
    active: "bg-slate-400 text-white border-slate-400", 
    inactive: "bg-transparent text-slate-500 border-slate-300 dark:border-slate-600" 
  },
  2: { 
    active: "bg-blue-500 text-white border-blue-500", 
    inactive: "bg-transparent text-blue-500 border-blue-300 dark:border-blue-600" 
  },
  3: { 
    active: "bg-teal-500 text-white border-teal-500", 
    inactive: "bg-transparent text-teal-500 border-teal-300 dark:border-teal-600" 
  },
  4: { 
    active: "bg-amber-500 text-white border-amber-500", 
    inactive: "bg-transparent text-amber-500 border-amber-300 dark:border-amber-600" 
  },
  5: { 
    active: "bg-purple-500 text-white border-purple-500", 
    inactive: "bg-transparent text-purple-500 border-purple-300 dark:border-purple-600" 
  },
};

export default function LevelFilter({ selectedLevels, onToggleLevel, maxVisibleLevel = 5 }: LevelFilterProps) {
  // Only show levels up to the user's max visible level
  const visibleLevels = [1, 2, 3, 4, 5].filter(l => l <= maxVisibleLevel);
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" data-testid="filter-levels">
      {visibleLevels.map((level) => {
        const isSelected = selectedLevels.includes(level);
        return (
          <Badge
            key={level}
            variant="outline"
            className={cn(
              "cursor-pointer shrink-0 px-3 py-1",
              isSelected ? levelColors[level].active : levelColors[level].inactive
            )}
            onClick={() => onToggleLevel(level)}
            data-testid={`button-filter-level-${level}`}
          >
            Level {level}
          </Badge>
        );
      })}
    </div>
  );
}
