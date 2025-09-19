// ABOUTME: Global dashboard context for managing filters, time ranges, and chart configurations

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChartStyle, TimeRange, FilterOptions } from '../../packages/hooks/useAdvancedAnalytics';

interface DashboardState {
  // Global filters
  globalTimeRange: TimeRange;
  globalChartStyle: ChartStyle;

  // Tab visibility
  activeTab: 'finances' | 'users' | 'content';
  visibleCharts: Record<string, boolean>;

  // Chart-specific filters
  chartFilters: Record<string, Partial<FilterOptions>>;
}

interface DashboardContextType {
  state: DashboardState;

  // Global actions
  setGlobalTimeRange: (timeRange: TimeRange) => void;
  setGlobalChartStyle: (style: ChartStyle) => void;
  setActiveTab: (tab: 'finances' | 'users' | 'content') => void;

  // Chart visibility
  toggleChart: (chartId: string) => void;
  setChartVisible: (chartId: string, visible: boolean) => void;

  // Chart-specific filters
  updateChartFilter: (chartId: string, filters: Partial<FilterOptions>) => void;
  getChartFilter: (chartId: string) => FilterOptions;

  // Reset functions
  resetAllFilters: () => void;
  resetChartFilter: (chartId: string) => void;
}

const defaultState: DashboardState = {
  globalTimeRange: '30d',
  globalChartStyle: 'line',
  activeTab: 'finances',
  visibleCharts: {
    // Finances
    'revenue-by-plan': true,
    'plan-tier-summary': true,
    'payment-success-rate': true,
    'cumulative-revenue': true,

    // Users
    'user-growth': true,
    'user-tier-distribution': true,
    'user-acquisition-funnel': true,
    'user-retention': true,

    // Content
    'content-creation': true,
    'content-engagement': true,
    'top-content': true,
    'content-pipeline': true,
  },
  chartFilters: {}
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(defaultState);

  const setGlobalTimeRange = (timeRange: TimeRange) => {
    setState(prev => ({ ...prev, globalTimeRange: timeRange }));
  };

  const setGlobalChartStyle = (style: ChartStyle) => {
    setState(prev => ({ ...prev, globalChartStyle: style }));
  };

  const setActiveTab = (tab: 'finances' | 'users' | 'content') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const toggleChart = (chartId: string) => {
    setState(prev => ({
      ...prev,
      visibleCharts: {
        ...prev.visibleCharts,
        [chartId]: !prev.visibleCharts[chartId]
      }
    }));
  };

  const setChartVisible = (chartId: string, visible: boolean) => {
    setState(prev => ({
      ...prev,
      visibleCharts: {
        ...prev.visibleCharts,
        [chartId]: visible
      }
    }));
  };

  const updateChartFilter = (chartId: string, filters: Partial<FilterOptions>) => {
    setState(prev => ({
      ...prev,
      chartFilters: {
        ...prev.chartFilters,
        [chartId]: {
          ...prev.chartFilters[chartId],
          ...filters
        }
      }
    }));
  };

  const getChartFilter = (chartId: string): FilterOptions => {
    const chartSpecificFilters = state.chartFilters[chartId] || {};
    return {
      timeRange: state.globalTimeRange,
      chartStyle: state.globalChartStyle,
      planTiers: [],
      contentTypes: [],
      userTiers: [],
      paymentStatus: ['paid'],
      ...chartSpecificFilters
    };
  };

  const resetAllFilters = () => {
    setState(prev => ({
      ...prev,
      chartFilters: {},
      globalTimeRange: '30d',
      globalChartStyle: 'line'
    }));
  };

  const resetChartFilter = (chartId: string) => {
    setState(prev => ({
      ...prev,
      chartFilters: {
        ...prev.chartFilters,
        [chartId]: {}
      }
    }));
  };

  const value: DashboardContextType = {
    state,
    setGlobalTimeRange,
    setGlobalChartStyle,
    setActiveTab,
    toggleChart,
    setChartVisible,
    updateChartFilter,
    getChartFilter,
    resetAllFilters,
    resetChartFilter
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Chart configuration definitions
export const chartConfigs = {
  finances: [
    {
      id: 'revenue-by-plan',
      title: 'Receita por Plano',
      description: 'Receita diária segmentada por plano de assinatura',
      hook: 'useRevenueByPlan',
      filters: ['planTiers', 'paymentStatus']
    },
    {
      id: 'plan-tier-summary',
      title: 'Performance dos Planos',
      description: 'Comparação de vendas e receita entre planos',
      hook: 'usePlanTierSummary',
      filters: ['paymentStatus']
    },
    {
      id: 'payment-success-rate',
      title: 'Taxa de Sucesso',
      description: 'Taxa de aprovação de pagamentos ao longo do tempo',
      hook: 'usePaymentSuccessRate',
      filters: ['planTiers']
    },
    {
      id: 'cumulative-revenue',
      title: 'Receita Acumulada',
      description: 'Crescimento cumulativo da receita',
      hook: 'useRevenueByPlan',
      filters: ['planTiers', 'paymentStatus']
    }
  ],
  users: [
    {
      id: 'user-growth',
      title: 'Crescimento de Usuários',
      description: 'Novos registros diários por tipo de plano',
      hook: 'useUserGrowth',
      filters: ['userTiers']
    },
    {
      id: 'user-tier-distribution',
      title: 'Distribuição por Plano',
      description: 'Proporção de usuários por tipo de assinatura',
      hook: 'useUserTierDistribution',
      filters: []
    },
    {
      id: 'user-acquisition-funnel',
      title: 'Funil de Aquisição',
      description: 'Conversão de registro para assinatura paga',
      hook: 'useUserGrowth',
      filters: ['userTiers']
    },
    {
      id: 'user-retention',
      title: 'Retenção de Usuários',
      description: 'Atividade e engajamento ao longo do tempo',
      hook: 'useUserTierDistribution',
      filters: ['userTiers']
    }
  ],
  content: [
    {
      id: 'content-creation',
      title: 'Criação de Conteúdo',
      description: 'Posts e reviews criados ao longo do tempo',
      hook: 'useContentCreation',
      filters: ['contentTypes']
    },
    {
      id: 'content-engagement',
      title: 'Engajamento por Tipo',
      description: 'Upvotes médios e visualizações por tipo de conteúdo',
      hook: 'useContentEngagement',
      filters: ['contentTypes']
    },
    {
      id: 'top-content',
      title: 'Conteúdo Destacado',
      description: 'Melhor conteúdo por engajamento',
      hook: 'useContentEngagement',
      filters: ['contentTypes']
    },
    {
      id: 'content-pipeline',
      title: 'Pipeline de Conteúdo',
      description: 'Status do conteúdo: rascunho → publicado → arquivado',
      hook: 'useContentCreation',
      filters: ['contentTypes']
    }
  ]
};