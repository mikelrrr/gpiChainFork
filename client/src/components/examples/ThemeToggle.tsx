import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '@/lib/ThemeProvider';

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Toggle theme:</span>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}
