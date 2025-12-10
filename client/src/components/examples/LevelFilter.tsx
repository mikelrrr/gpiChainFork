import { useState } from 'react';
import LevelFilter from '../LevelFilter';

export default function LevelFilterExample() {
  const [selected, setSelected] = useState<number[]>([2, 3]);
  
  const handleToggle = (level: number) => {
    setSelected(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level) 
        : [...prev, level]
    );
  };
  
  return (
    <div className="max-w-md">
      <LevelFilter selectedLevels={selected} onToggleLevel={handleToggle} />
      <p className="text-sm text-muted-foreground mt-2">Selected: {selected.join(", ") || "None"}</p>
    </div>
  );
}
