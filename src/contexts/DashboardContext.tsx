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
    'daily-revenue': true,
    'cumulative-revenue': true,

    // Users
    'user-growth': true,
    'daily-active-users': true,
    'monthly-active-users': true,
    'dau-mau-ratio': true,
    'user-engagement': true,

    // Content Analytics
    'content-total-views': true,
    'top-performing-content': true,
    'content-performance-since-publication': true,
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
      id: 'daily-revenue',
      title: 'Receita Diária',
      description: 'Receita total por dia (todos os planos)',
      hook: 'useDailyRevenue',
      filters: []
    },
    {
      id: 'cumulative-revenue',
      title: 'Receita Acumulada',
      description: 'Crescimento cumulativo da receita total',
      hook: 'useDailyRevenue',
      filters: []
    }
  ],
  users: [
    {
      id: 'user-engagement',
      title: 'Engajamento de Usuários',
      description: 'Posts, upvotes e comentários por usuário',
      hook: 'useUserEngagement',
      filters: ['engagementTypes', 'userTiers']
    },
    {
      id: 'user-growth',
      title: 'Crescimento de Usuários',
      description: 'Novos registros diários',
      hook: 'useUserGrowth',
      filters: ['userTiers']
    },
    {
      id: 'daily-active-users',
      title: 'Usuários Ativos Diários (DAU)',
      description: 'Total e percentual de usuários ativos por dia',
      hook: 'useDailyActiveUsers',
      filters: ['userTiers']
    },
    {
      id: 'monthly-active-users',
      title: 'Usuários Ativos Mensais (MAU)',
      description: 'Total e percentual de usuários ativos por mês',
      hook: 'useMonthlyActiveUsers',
      filters: ['userTiers']
    },
    {
      id: 'dau-mau-ratio',
      title: 'Razão DAU:MAU',
      description: 'Índice de engajamento (DAU dividido por MAU)',
      hook: 'useDAUMAURatio',
      filters: []
    }
  ],
  content: [
    {
      id: 'content-total-views',
      title: 'Total de Visualizações',
      description: 'Total de visualizações diárias do conteúdo publicado',
      hook: 'useContentTotalViews',
      filters: []
    },
    {
      id: 'top-performing-content',
      title: 'Top 10 Conteúdos',
      description: 'Os 10 conteúdos mais visualizados no período',
      hook: 'useTopPerformingContent',
      filters: []
    },
    {
      id: 'content-performance-since-publication',
      title: 'Performance desde Publicação',
      description: 'Evolução de visualizações acumuladas desde a publicação (dias vs views)',
      hook: 'useContentPerformanceSincePublication',
      filters: ['contentSelection']
    }
  ]
};