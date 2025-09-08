// ABOUTME: Admin interface for sending custom notifications to users

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Send, User, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCreateAdminNotification } from '../../../../packages/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Practitioner {
  id: string;
  full_name: string | null;
  role: string;
}

export const NotificationManagement = () => {
  const [selectedRecipient, setSelectedRecipient] = useState<'all' | string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const createNotificationMutation = useCreateAdminNotification();

  // Fetch active practitioners for recipient selection
  const { data: practitioners, isLoading: loadingPractitioners } = useQuery({
    queryKey: ['admin-practitioners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Practitioners')
        .select('id, full_name, role')
        .order('full_name');

      if (error) throw error;
      return data as Practitioner[];
    },
  });

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      return;
    }

    try {
      if (selectedRecipient === 'all') {
        // Send to all practitioners
        if (practitioners && practitioners.length > 0) {
          await Promise.all(
            practitioners.map(practitioner =>
              createNotificationMutation.mutateAsync({
                recipient_id: practitioner.id,
                title: title.trim(),
                message: message.trim(),
                metadata: {
                  admin_broadcast: true,
                  recipient_count: practitioners.length
                }
              })
            )
          );
          setSuccessMessage(`Notificação enviada com sucesso para ${practitioners.length} usuários!`);
        }
      } else {
        // Send to specific user
        await createNotificationMutation.mutateAsync({
          recipient_id: selectedRecipient,
          title: title.trim(),
          message: message.trim(),
          metadata: {
            admin_direct: true
          }
        });
        setSuccessMessage('Notificação enviada com sucesso para o usuário selecionado!');
      }

      // Reset form
      setTitle('');
      setMessage('');
      setSelectedRecipient('all');

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const getRecipientCount = () => {
    if (selectedRecipient === 'all') {
      return practitioners?.length || 0;
    }
    return 1;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Inbox
        </CardTitle>
        <CardDescription>
          Envie notificações personalizadas para usuários específicos ou para toda a comunidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {successMessage && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSendNotification} className="space-y-4">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Destinatário</Label>
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o destinatário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Todos os usuários ({practitioners?.length || 0})</span>
                  </div>
                </SelectItem>
                {practitioners?.map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {practitioner.full_name || 'Sem nome'} 
                        <span className="text-muted-foreground ml-1">({practitioner.role})</span>
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Esta notificação será enviada para {getRecipientCount()} usuário(s).
            </p>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Notificação</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Novidade importante na plataforma"
              maxLength={100}
              required
            />
            <p className="text-sm text-muted-foreground">
              {title.length}/100 caracteres
            </p>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva aqui a mensagem que será enviada aos usuários..."
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-sm text-muted-foreground">
              {message.length}/500 caracteres
            </p>
          </div>

          {/* Preview Card */}
          {(title.trim() || message.trim()) && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">Preview da notificação:</h4>
              <div className="bg-background border rounded-md p-3 text-sm">
                <div className="flex items-start gap-3">
                  <Bell className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {title.trim() || 'Título da notificação'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.trim() || 'Mensagem da notificação'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs border border-border px-2 py-0.5 rounded">
                        Administração
                      </span>
                      <span className="text-xs text-muted-foreground">
                        agora mesmo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning for broadcast messages */}
          {selectedRecipient === 'all' && practitioners && practitioners.length > 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Esta notificação será enviada para {practitioners.length} usuários. 
                Certifique-se de que o conteúdo está correto antes de enviar.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!title.trim() || !message.trim() || createNotificationMutation.isPending || loadingPractitioners}
              className="flex items-center gap-2"
            >
              {createNotificationMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Notificação
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};