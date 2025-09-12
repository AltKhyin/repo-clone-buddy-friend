// ABOUTME: Admin webhook testing interface - DEPRECATED after V1 system removal

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const WebhookTestingInterface: React.FC = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          V1 Webhook Testing Interface - Deprecated
        </CardTitle>
        <CardDescription>
          This component is deprecated as part of V1 system removal. 
          V2 payment webhooks are handled directly by Edge Functions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The V1 webhook testing functionality has been removed. 
            V2 payment processing uses a streamlined approach with direct Edge Function integration.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};