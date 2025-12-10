import { useState } from 'react';
import SearchInput from '../SearchInput';

export default function SearchInputExample() {
  const [query, setQuery] = useState("");
  
  return (
    <div className="max-w-md">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search members..."
      />
      {query && <p className="text-sm text-muted-foreground mt-2">Searching: {query}</p>}
    </div>
  );
}
