import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder = "Search...", className }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className={cn("relative", className)}>
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
        focused ? "text-primary" : "text-muted-foreground"
      )} />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        data-testid="input-search"
      />
      {value && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onChange("")}
          data-testid="button-clear-search"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
