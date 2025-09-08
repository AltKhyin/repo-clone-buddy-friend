// ABOUTME: Admin webhook testing interface for Make.com integration testing

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  sendTestWebhook, 
  createTestWebhook, 
  WebhookEventData 
} from '@/services/makeWebhookService';
import { CheckCircle, XCircle, Clock, Send, Code, History, AlertCircle } from 'lucide-react';

interface WebhookTest {
  id: string;
  timestamp: string;
  status: 'pending' | 'success' | 'error';
  payload: WebhookEventData;
  response?: string;
  error?: string;
  duration?: number;
}

export const WebhookTestingInterface: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<WebhookTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<WebhookTest | null>(null);
  const [customPayload, setCustomPayload] = useState('');

  const handleSendTestWebhook = async () => {
    const testId = `test_${Date.now()}`;
    const startTime = Date.now();
    
    setIsLoading(true);
    
    // Create initial test record
    const testData = await createTestWebhook();
    const newTest: WebhookTest = {
      id: testId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      payload: testData
    };
    
    setTestHistory(prev => [newTest, ...prev]);
    setSelectedTest(newTest);
    
    try {
      const result = await sendTestWebhook();
      const duration = Date.now() - startTime;
      
      const updatedTest: WebhookTest = {
        ...newTest,
        status: result.success ? 'success' : 'error',
        response: result.response,
        error: result.error,
        duration
      };
      
      setTestHistory(prev => 
        prev.map(test => test.id === testId ? updatedTest : test)
      );
      setSelectedTest(updatedTest);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const updatedTest: WebhookTest = {
        ...newTest,
        status: 'error',
        error: error.message,
        duration
      };
      
      setTestHistory(prev => 
        prev.map(test => test.id === testId ? updatedTest : test)
      );
      setSelectedTest(updatedTest);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustomWebhook = async () => {
    if (!customPayload.trim()) {
      alert('Por favor, insira um payload JSON válido');
      return;
    }

    try {
      JSON.parse(customPayload); // Validate JSON
    } catch (error) {
      alert('Payload JSON inválido. Verifique a sintaxe.');
      return;
    }

    // Implementation for custom webhook would go here
    alert('Funcionalidade de webhook customizado será implementada na próxima iteração');
  };

  const getStatusIcon = (status: WebhookTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: WebhookTest['status']) => {
    const variants = {
      success: 'default' as const,
      error: 'destructive' as const,
      pending: 'secondary' as const
    };
    
    const labels = {
      success: 'Sucesso',
      error: 'Erro',
      pending: 'Pendente'
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Interface de Teste de Webhooks
          </CardTitle>
          <CardDescription>
            Teste e monitore webhooks enviados para Make.com com dados completos de transação e usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleSendTestWebhook} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Enviando...' : 'Enviar Webhook de Teste'}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico ({testHistory.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook URL Info */}
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>URL do Webhook:</strong> https://hook.us2.make.com/qjdetduht1g375p7l556yrrutbi3j6cv
          <br />
          <strong>Método:</strong> POST | <strong>Content-Type:</strong> application/json
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {testHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum teste realizado ainda
                  </p>
                ) : (
                  testHistory.map((test) => (
                    <div
                      key={test.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTest?.id === test.id 
                          ? 'bg-muted border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTest(test)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {new Date(test.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                        {getStatusBadge(test.status)}
                      </div>
                      {test.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duração: {test.duration}ms
                        </p>
                      )}
                      {test.error && (
                        <p className="text-xs text-red-600 truncate">
                          {test.error}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Test Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Detalhes do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTest ? (
              <Tabs defaultValue="payload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payload">Payload</TabsTrigger>
                  <TabsTrigger value="response">Resposta</TabsTrigger>
                </TabsList>
                
                <TabsContent value="payload" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(selectedTest.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Timestamp:</span>
                      <span className="text-sm">
                        {new Date(selectedTest.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {selectedTest.duration && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Duração:</span>
                        <span className="text-sm">{selectedTest.duration}ms</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Payload JSON:</h4>
                    <ScrollArea className="h-64 w-full rounded border">
                      <pre className="text-xs p-4 whitespace-pre-wrap">
                        {JSON.stringify(selectedTest.payload, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="response" className="space-y-4">
                  {selectedTest.status === 'success' ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-green-600">
                        Resposta de Sucesso:
                      </h4>
                      <ScrollArea className="h-32 w-full rounded border">
                        <pre className="text-xs p-4">
                          {selectedTest.response || 'Webhook enviado com sucesso'}
                        </pre>
                      </ScrollArea>
                    </div>
                  ) : selectedTest.status === 'error' ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600">
                        Erro:
                      </h4>
                      <ScrollArea className="h-32 w-full rounded border">
                        <pre className="text-xs p-4 text-red-600">
                          {selectedTest.error || 'Erro desconhecido'}
                        </pre>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aguardando resposta...</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um teste no histórico para ver os detalhes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Payload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Teste Personalizado</CardTitle>
          <CardDescription>
            Envie um payload customizado para teste avançado (próxima versão)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Cole seu payload JSON personalizado aqui..."
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="min-h-32 font-mono text-sm"
              disabled
            />
            <Button onClick={handleSendCustomWebhook} disabled variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Enviar Payload Personalizado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};