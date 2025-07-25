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

  // Memoize tag hierarchy computation with defensive null checking
  const { parentTags, childTags } = useMemo(() => {
    if (!allTags || !Array.isArray(allTags)) {
      console.warn('TagsPanel: allTags is not a valid array:', allTags);
      return { parentTags: [], childTags: [] };
    }

    const parentTags = allTags.filter(tag => tag && tag.parent_id === null);
    const childTags = allTags.filter(tag => tag && tag.parent_id !== null);
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

  // TASK 2.1: New tag ordering - Selected Parents → All Visible Children → Unselected Parents
  const { selectedParentTags, sortedVisibleChildTags, unselectedParentTags } = useMemo(() => {
    const selectedParents = parentTags.filter(tag => selectedTags.includes(tag.id));
    const unselectedParents = parentTags.filter(tag => !selectedTags.includes(tag.id));

    // Get ALL visible subtags and sort them by priority: selected first, then alphabetical
    const visibleSubtagsData = childTags.filter(tag => visibleSubtags.includes(tag.id));
    const sortedChildren = visibleSubtagsData.sort((a, b) => {
      const aSelected = selectedTags.includes(a.id);
      const bSelected = selectedTags.includes(b.id);

      // Selected subtags first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // If both selected or both unselected, maintain alphabetical order
      return a.tag_name.localeCompare(b.tag_name);
    });

    // Sort parent groups alphabetically
    const sortAlphabetically = (tags: AcervoTag[]) =>
      [...tags].sort((a, b) => a.tag_name.localeCompare(b.tag_name));

    return {
      selectedParentTags: sortAlphabetically(selectedParents),
      sortedVisibleChildTags: sortedChildren,
      unselectedParentTags: sortAlphabetically(unselectedParents),
    };
  }, [parentTags, childTags, visibleSubtags, selectedTags]);

  const getTagVariant = useCallback(
    (tagId: number): 'default' | 'outline' | 'secondary' => {
      if (selectedTags.includes(tagId)) {
        return 'default'; // Selected state: white background, dark text
      }
      if (visibleSubtags.includes(tagId)) {
        return 'secondary'; // Highlighted state: dim outline, white text
      }
      return 'outline'; // Unselected state: transparent background, dim white text
    },
    [selectedTags, visibleSubtags]
  );

  return (
    <div className="flex flex-wrap gap-2 p-4 border-b border-border">
      {/* TASK 2.1: New ordering - Selected Parents → Selected Children → Unselected Parents */}

      {/* 1. Selected Parent Tags */}
      {selectedParentTags.map(tag => (
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

      {/* 2. All Visible Child Tags (selected first, then unselected) */}
      {sortedVisibleChildTags.map(subtag => (
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

      {/* 3. Unselected Parent Tags */}
      {unselectedParentTags.map(tag => (
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
    </div>
  );
};

export default TagsPanel;
