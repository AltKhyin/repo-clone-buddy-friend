
// ABOUTME: Advanced tag hierarchy editor with drag-and-drop functionality and visual tree structure

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Move,
  Search,
  FolderOpen,
  Folder
} from 'lucide-react';
import { useTagManagementQuery, useTagOperationMutation, type TagWithStats } from '../../../../packages/hooks/useTagManagementQuery';
import { TagCreateModal } from './TagCreateModal';
import { TagEditModal } from './TagEditModal';
import { cn } from '@/lib/utils';

interface TagNode extends TagWithStats {
  children: TagNode[];
  level: number;
  isExpanded: boolean;
}

export const TagHierarchy = () => {
  const { data: tags = [], isLoading, error } = useTagManagementQuery();
  const tagOperationMutation = useTagOperationMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagWithStats | null>(null);

  // Build hierarchical tree structure
  const tagTree = useMemo(() => {
    if (!tags.length) return [];

    const buildTree = (parentId: number | null = null, level = 0): TagNode[] => {
      return tags
        .filter(tag => tag.parent_id === parentId)
        .map(tag => ({
          ...tag,
          children: buildTree(tag.id, level + 1),
          level,
          isExpanded: expandedNodes.has(tag.id)
        }))
        .sort((a, b) => a.tag_name.localeCompare(b.tag_name));
    };

    return buildTree();
  }, [tags, expandedNodes]);

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return tagTree;

    const filterTree = (nodes: TagNode[]): TagNode[] => {
      return nodes.reduce((acc, node) => {
        const matchesSearch = node.tag_name.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = filterTree(node.children);
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
            isExpanded: true // Auto-expand matching nodes
          });
        }
        
        return acc;
      }, [] as TagNode[]);
    };

    return filterTree(tagTree);
  }, [tagTree, searchTerm]);

  const toggleExpanded = (tagId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleDeleteTag = async (tagId: number, tagName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a tag "${tagName}"?`)) {
      return;
    }

    try {
      await tagOperationMutation.mutateAsync({
        action: 'delete',
        tagId
      });
    } catch (error) {
      console.error('Tag deletion failed:', error);
    }
  };

  const handleEditTag = (tag: TagWithStats) => {
    setEditingTag(tag);
    setIsEditModalOpen(true);
  };

  const renderTagNode = (node: TagNode) => {
    const hasChildren = node.children.length > 0;
    const isSelected = selectedTag === node.id;
    
    return (
      <div key={node.id} className="select-none">
        <div 
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group",
            "hover:bg-gray-50",
            isSelected && "bg-blue-50 border border-blue-200",
            node.level > 0 && "ml-6"
          )}
          onClick={() => setSelectedTag(isSelected ? null : node.id)}
        >
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpanded(node.id);
            }}
          >
            {hasChildren ? (
              node.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>

          {/* Folder Icon */}
          {hasChildren ? (
            node.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <div className="h-4 w-4 bg-gray-300 rounded-sm" />
          )}

          {/* Tag Name */}
          <span className="font-medium text-gray-900 flex-1">
            {node.tag_name}
          </span>

          {/* Usage Count Badge */}
          <Badge variant="secondary" className="text-xs">
            {node.usage_count} usos
          </Badge>

          {/* Action Buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleEditTag(node);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTag(node.id, node.tag_name);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && node.isExpanded && (
          <div className="mt-1">
            {node.children.map(renderTagNode)}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hierarquia de Tags</CardTitle>
          <CardDescription>Carregando estrutura de tags...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hierarquia de Tags</CardTitle>
          <CardDescription>Erro ao carregar tags</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Falha ao carregar a hierarquia de tags.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hierarquia de Tags</CardTitle>
              <CardDescription>
                Organize tags em uma estrutura hierárquica e gerencie relações
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              disabled={tagOperationMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Tag
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Actions Bar */}
          <div className="flex gap-2 text-sm">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpandedNodes(new Set(tags.map(t => t.id)))}
            >
              Expandir Tudo
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpandedNodes(new Set())}
            >
              Recolher Tudo
            </Button>
          </div>

          {/* Tag Tree */}
          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
            {filteredTree.length > 0 ? (
              <div className="space-y-1">
                {filteredTree.map(renderTagNode)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhuma tag encontrada' : 'Nenhuma tag disponível'}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="flex gap-4 text-sm text-gray-600 pt-4 border-t">
            <span>Total: {tags.length} tags</span>
            <span>Selecionada: {selectedTag ? tags.find(t => t.id === selectedTag)?.tag_name : 'Nenhuma'}</span>
            {searchTerm && <span>Filtradas: {filteredTree.length} resultados</span>}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <TagCreateModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <TagEditModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTag(null);
        }}
        tag={editingTag}
      />
    </>
  );
};
