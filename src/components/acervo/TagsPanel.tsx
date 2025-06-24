
// ABOUTME: Horizontal tags panel for desktop view with categoria/subtag reveal logic and intelligent priority sorting.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { AcervoTag } from '../../../packages/hooks/useAcervoDataQuery';

interface TagsPanelProps {
  allTags: AcervoTag[];
  selectedTags: number[];
  onTagSelect: (tagId: number) => void;
}

const TagsPanel: React.FC<TagsPanelProps> = ({ allTags, selectedTags, onTagSelect }) => {
  const [visibleSubtags, setVisibleSubtags] = useState<number[]>([]);

  // Memoize tag hierarchy computation
  const { parentTags, childTags } = useMemo(() => {
    const parentTags = allTags.filter(tag => tag.parent_id === null);
    const childTags = allTags.filter(tag => tag.parent_id !== null);
    return { parentTags, childTags };
  }, [allTags]);

  // Update visible subtags when selected tags change
  useEffect(() => {
    const newVisibleSubtags: number[] = [];
    
    selectedTags.forEach(selectedTagId => {
      const parentTag = parentTags.find(tag => tag.id === selectedTagId);
      if (parentTag) {
        // Show all subtags for this parent
        const subtags = childTags
          .filter(child => child.parent_id === parentTag.id)
          .map(child => child.id);
        newVisibleSubtags.push(...subtags);
      }
    });
    
    setVisibleSubtags(newVisibleSubtags);
  }, [selectedTags, parentTags, childTags]);

  // Intelligent tag sorting with priority: selected → highlighted → unselected
  const sortedParentTags = useMemo(() => {
    return [...parentTags].sort((a, b) => {
      const aSelected = selectedTags.includes(a.id);
      const bSelected = selectedTags.includes(b.id);
      
      // Selected tags first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // If both selected or both unselected, maintain alphabetical order
      return a.tag_name.localeCompare(b.tag_name);
    });
  }, [parentTags, selectedTags]);

  const sortedVisibleSubtags = useMemo(() => {
    const visibleSubtagsData = childTags.filter(tag => visibleSubtags.includes(tag.id));
    return [...visibleSubtagsData].sort((a, b) => {
      const aSelected = selectedTags.includes(a.id);
      const bSelected = selectedTags.includes(b.id);
      
      // Selected subtags first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // If both selected or both unselected, maintain alphabetical order
      return a.tag_name.localeCompare(b.tag_name);
    });
  }, [childTags, visibleSubtags, selectedTags]);

  const getTagVariant = useCallback((tagId: number): "default" | "outline" | "secondary" => {
    if (selectedTags.includes(tagId)) {
      return "default"; // Selected state: white background, dark text
    }
    if (visibleSubtags.includes(tagId)) {
      return "secondary"; // Highlighted state: dim outline, white text
    }
    return "outline"; // Unselected state: transparent background, dim white text
  }, [selectedTags, visibleSubtags]);

  return (
    <div className="flex flex-wrap gap-2 p-4 border-b border-border">
      {/* Parent tags (categorias) - sorted by priority */}
      {sortedParentTags.map(tag => (
        <Button
          key={tag.id}
          variant={getTagVariant(tag.id)}
          size="sm"
          onClick={() => onTagSelect(tag.id)}
          className="rounded-full"
        >
          {tag.tag_name}
        </Button>
      ))}
      
      {/* Visible subtags - sorted by priority */}
      {sortedVisibleSubtags.map(subtag => (
        <Button
          key={subtag.id}
          variant={getTagVariant(subtag.id)}
          size="sm"
          onClick={() => onTagSelect(subtag.id)}
          className="rounded-full"
        >
          {subtag.tag_name}
        </Button>
      ))}
    </div>
  );
};

export default TagsPanel;
