// ABOUTME: Minimalistic search bar component for desktop header with global search functionality.

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  className?: string;
}

export const SearchBar = ({ className }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page (future implementation)
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder=""
          value={searchQuery}
          onChange={handleInputChange}
          className="
            w-full h-8 pl-9 pr-3
            bg-background/20 backdrop-blur-sm
            border border-border/20
            rounded-full
            text-sm text-foreground
            focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30
            transition-all duration-200
            hover:bg-background/30
            hover:border-border/30
          "
        />
      </div>
    </form>
  );
};
