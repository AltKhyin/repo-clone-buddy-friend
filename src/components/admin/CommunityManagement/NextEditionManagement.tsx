// ABOUTME: Admin management interface for Next Edition countdown scheduling and suggestion moderation with extremely simple controls.

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Clock,
  Calendar,
  Trash2,
  Settings,
  AlertTriangle,
  CheckCircle,
  User,
} from 'lucide-react';
import {
  useActiveCountdown,
  useSuggestions,
  useReviewMode,
  useUpdateCountdown,
  useToggleReviewMode,
  useDeleteSuggestion,
  useWipeAllSuggestions,
  useApproveSuggestion,
} from '../../../../packages/hooks/useNextEditionManagement';
import { useToast } from '../../../hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CountdownScheduleDialog = ({
  open,
  onOpenChange,
  currentTargetDate,
  currentStartDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTargetDate?: string;
  currentStartDate?: string;
}) => {
  const { toast } = useToast();
  const updateCountdownMutation = useUpdateCountdown();
  const [targetDate, setTargetDate] = useState(
    currentTargetDate ? new Date(currentTargetDate).toISOString().slice(0, 16) : ''
  );
  const [startDate, setStartDate] = useState(
    currentStartDate ? new Date(currentStartDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate || !startDate) {
      toast({
        title: 'Erro',
        description: 'Selecione as datas de início e fim para o countdown.',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(startDate) >= new Date(targetDate)) {
      toast({
        title: 'Erro',
        description: 'A data de início deve ser anterior à data de fim.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateCountdownMutation.mutateAsync({
        targetDate: new Date(targetDate).toISOString(),
        startDate: new Date(startDate).toISOString()
      });
      toast({
        title: 'Countdown agendado',
        description: `Countdown atualizado de ${format(new Date(startDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })} até ${format(new Date(targetDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao agendar countdown',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Countdown</DialogTitle>
          <DialogDescription>
            Defina a data e hora para o countdown da próxima edição.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSchedule} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Data e Hora de Início</Label>
            <Input
              id="start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-date">Data e Hora de Fim</Label>
            <Input
              id="target-date"
              type="datetime-local"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateCountdownMutation.isPending}
            >
              {updateCountdownMutation.isPending ? 'Agendando...' : 'Agendar Countdown'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const NextEditionManagement = () => {
  const { toast } = useToast();
  const { data: countdown, isLoading: countdownLoading } = useActiveCountdown();
  const { data: suggestions = [], isLoading: suggestionsLoading } = useSuggestions();
  const { data: reviewMode, isLoading: reviewModeLoading } = useReviewMode();
  const toggleReviewModeMutation = useToggleReviewMode();
  const deleteSuggestionMutation = useDeleteSuggestion();
  const wipeAllSuggestionsMutation = useWipeAllSuggestions();
  const approveSuggestionMutation = useApproveSuggestion();

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const handleToggleReviewMode = async (enabled: boolean) => {
    try {
      await toggleReviewModeMutation.mutateAsync(enabled);
      toast({
        title: enabled ? 'Modo de revisão ativado' : 'Modo de revisão desativado',
        description: enabled 
          ? 'Novas sugestões precisarão de aprovação antes de aparecer.'
          : 'Novas sugestões aparecem automaticamente.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar modo de revisão',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSuggestion = async (id: number, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir a sugestão "${title}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteSuggestionMutation.mutateAsync(id);
      toast({
        title: 'Sugestão excluída',
        description: `A sugestão "${title}" foi removida com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir sugestão',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const handleWipeAllSuggestions = async () => {
    if (!confirm('Tem certeza que deseja apagar TODAS as sugestões? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await wipeAllSuggestionsMutation.mutateAsync();
      toast({
        title: 'Todas as sugestões foram apagadas',
        description: 'O sistema de sugestões foi limpo com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao apagar sugestões',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const handleApproveSuggestion = async (id: number, title: string) => {
    try {
      await approveSuggestionMutation.mutateAsync(id);
      toast({
        title: 'Sugestão aprovada',
        description: `A sugestão "${title}" foi aprovada e está visível aos usuários.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar sugestão',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const calculateTimeRemaining = (targetDate: string) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return 'Expirado';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}min`;
  };

  if (countdownLoading || suggestionsLoading || reviewModeLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Countdown Scheduling Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Agendamento do Countdown
              </CardTitle>
              <CardDescription>
                Configure a data e hora para o countdown da próxima edição.
              </CardDescription>
            </div>
            <Button onClick={() => setScheduleDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Agendar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {countdown ? (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{countdown.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Alvo: {format(new Date(countdown.target_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-foreground">
                    {calculateTimeRemaining(countdown.target_date)}
                  </div>
                  <Badge variant={countdown.is_active ? 'default' : 'secondary'}>
                    {countdown.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum countdown configurado.</p>
              <p className="text-sm">Configure um countdown para a próxima edição.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestion Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestão de Sugestões
              </CardTitle>
              <CardDescription>
                Modere sugestões da comunidade e configure o sistema de aprovação.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="review-mode"
                  checked={reviewMode?.value || false}
                  onCheckedChange={handleToggleReviewMode}
                  disabled={toggleReviewModeMutation.isPending}
                />
                <Label htmlFor="review-mode">Modo de Revisão</Label>
              </div>
              <Button
                onClick={handleWipeAllSuggestions}
                variant="destructive"
                size="sm"
                disabled={wipeAllSuggestionsMutation.isPending || suggestions.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Apagar Todas
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma sugestão encontrada.</p>
              <p className="text-sm">As sugestões dos usuários aparecerão aqui.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sugestão</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Votos</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map(suggestion => (
                    <TableRow key={suggestion.id} className="hover:bg-surface-muted">
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-medium">{suggestion.title}</span>
                          {suggestion.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {suggestion.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {suggestion.Practitioners?.full_name || 'Anônimo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={suggestion.status === 'approved' ? 'default' : 'secondary'}
                        >
                          {suggestion.status === 'approved' ? 'Aprovado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(suggestion.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{suggestion.upvotes}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {suggestion.status === 'pending' && reviewMode?.value && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveSuggestion(suggestion.id, suggestion.title)}
                              disabled={approveSuggestionMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSuggestion(suggestion.id, suggestion.title)}
                            className="text-destructive hover:text-destructive"
                            disabled={deleteSuggestionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CountdownScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        currentTargetDate={countdown?.target_date}
        currentStartDate={countdown?.start_date}
      />
    </div>
  );
};