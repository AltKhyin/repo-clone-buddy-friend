// ABOUTME: Tag selection component for review metadata management

import React from 'react';

interface Tag {
  id: number;
  tag_name: string;
  color: string;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onTagsChange }) => {
  // Temporary placeholder - will be enhanced later
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">Tag selector (placeholder - to be implemented)</div>
      <div className="text-xs text-gray-500">Selected: {selectedTags.length} tags</div>
    </div>
  );
};
