import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  level?: 1 | 2 | 3 | 4 | 5;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-xl",
};

const levelGradients: Record<number, string> = {
  1: "bg-gradient-to-br from-slate-400 to-slate-500",
  2: "bg-gradient-to-br from-blue-400 to-blue-600",
  3: "bg-gradient-to-br from-teal-400 to-teal-600",
  4: "bg-gradient-to-br from-amber-400 to-amber-600",
  5: "bg-gradient-to-br from-purple-400 to-purple-600",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function UserAvatar({ name, imageUrl, level = 1, size = "md", className }: UserAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)} data-testid="avatar-user">
      <AvatarImage src={imageUrl} alt={name} />
      <AvatarFallback className={cn(levelGradients[level], "text-white font-medium")}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
