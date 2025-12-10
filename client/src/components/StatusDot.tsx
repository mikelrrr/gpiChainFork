import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "active" | "suspended" | "expelled";
  className?: string;
}

const statusColors = {
  active: "bg-green-500",
  suspended: "bg-amber-500",
  expelled: "bg-red-500",
};

const statusLabels = {
  active: "Active",
  suspended: "Suspended",
  expelled: "Expelled",
};

export default function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span 
        className={cn("h-2 w-2 rounded-full", statusColors[status])}
        data-testid={`status-dot-${status}`}
      />
      <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
    </span>
  );
}
