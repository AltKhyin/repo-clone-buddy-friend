// ABOUTME: Enhanced chart component with multiple styles, filtering, and advanced analytics display

import React, { useMemo } from 'react';
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Line,
  Bar,
  Area,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Filter, BarChart3, TrendingUp, PieChart as PieChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { ChartDataPoint, ChartStyle } from '../../packages/hooks/useAdvancedAnalytics';
import { useDashboard } from '@/contexts/DashboardContext';

interface EnhancedChartProps {
  chartId: string;
  title: string;
  description?: string;
  data: ChartDataPoint[] | undefined;
  isLoading: boolean;
  error: Error | null;
  availableFilters?: string[];
}

const chartColors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2'];

const chartStyleIcons = {
  line: TrendingUp,
  bar: BarChart3,
  area: AreaChartIcon,
  pie: PieChartIcon,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.payload?.label || `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
};

export function EnhancedChart({
  chartId,
  title,
  description,
  data,
  isLoading,
  error,
  availableFilters = []
}: EnhancedChartProps) {
  const { state, updateChartFilter, getChartFilter } = useDashboard();
  const currentFilter = getChartFilter(chartId);
  const isVisible = state.visibleCharts[chartId] ?? true;

  // Process data for chart display
  const { chartData, categories } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], categories: [] };

    // Group data by date for multi-category charts
    if (currentFilter.chartStyle === 'pie') {
      // For pie charts, aggregate by category
      const categoryTotals: Record<string, number> = {};
      data.forEach(item => {
        const category = item.category || 'Default';
        categoryTotals[category] = (categoryTotals[category] || 0) + item.value;
      });

      return {
        chartData: Object.entries(categoryTotals).map(([name, value]) => ({
          name,
          value,
          label: `${name}: ${value.toLocaleString('pt-BR')}`
        })),
        categories: Object.keys(categoryTotals)
      };
    }

    // For other chart types, group by date with multiple series
    const groupedByDate: Record<string, Record<string, number>> = {};
    const allCategories = new Set<string>();

    data.forEach(item => {
      const date = item.date;
      const category = item.category || 'Default';

      if (!groupedByDate[date]) groupedByDate[date] = {};
      groupedByDate[date][category] = item.value;
      allCategories.add(category);
    });

    const processedData = Object.entries(groupedByDate).map(([date, categories]) => ({
      date,
      ...categories
    }));

    // For cumulative charts
    if (chartId.includes('cumulative')) {
      let cumulative = 0;
      return {
        chartData: processedData.map(item => {
          const total = Object.values(item).filter(v => typeof v === 'number').reduce((sum, val) => sum + val, 0);
          cumulative += total;
          return { ...item, cumulative };
        }),
        categories: ['cumulative']
      };
    }

    return {
      chartData: processedData,
      categories: Array.from(allCategories)
    };
  }, [data, currentFilter.chartStyle, chartId]);

  const handleChartStyleChange = (style: ChartStyle) => {
    updateChartFilter(chartId, { chartStyle: style });
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (currentFilter.chartStyle) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {categories.map((category, index) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category === 'cumulative' ? 'cumulative' : category}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {categories.map((category, index) => (
              <Bar
                key={category}
                dataKey={category}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {categories.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={chartColors[index % chartColors.length]}
                fill={chartColors[index % chartColors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return <div>Tipo de gráfico não suportado</div>;
    }
  };

  if (!isVisible) return null;

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500 font-medium">Erro ao carregar dados</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>

          {/* Chart Style Selector */}
          <div className="flex items-center gap-2 ml-4">
            <Select
              value={currentFilter.chartStyle}
              onValueChange={(value: ChartStyle) => handleChartStyleChange(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Linha
                  </div>
                </SelectItem>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Barras
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <AreaChartIcon className="h-4 w-4" />
                    Área
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    Pizza
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {availableFilters.length > 0 && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Chart Info */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {currentFilter.chartStyle}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {chartData.length} pontos
          </Badge>
          {categories.length > 1 && (
            <Badge variant="outline" className="text-xs">
              {categories.length} séries
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={250}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}