// ABOUTME: Professional tag selection component with hierarchical structure, search, and database integration
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Tag, Save, X } from 'lucide-react';
import { useTagsQuery } from '@packages/hooks/useTagsQuery';
import { useUpdateReviewTagsMutation } from '@packages/hooks/useUpdateReviewTagsMutation';
import { useToast } from '@/hooks/use-toast';
import type { Tag as TagType } from '@packages/hooks/useTagsQuery';

interface TagSelectorProps {
  reviewId: number;
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  reviewId,
  selectedTags,
  onTagsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingChanges, setPendingChanges] = useState(false);
  const { toast } = useToast();

  const { data: tags, isLoading, isError, error } = useTagsQuery();
  const updateTagsMutation = useUpdateReviewTagsMutation();

  // Organize tags into hierarchical structure
  const { parentTags, childTags, filteredTags } = useMemo(() => {
    if (!tags) return { parentTags: [], childTags: new Map(), filteredTags: [] };

    const parents = tags.filter(tag => tag.parent_id === null);
    const children = new Map<number, TagType[]>();

    // Group child tags by parent_id
    tags
      .filter(tag => tag.parent_id !== null)
      .forEach(tag => {
        const parentId = tag.parent_id!;
        if (!children.has(parentId)) {
          children.set(parentId, []);
        }
        children.get(parentId)!.push(tag);
      });

    // Filter tags based on search term
    let filtered = tags;
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = tags.filter(
        tag =>
          tag.tag_name.toLowerCase().includes(search) ||
          tag.description?.toLowerCase().includes(search)
      );
    }

    return { parentTags: parents, childTags: children, filteredTags: filtered };
  }, [tags, searchTerm]);

  const handleTagToggle = (tagId: number) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    onTagsChange(newSelectedTags);
    setPendingChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateTagsMutation.mutateAsync({
        reviewId,
        tagIds: selectedTags,
      });

      setPendingChanges(false);
      toast({
        title: 'Success',
        description: 'Tags updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tags',
        variant: 'destructive',
      });
    }
  };

  const getSelectedTagNames = () => {
    if (!tags) return [];
    return tags.filter(tag => selectedTags.includes(tag.id)).map(tag => tag.tag_name);
  };

  const renderTag = (tag: TagType, level = 0) => {
    const isSelected = selectedTags.includes(tag.id);
    const hasDescription = tag.description && tag.description.trim().length > 0;

    return (
      <div
        key={tag.id}
        className={`flex items-center space-x-3 py-3 px-3 rounded-md transition-colors hover:bg-muted/50 touch-target ${
          level > 0 ? 'ml-4 sm:ml-6 border-l-2 border-muted' : ''
        }`}
      >
        <Checkbox
          id={`tag-${tag.id}`}
          checked={isSelected}
          onCheckedChange={() => handleTagToggle(tag.id)}
          aria-label={`Select ${tag.tag_name}`}
          className="touch-target"
        />

        {tag.color && (
          <div
            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: tag.color }}
            data-testid={`tag-color-${tag.id}`}
          />
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                htmlFor={`tag-${tag.id}`}
                className="flex-1 text-base sm:text-sm font-medium cursor-pointer leading-relaxed break-words touch-target"
              >
                {tag.tag_name}
              </label>
            </TooltipTrigger>
            {hasDescription && (
              <TooltipContent>
                <p className="max-w-xs text-sm">{tag.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const renderHierarchicalTags = () => {
    if (searchTerm.trim()) {
      return filteredTags.map(tag => renderTag(tag));
    }

    return parentTags.map(parentTag => (
      <div key={parentTag.id}>
        {renderTag(parentTag)}
        <div data-testid={`tag-children-${parentTag.id}`}>
          {childTags.get(parentTag.id)?.map(childTag => renderTag(childTag, 1))}
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 border rounded-lg" data-testid="tag-selector-loading">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 animate-pulse" />
          <h3 className="font-medium">Loading tags...</h3>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 border rounded-lg" data-testid="tag-selector-error">
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load tags'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 border rounded-lg sm:p-6" data-testid="tag-selector">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Tags
        </h3>
        {pendingChanges && (
          <Button
            onClick={handleSave}
            size="sm"
            disabled={updateTagsMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Tags
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tags..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 text-base sm:text-sm"
          aria-label="Search tags"
        />
      </div>

      {/* Selected Tags Display */}
      <div
        className="space-y-2"
        role="group"
        aria-label="Selected tags"
        data-testid="selected-tags"
      >
        <h4 className="text-sm font-medium text-muted-foreground">
          Selected Tags ({selectedTags.length})
        </h4>
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {getSelectedTagNames().length > 0 ? (
            getSelectedTagNames().map((tagName, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="gap-1 text-sm py-1 px-2 touch-target"
              >
                <span className="break-all">{tagName}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors touch-target"
                  onClick={() => {
                    const tag = tags?.find(t => t.tag_name === tagName);
                    if (tag) handleTagToggle(tag.id);
                  }}
                />
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Selected tags will appear here</span>
          )}
        </div>
      </div>

      {/* Tag List */}
      <div
        className="space-y-1 max-h-80 sm:max-h-96 overflow-y-auto border rounded-md p-2"
        role="group"
        aria-label="Tag selection"
      >
        {filteredTags.length === 0 && searchTerm.trim() ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tags found matching your search
          </div>
        ) : (
          renderHierarchicalTags()
        )}
      </div>

      {updateTagsMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to save tags. Please try again.</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
