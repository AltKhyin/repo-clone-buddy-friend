
// ABOUTME: Bulk operations component for content management

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Archive, Calendar, CheckCircle } from 'lucide-react';

interface BulkOperationsProps {
  selectedReviews: number[];
  onComplete: () => void;
}

export const BulkOperations = ({ selectedReviews, onComplete }: BulkOperationsProps) => {
  const handleBulkAction = (action: string) => {
    console.log(`Executing bulk ${action} on reviews:`, selectedReviews);
    // TODO: Implement bulk action logic
    onComplete();
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {selectedReviews.length} items selecionados
            </Badge>
            <span className="text-sm text-gray-600">
              Selecione uma ação para aplicar aos itens selecionados
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('approve')}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('schedule')}
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Agendar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('archive')}
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
            >
              <Archive className="h-4 w-4 mr-1" />
              Arquivar
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
