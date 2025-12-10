import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("", className)} data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </span>
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend.positive ? "text-green-500" : "text-red-500"
            )}>
              {trend.positive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
