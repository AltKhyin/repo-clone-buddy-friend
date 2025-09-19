// ABOUTME: Enhanced analytics dashboard with three tabs, filtering, and comprehensive business metrics

import React from 'react';
import { Calendar, Settings2, Eye, EyeOff, BarChart3, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

import { DashboardProvider, useDashboard, chartConfigs } from '@/contexts/DashboardContext';
import { EnhancedChart } from '@/components/admin/EnhancedChart';
import { ContentAnalyticsChart } from '@/components/admin/YouTubeStyleChart';
import {
  useDailyRevenue,
  useUserGrowth,
  useDailyActiveUsers,
  useMonthlyActiveUsers,
  useDAUMAURatio,
  useUserEngagement,
  useContentTotalViews,
  useTopPerformingContent,
  useContentClickRate,
  useContentPerformanceSincePublication,
  ChartStyle,
  TimeRange
} from '../../packages/hooks/useAdvancedAnalytics';

function DashboardContent() {
  const {
    state,
    setGlobalTimeRange,
    setGlobalChartStyle,
    setActiveTab,
    toggleChart,
    getChartFilter
  } = useDashboard();

  // Analytics hooks - using the global filters from context
  const financesData = {
    dailyRevenue: useDailyRevenue(getChartFilter('daily-revenue')),
    cumulativeRevenue: useDailyRevenue(getChartFilter('cumulative-revenue'))
  };

  const usersData = {
    userGrowth: useUserGrowth(getChartFilter('user-growth')),
    dailyActiveUsers: useDailyActiveUsers(getChartFilter('daily-active-users')),
    monthlyActiveUsers: useMonthlyActiveUsers(getChartFilter('monthly-active-users')),
    dauMauRatio: useDAUMAURatio(getChartFilter('dau-mau-ratio')),
    userEngagement: useUserEngagement(getChartFilter('user-engagement'))
  };

  const contentData = {
    contentTotalViews: useContentTotalViews(getChartFilter('content-total-views')),
    topPerformingContent: useTopPerformingContent(getChartFilter('top-performing-content')),
    contentClickRate: useContentClickRate(getChartFilter('content-click-rate')),
    contentPerformanceSincePublication: useContentPerformanceSincePublication(getChartFilter('content-performance-since-publication'))
  };

  const renderChartGrid = (tabName: 'finances' | 'users' | 'content') => {
    const configs = chartConfigs[tabName];
    const data = tabName === 'finances' ? financesData : tabName === 'users' ? usersData : contentData;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-full overflow-hidden">
        {configs.map((config) => {
          const chartKey = config.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace(/^([a-z])/, (g) => g.toLowerCase());
          const hookData = data[chartKey as keyof typeof data];

          if (!state.visibleCharts[config.id]) return null;

          // Use specialized charts for content analytics
          if (tabName === 'content') {
            const getChartType = (configId: string): 'total-views' | 'top-content' | 'performance-comparison' => {
              switch (configId) {
                case 'content-total-views':
                  return 'total-views';
                case 'top-performing-content':
                  return 'top-content';
                case 'content-performance-since-publication':
                  return 'performance-comparison';
                default:
                  return 'total-views';
              }
            };

            const isPerformanceChart = config.id === 'content-performance-since-publication';

            return (
              <div
                key={config.id}
                className={isPerformanceChart ? 'xl:col-span-2' : ''}
              >
                <ContentAnalyticsChart
                  chartId={config.id}
                  title={config.title}
                  description={config.description}
                  data={hookData?.data}
                  isLoading={hookData?.isLoading || false}
                  error={hookData?.error || null}
                  chartType={getChartType(config.id)}
                />
              </div>
            );
          }

          // Use standard enhanced charts for finances and users
          return (
            <EnhancedChart
              key={config.id}
              chartId={config.id}
              title={config.title}
              description={config.description}
              data={hookData?.data}
              isLoading={hookData?.isLoading || false}
              error={hookData?.error || null}
              availableFilters={config.filters}
            />
          );
        })}
      </div>
    );
  };

  const getVisibleChartsCount = (tabName: 'finances' | 'users' | 'content') => {
    return chartConfigs[tabName].filter(config => state.visibleCharts[config.id]).length;
  };

  const getTotalChartsCount = (tabName: 'finances' | 'users' | 'content') => {
    return chartConfigs[tabName].length;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Global Controls */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Análise completa com métricas financeiras, usuários e conteúdo
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <Select
            value={state.globalTimeRange}
            onValueChange={(value: TimeRange) => setGlobalTimeRange(value)}
          >
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>

          {/* Chart Style Filter */}
          <Select
            value={state.globalChartStyle}
            onValueChange={(value: ChartStyle) => setGlobalChartStyle(value)}
          >
            <SelectTrigger className="w-36">
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Linha</SelectItem>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="area">Área</SelectItem>
              <SelectItem value="pie">Pizza</SelectItem>
            </SelectContent>
          </Select>

          {/* Chart Visibility Manager */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings2 className="h-4 w-4 mr-2" />
                Gráficos
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <DropdownMenuLabel>Gerenciar Visualização</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Finances Charts */}
              <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                🏦 Financeiro ({getVisibleChartsCount('finances')}/{getTotalChartsCount('finances')})
              </DropdownMenuLabel>
              {chartConfigs.finances.map((config) => (
                <DropdownMenuCheckboxItem
                  key={config.id}
                  checked={state.visibleCharts[config.id]}
                  onCheckedChange={() => toggleChart(config.id)}
                >
                  {config.title}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              {/* Users Charts */}
              <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                👥 Usuários ({getVisibleChartsCount('users')}/{getTotalChartsCount('users')})
              </DropdownMenuLabel>
              {chartConfigs.users.map((config) => (
                <DropdownMenuCheckboxItem
                  key={config.id}
                  checked={state.visibleCharts[config.id]}
                  onCheckedChange={() => toggleChart(config.id)}
                >
                  {config.title}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              {/* Content Charts */}
              <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                📝 Conteúdo ({getVisibleChartsCount('content')}/{getTotalChartsCount('content')})
              </DropdownMenuLabel>
              {chartConfigs.content.map((config) => (
                <DropdownMenuCheckboxItem
                  key={config.id}
                  checked={state.visibleCharts[config.id]}
                  onCheckedChange={() => toggleChart(config.id)}
                >
                  {config.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Período Ativo</p>
                <p className="text-xl font-bold">
                  {state.globalTimeRange === '7d' && '7 dias'}
                  {state.globalTimeRange === '30d' && '30 dias'}
                  {state.globalTimeRange === '90d' && '90 dias'}
                  {state.globalTimeRange === '1y' && '1 ano'}
                  {state.globalTimeRange === 'all' && 'Todo período'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Gráficos Visíveis</p>
                <p className="text-xl font-bold">
                  {Object.values(state.visibleCharts).filter(Boolean).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Estilo Global</p>
                <p className="text-xl font-bold capitalize">{state.globalChartStyle}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Aba Ativa</p>
                <p className="text-xl font-bold capitalize">{state.activeTab}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={state.activeTab} onValueChange={(tab: any) => setActiveTab(tab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="finances" className="flex items-center gap-2">
            🏦 Financeiro
            <Badge variant="secondary" className="ml-1">
              {getVisibleChartsCount('finances')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            👥 Usuários
            <Badge variant="secondary" className="ml-1">
              {getVisibleChartsCount('users')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            📝 Conteúdo
            <Badge variant="secondary" className="ml-1">
              {getVisibleChartsCount('content')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="finances" className="space-y-6 overflow-hidden">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Análise Financeira</h2>
            <p className="text-gray-600">Receitas, planos e performance de pagamentos</p>
          </div>
          {renderChartGrid('finances')}
        </TabsContent>

        <TabsContent value="users" className="space-y-6 overflow-hidden">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Atividade de Usuários</h2>
            <p className="text-gray-600">Crescimento, conversão e engajamento</p>
          </div>
          {renderChartGrid('users')}
        </TabsContent>

        <TabsContent value="content" className="space-y-6 overflow-hidden">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Analytics de Conteúdo</h2>
            <p className="text-gray-600">Visualizações, top conteúdos e performance desde publicação</p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📊 <strong>Placeholder:</strong> Dados reais de visualização são coletados a partir do momento em que usuários acessam o conteúdo.
                Se não há dados visíveis, significa que ainda não temos métricas suficientes para o período selecionado.
              </p>
            </div>
          </div>
          {renderChartGrid('content')}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminAnalytics() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}