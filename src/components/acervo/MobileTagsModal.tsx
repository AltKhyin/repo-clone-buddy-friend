// ABOUTME: Inline expandable tag selection for mobile devices with horizontal layout and native expansion animation.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { AcervoTag } from '@packages/hooks/useAcervoDataQuery';

interface MobileTagsModalProps {
  allTags: AcervoTag[];
  selectedTags: number[];
  onTagSelect: (tagId: number) => void;
}

const MobileTagsModal: React.FC<MobileTagsModalProps> = ({
  allTags,
  selectedTags,
  onTagSelect,
}) => {
  const [visibleSubtags, setVisibleSubtags] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Memoize tag hierarchy computation with defensive null checking (copied from TagsPanel)
  const { parentTags, childTags } = useMemo(() => {
    if (!allTags || !Array.isArray(allTags)) {
      console.warn('MobileTagsModal: allTags is not a valid array:', allTags);
      return { parentTags: [], childTags: [] };
    }

    const parentTags = allTags.filter(tag => tag && tag.parent_id === null);
    const childTags = allTags.filter(tag => tag && tag.parent_id !== null);
    return { parentTags, childTags };
  }, [allTags]);

  // Update visible subtags when selected tags change (copied from TagsPanel)
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

  // Tag priority ordering - Selected Parents → All Visible Children → Unselected Parents (copied from TagsPanel)
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
    <div className="mb-6">
      {/* Expandable Trigger Button */}
      <div className="flex justify-center mb-4 px-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => setIsExpanded(!isExpanded)}
          className="min-h-[48px] px-6 py-3 text-base font-medium rounded-xl shadow-sm border-2 hover:shadow-md transition-all duration-200"
        >
          <Filter className="w-5 h-5 mr-3" />
          {selectedTags.length > 0 ? (
            "Ordenando por assunto"
          ) : (
            "Ordenar por assunto"
          )}
          {selectedTags.length > 0 && (
            <span className="ml-3 bg-primary text-primary-foreground rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 text-sm font-semibold">
              {selectedTags.length}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 ml-3" />
          ) : (
            <ChevronDown className="w-5 h-5 ml-3" />
          )}
        </Button>
      </div>

      {/* Expandable Tag Section */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl mx-4 mb-4 shadow-lg">
          <div className="p-6">
            {/* Mobile-optimized horizontal tag layout */}
            <div className="flex flex-wrap gap-3">
              {/* 1. Selected Parent Tags */}
              {selectedParentTags.map(tag => (
                <Button
                  key={tag.id}
                  variant={getTagVariant(tag.id)}
                  size="lg"
                  onClick={() => onTagSelect(tag.id)}
                  className="min-h-[48px] px-5 py-3 rounded-xl text-base font-medium shadow-sm" // Mobile-optimized
                >
                  {tag.tag_name}
                </Button>
              ))}

              {/* 2. All Visible Child Tags (selected first, then unselected) */}
              {sortedVisibleChildTags.map(subtag => (
                <Button
                  key={subtag.id}
                  variant={getTagVariant(subtag.id)}
                  size="lg"
                  onClick={() => onTagSelect(subtag.id)}
                  className="min-h-[48px] px-5 py-3 rounded-xl text-base font-medium shadow-sm" // Mobile-optimized
                >
                  {subtag.tag_name}
                </Button>
              ))}

              {/* 3. Unselected Parent Tags */}
              {unselectedParentTags.map(tag => (
                <Button
                  key={tag.id}
                  variant={getTagVariant(tag.id)}
                  size="lg"
                  onClick={() => onTagSelect(tag.id)}
                  className="min-h-[48px] px-5 py-3 rounded-xl text-base font-medium shadow-sm" // Mobile-optimized
                >
                  {tag.tag_name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTagsModal;
