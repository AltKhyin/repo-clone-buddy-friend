// ABOUTME: Simplified table inspector for BasicTable - most controls moved to context menu

import React from 'react';
import { BasicTableData } from '../extensions/BasicTable/types';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table } from 'lucide-react';

interface TableBlockInspectorProps {
  nodeId: string;
  data: BasicTableData;
}

/**
 * Simplified table inspector for BasicTable system
 * Most table operations are now handled via context menu
 */
export const TableBlockInspector: React.FC<TableBlockInspectorProps> = ({
  nodeId,
  data
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Table className="w-4 h-4" />
        <Label className="font-medium">Table</Label>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Size</Label>
          <Badge variant="outline">
            {data.headers.length} × {data.rows.length}
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Right-click table cells to add/remove rows and columns
        </div>
      </div>
    </div>
  );
};

export default TableBlockInspector;