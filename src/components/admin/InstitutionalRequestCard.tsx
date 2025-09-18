// ABOUTME: Detailed view and management card for individual institutional plan requests

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Mail, Phone, Building, User, FileText, Save } from 'lucide-react';
import { type InstitutionalRequest } from '../../../packages/hooks/useInstitutionalRequestsQuery';
import { useUpdateInstitutionalRequestMutation } from '../../../packages/hooks/useUpdateInstitutionalRequestMutation';
import { useAuthStore } from '@/store/auth';

interface InstitutionalRequestCardProps {
  request: InstitutionalRequest;
  onBack: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'reviewing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'reviewing': return 'Em análise';
    case 'approved': return 'Aprovado';
    case 'rejected': return 'Rejeitado';
    default: return status;
  }
};

export const InstitutionalRequestCard: React.FC<InstitutionalRequestCardProps> = ({
  request,
  onBack
}) => {
  const [selectedStatus, setSelectedStatus] = useState(request.status);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '');
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();
  const { user } = useAuthStore();
  const updateMutation = useUpdateInstitutionalRequestMutation();

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus as any);
    setHasChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setAdminNotes(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await updateMutation.mutateAsync({
        id: request.id,
        status: selectedStatus,
        admin_notes: adminNotes,
        reviewed_by: user.id
      });

      toast({
        title: "Alterações salvas",
        description: "As informações da requisição foram atualizadas com sucesso.",
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{request.business_name}</h1>
            <p className="text-gray-600">Requisição de plano institucional</p>
          </div>
        </div>
        <Badge className={getStatusColor(request.status)}>
          {getStatusLabel(request.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome do Responsável</label>
                  <p className="text-lg font-semibold">{request.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                      {request.email}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Telefone</label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                      {request.phone}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Empresa</label>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <p className="font-semibold">{request.business_name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specific Needs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Necessidades Específicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{request.specific_needs}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Requisição criada</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                {request.updated_at !== request.created_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Última atualização</p>
                      <p className="text-sm text-gray-600">
                        {new Date(request.updated_at).toLocaleString('pt-BR')}
                        {request.reviewed_by && (
                          <span className="ml-2">por {request.reviewed_by.full_name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Administrativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Update */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="pending">Pendente</option>
                  <option value="reviewing">Em análise</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Notas Administrativas
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Adicione notas sobre esta requisição..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                onClick={() => window.open(`mailto:${request.email}`, '_blank')}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`tel:${request.phone}`, '_blank')}
                className="w-full justify-start"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};