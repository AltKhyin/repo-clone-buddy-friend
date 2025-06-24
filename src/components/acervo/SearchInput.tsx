
// ABOUTME: Minimalistic search input for filtering reviews by title and description.
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="Buscar reviews..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 border-muted-foreground/20 focus:border-primary"
      />
    </div>
  );
};

export default SearchInput;
