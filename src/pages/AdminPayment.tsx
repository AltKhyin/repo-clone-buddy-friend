// ABOUTME: Admin payment management page following EVIDENS admin architecture for payment system configuration and monitoring
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, DollarSign, Users, Settings, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePaymentStats, useRecentPayments, useSubscriptionPlans, usePaymentConfiguration } from '@/hooks/queries/usePaymentAnalytics';
import { PaymentConfigurationModal } from '@/components/admin/PaymentManagement/PaymentConfigurationModal';

const AdminPaymentContent = () => {
  // Modal state management - simplified to single unified configuration
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Real data hooks replacing mock data
  const { data: paymentStats, isLoading: statsLoading, error: statsError } = usePaymentStats();
  const { data: recentPayments, isLoading: paymentsLoading, error: paymentsError } = useRecentPayments(3);
  const { data: subscriptionPlans, isLoading: plansLoading, error: plansError } = useSubscriptionPlans();
  const { data: paymentConfig, isLoading: configLoading } = usePaymentConfiguration();

  // Modal handler - unified configuration
  const handleOpenConfig = () => {
    setConfigModalOpen(true);
  };

  // Transform stats data for display
  const statsCards = paymentStats ? [
    {
      title: 'Receita Total',
      value: `R$ ${paymentStats.totalRevenue.toFixed(2).replace('.', ',')}`,
      description: 'Receita acumulada',
      icon: DollarSign,
      trend: paymentStats.revenueGrowth,
      trendUp: true,
    },
    {
      title: 'Assinantes Ativos',
      value: paymentStats.activeSubscribers.toString(),
      description: 'Usuários pagantes',
      icon: Users,
      trend: paymentStats.subscriberGrowth,
      trendUp: true,
    },
    {
      title: 'Taxa de Conversão',
      value: `${paymentStats.conversionRate.toFixed(1)}%`,
      description: 'Visitantes → Assinantes',
      icon: TrendingUp,
      trend: paymentStats.conversionGrowth,
      trendUp: true,
    },
    {
      title: 'PIX Confirmados',
      value: paymentStats.pixPayments.toString(),
      description: 'Pagamentos este mês',
      icon: Smartphone,
      trend: paymentStats.pixSuccessRate,
      trendUp: true,
    },
  ] : [];

  // Format recent payments for display
  const formatPaymentTime = (dateString: string) => {
    const now = new Date();
    const paymentTime = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - paymentTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `há ${diffMinutes} min`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `há ${hours}h`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `há ${days}d`;
    }
  };

  const formattedPayments = recentPayments?.map(payment => ({
    id: payment.id,
    customer: payment.customerName,
    amount: `R$ ${(payment.amount / 100).toFixed(2).replace('.', ',')}`,
    method: payment.method,
    status: payment.status,
    time: formatPaymentTime(payment.createdAt)
  })) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Aguardando</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <StandardLayout type="wide" contentClassName="space-y-8">
      {/* Header Section - Enhanced typography hierarchy (matching admin pattern) */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground font-serif">Gestão de Pagamentos</h2>
        <p className="text-muted-foreground text-lg">
          Configure e monitore o sistema de pagamentos EVIDENS
        </p>
      </div>

      {/* Payment Stats Grid - Following admin dashboard pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-surface border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
              </CardContent>
            </Card>
          ))
        ) : statsError ? (
          <div className="col-span-full">
            <Card className="bg-surface border-border shadow-sm">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p>Erro ao carregar estatísticas de pagamento</p>
                  <p className="text-sm mt-1">Verifique sua conexão e tente novamente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : statsCards.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-surface border-border shadow-sm">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <DollarSign className="h-6 w-6 mx-auto mb-2" />
                  <p>Nenhum dado de pagamento encontrado</p>
                  <p className="text-sm mt-1">Os dados aparecerão aqui quando houver transações</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          statsCards.map(stat => {
            const Icon = stat.icon;

            return (
              <Card
                key={stat.title}
                className="bg-surface border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.description}</p>
                  <p
                    className={`text-sm font-medium ${stat.trendUp ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}
                  >
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Main Content Grid - Following admin dashboard pattern */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Configuration Card */}
        <Card className="bg-surface border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Configurações</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configurações do sistema de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unified Pagar.me Configuration */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {configLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : paymentConfig?.isConfigured ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  Configuração Pagar.me
                </h3>
                <p className="text-sm text-muted-foreground">
                  {configLoading 
                    ? 'Verificando...' 
                    : paymentConfig?.isConfigured 
                      ? `API e webhooks configurados • ${paymentConfig?.pagarmeIntegration === 'active' ? 'Integração ativa' : 'Integração inativa'}`
                      : 'Configure credenciais da API e webhooks'
                  }
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleOpenConfig}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Pagar.me
              </Button>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Métodos de Pagamento</h3>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">PIX</Badge>
                  <Badge variant="secondary">Cartão (em breve)</Badge>
                  <Badge variant="secondary">Boleto (em breve)</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments Card */}
        <Card className="bg-surface border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Pagamentos Recentes
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Últimas transações processadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentsLoading ? (
                // Loading skeleton for recent payments
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-14"></div>
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))
              ) : paymentsError ? (
                <div className="text-center text-muted-foreground py-8">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p>Erro ao carregar pagamentos recentes</p>
                  <p className="text-sm mt-1">Verifique sua conexão</p>
                </div>
              ) : formattedPayments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CreditCard className="h-6 w-6 mx-auto mb-2" />
                  <p>Nenhum pagamento recente encontrado</p>
                  <p className="text-sm mt-1">Os pagamentos aparecerão aqui quando processados</p>
                </div>
              ) : (
                formattedPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-foreground">{payment.customer}</h4>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{payment.method}</span>
                        <span>{payment.amount}</span>
                        <span>{payment.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {payment.method === 'PIX' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                      {payment.method === 'Cartão' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                ))
              )}
              
              <Button variant="outline" className="w-full mt-4">
                Ver Todos os Pagamentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards - Payment Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-surface border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Planos de Assinatura</CardTitle>
            <CardDescription className="text-muted-foreground">
              Gerencie os planos disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plansLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                    </div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                  </div>
                ))}
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ) : plansError ? (
              <div className="text-center text-muted-foreground py-4">
                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                <p>Erro ao carregar planos</p>
              </div>
            ) : subscriptionPlans && subscriptionPlans.length > 0 ? (
              <>
                <div className="space-y-3">
                  {subscriptionPlans.map((plan, index) => (
                    <div key={plan.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <h4 className="font-medium">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          R$ {(plan.price / 100).toFixed(2).replace('.', ',')}/{plan.interval === 'month' ? 'mês' : 'ano'}
                        </p>
                      </div>
                      <Badge 
                        className={`${index === 0 
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                          : 'bg-green-100 text-green-800 hover:bg-green-100'
                        }`}
                      >
                        {plan.subscriberCount} assinantes
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  Gerenciar Planos
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <p>Nenhum plano configurado</p>
                <p className="text-sm mt-1">Configure planos para começar a receber assinantes</p>
                <Button variant="outline" className="w-full mt-4">
                  Criar Primeiro Plano
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Relatórios</CardTitle>
            <CardDescription className="text-muted-foreground">
              Relatórios financeiros e análises
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Receita Mensal
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Conversão de Assinantes
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Métodos de Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Operações</CardTitle>
            <CardDescription className="text-muted-foreground">
              Ações administrativas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Assinantes
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Reembolsos
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <AlertCircle className="h-4 w-4 mr-2" />
                Pagamentos Falhos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Configuration Modal - Unified Configuration */}
      <PaymentConfigurationModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </StandardLayout>
  );
};

export default function AdminPayment() {
  return (
    <ErrorBoundary
      tier="page"
      context="gestão de pagamentos"
      showHomeButton={true}
      showBackButton={true}
    >
      <AdminPaymentContent />
    </ErrorBoundary>
  );
}

export { AdminPayment };