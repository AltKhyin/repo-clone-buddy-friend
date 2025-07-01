// ABOUTME: Content preview panel with editor access for review management

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReviewManagementData } from '../../../../packages/hooks/useReviewManagementQuery';
import { Link } from 'react-router-dom';
import { Edit, FileText, Blocks, Eye } from 'lucide-react';

interface ReviewContentPreviewProps {
  review: ReviewManagementData;
}

export const ReviewContentPreview: React.FC<ReviewContentPreviewProps> = ({ review }) => {
  const structuredContent = review.structured_content || {};
  const nodes = structuredContent.nodes || [];
  const layouts = structuredContent.layouts || {};

  // Calculate content statistics
  const blockTypes = nodes.reduce((acc: Record<string, number>, node: any) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  const totalBlocks = nodes.length;
  const hasContent = totalBlocks > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Content Preview</span>
          <Link to={`/editor/${review.id}`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Open Editor
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasContent ? (
          <>
            {/* Content Overview */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{totalBlocks}</div>
                <div className="text-sm text-blue-700">Total Blocks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {Object.keys(blockTypes).length}
                </div>
                <div className="text-sm text-blue-700">Block Types</div>
              </div>
            </div>

            {/* Block Types */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Content Structure</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(blockTypes).map(([type, count]) => (
                  <Badge key={type} variant="outline">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content Summary */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <Blocks className="h-4 w-4 mr-2" />
                  Content includes {totalBlocks} interactive elements
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Responsive layouts configured for desktop and mobile
                </div>
              </div>
            </div>

            {/* Preview Actions */}
            <div className="space-y-2">
              <Link to={`/reviews/${review.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Published View
                </Button>
              </Link>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Yet</h3>
            <p className="text-gray-600 mb-4">This review doesn't have any content blocks yet.</p>
            <Link to={`/editor/${review.id}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Start Creating Content
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
