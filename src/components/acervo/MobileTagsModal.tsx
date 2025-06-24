
// ABOUTME: Bottom sheet modal for tag selection on mobile devices with intelligent priority sorting.

import React, { useMemo } from 'react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Filter } from 'lucide-react';
import { AcervoTag } from '../../../packages/hooks/useAcervoDataQuery';

interface MobileTagsModalProps {
  allTags: AcervoTag[];
  selectedTags: number[];
  onTagSelect: (tagId: number) => void;
}

const MobileTagsModal: React.FC<MobileTagsModalProps> = ({ allTags, selectedTags, onTagSelect }) => {
  const parentTags = allTags.filter(tag => tag.parent_id === null);
  const childTags = allTags.filter(tag => tag.parent_id !== null);

  // Intelligent sorting for parent tags: selected first, then alphabetical
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

  // Function to sort subtags by priority: selected first, then alphabetical
  const getSortedSubtags = (parentId: number) => {
    const subtags = childTags.filter(child => child.parent_id === parentId);
    return subtags.sort((a, b) => {
      const aSelected = selectedTags.includes(a.id);
      const bSelected = selectedTags.includes(b.id);
      
      // Selected subtags first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // If both selected or both unselected, maintain alphabetical order
      return a.tag_name.localeCompare(b.tag_name);
    });
  };

  const getTagVariant = (tagId: number): "default" | "outline" | "secondary" => {
    return selectedTags.includes(tagId) ? "default" : "outline";
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="mb-4">
          <Filter className="w-4 h-4 mr-2" />
          Categorias
          {selectedTags.length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {selectedTags.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filtrar por Categoria</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6 overflow-y-auto">
          {sortedParentTags.map(parentTag => {
            const sortedSubtags = getSortedSubtags(parentTag.id);
            
            return (
              <div key={parentTag.id} className="space-y-3">
                <div>
                  <Button
                    variant={getTagVariant(parentTag.id)}
                    size="sm"
                    onClick={() => onTagSelect(parentTag.id)}
                    className="rounded-full"
                  >
                    {parentTag.tag_name}
                  </Button>
                </div>
                {sortedSubtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-4">
                    {sortedSubtags.map(subtag => (
                      <Button
                        key={subtag.id}
                        variant={getTagVariant(subtag.id)}
                        size="sm"
                        onClick={() => onTagSelect(subtag.id)}
                        className="rounded-full text-xs"
                      >
                        {subtag.tag_name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileTagsModal;
