// ABOUTME: Simple admin analytics dashboard with key metrics from production data

import React from 'react';
import { TrendingUp, Users, MessageSquare, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleChart } from '@/components/admin/SimpleChart';
import { usePaymentRevenue, useUserRegistrations, useCommunityPosts } from '../../packages/hooks/useSimpleAnalytics';

export default function AdminAnalytics() {
  const { data: paymentData, isLoading: paymentLoading, error: paymentError } = usePaymentRevenue();
  const { data: userRegData, isLoading: userLoading, error: userError } = useUserRegistrations();
  const { data: postData, isLoading: postLoading, error: postError } = useCommunityPosts();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Métricas principais dos últimos 30 dias
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium text-gray-600">
                Receita Total
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentLoading ? '...' : paymentData ?
                `R$ ${paymentData.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'R$ 0,00'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-medium text-gray-600">
                Novos Usuários
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userLoading ? '...' : userRegData ?
                userRegData.reduce((sum, item) => sum + item.value, 0)
                : '0'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm font-medium text-gray-600">
                Posts da Comunidade
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {postLoading ? '...' : postData ?
                postData.reduce((sum, item) => sum + item.value, 0)
                : '0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SimpleChart
          title="Receita Diária"
          description="Receita de pagamentos por dia (últimos 30 dias)"
          data={paymentData}
          isLoading={paymentLoading}
          error={paymentError}
          color="#059669"
        />

        <SimpleChart
          title="Novos Usuários"
          description="Registros de usuários por dia (últimos 30 dias)"
          data={userRegData}
          isLoading={userLoading}
          error={userError}
          color="#2563eb"
        />

        <SimpleChart
          title="Atividade da Comunidade"
          description="Posts criados por dia (últimos 30 dias)"
          data={postData}
          isLoading={postLoading}
          error={postError}
          color="#7c3aed"
        />

        <Card className="h-80 border-dashed border-2 border-gray-300">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-2">
                Mais métricas em breve
              </p>
              <p className="text-sm text-gray-400">
                Dashboard simples com dados reais
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}