// ABOUTME: Specialized chart component for content analytics with leaderboards and performance comparison

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  BarChart,
  ComposedChart,
  Line,
  Bar,
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
import { Loader2, Trophy, TrendingUp, Eye, BarChart3 } from 'lucide-react';
import { ChartDataPoint, useAvailableContentForSelection } from '../../../packages/hooks/useAdvancedAnalytics';
import { useDashboard } from '@/contexts/DashboardContext';

interface ContentAnalyticsChartProps {
  chartId: string;
  title: string;
  description?: string;
  data: ChartDataPoint[] | undefined;
  isLoading: boolean;
  error: Error | null;
  chartType: 'total-views' | 'top-content' | 'performance-comparison';
}

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

const TopContentLeaderboard = ({ data }: { data: ChartDataPoint[] }) => {
  if (!data || data.length === 0) return null;

  const maxViews = Math.max(...data.map(item => item.value));

  return (
    <div className="space-y-1.5">
      {data.slice(0, 10).map((item, index) => {
        const metadata = item.metadata;
        const rank = index + 1;
        const isTopThree = rank <= 3;
        const viewPercentage = maxViews > 0 ? (item.value / maxViews) * 100 : 0;

        return (
          <div
            key={`${metadata?.id || index}`}
            className={`relative flex items-center gap-2 py-2 px-3 rounded border transition-all hover:shadow-sm ${
              isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
          >
            {/* Background Progress Bar */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent rounded opacity-40"
              style={{ width: `${viewPercentage}%` }}
            />

            {/* Rank Badge */}
            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded text-xs font-bold ${
              rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
              rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
              rank === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' :
              'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
            }`}>
              {rank === 1 ? <Trophy className="w-3 h-3" /> : rank}
            </div>

            {/* Content Info */}
            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 truncate text-sm">
                  {metadata?.title || item.label}
                </h4>
                <div className="flex items-center gap-1 text-sm text-gray-600 ml-2">
                  <span className="font-medium">{item.value.toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-gray-500">views</span>
                </div>
              </div>

              {/* Compact metadata row */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">
                  #{rank}
                </span>
                {metadata?.hasRealData === false && (
                  <span className="text-xs text-orange-500">est.</span>
                )}
                {metadata?.studyType && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {metadata.studyType}
                  </span>
                )}
                {metadata?.readingTime && (
                  <span className="text-xs text-gray-500">
                    {metadata.readingTime}min
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PerformanceComparisonChart = ({
  data,
  chartId
}: {
  data: ChartDataPoint[],
  chartId: string
}) => {
  const { getChartFilter } = useDashboard();
  const filters = getChartFilter(chartId);
  const { data: availableContent } = useAvailableContentForSelection(filters);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);

  // Group data by review/content ID for line chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group by review ID and sort by days since publication
    const grouped: Record<string, any[]> = {};

    data.forEach(item => {
      const reviewId = item.category || 'unknown';
      if (!grouped[reviewId]) grouped[reviewId] = [];

      grouped[reviewId].push({
        daysSincePublication: parseInt(item.date),
        cumulativeViews: item.value,
        reviewTitle: item.metadata?.title || `Review ${reviewId}`,
        label: item.label,
        metadata: item.metadata
      });
    });

    // Convert to line chart format: each day as x-axis, each review as separate line
    const maxDays = Math.max(...data.map(item => parseInt(item.date)));
    const result = [];

    for (let day = 0; day <= maxDays; day++) {
      const dayData: any = { day };

      Object.entries(grouped).forEach(([reviewId, points]) => {
        // Find the point for this day or interpolate
        const pointForDay = points.find(p => p.daysSincePublication === day);
        if (pointForDay) {
          dayData[reviewId] = pointForDay.cumulativeViews;
        } else {
          // For days before/after data points, use 0 or last known value
          const sortedPoints = points.sort((a, b) => a.daysSincePublication - b.daysSincePublication);
          const firstPoint = sortedPoints[0];
          const lastPoint = sortedPoints[sortedPoints.length - 1];

          if (day < firstPoint.daysSincePublication) {
            dayData[reviewId] = 0; // Before publication
          } else if (day > lastPoint.daysSincePublication) {
            dayData[reviewId] = lastPoint.cumulativeViews; // Maintain final value
          } else {
            // Interpolate between points (linear)
            const beforePoint = sortedPoints.reverse().find(p => p.daysSincePublication <= day);
            dayData[reviewId] = beforePoint ? beforePoint.cumulativeViews : 0;
          }
        }
      });

      result.push(dayData);
    }

    return result;
  }, [data]);

  // Get unique review IDs for line generation
  const reviewIds = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(item => item.category))].filter(Boolean);
  }, [data]);

  // Color palette for different reviews
  const colors = ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2'];

  return (
    <div className="space-y-4">
      {/* Content Selection Dropdown */}
      {availableContent && availableContent.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={selectedContentIds.join(',')}
              onValueChange={(value) => setSelectedContentIds(value ? value.split(',') : [])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar conteúdo específico (padrão: últimos 4)" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableContent.map((content) => (
                  <SelectItem key={content.id} value={content.id}>
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="truncate flex-1">{content.title}</span>
                      <div className="flex items-center gap-2 ml-2 text-xs text-gray-500">
                        <Eye className="w-3 h-3" />
                        <span>{content.views}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedContentIds([])}
            className="shrink-0"
          >
            Resetar
          </Button>
        </div>
      )}

      {/* Performance Line Chart with Right Legend */}
      <div className="flex gap-6">
        {/* Chart Area */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                label={{ value: 'Dias desde Publicação', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Views Acumuladas', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-sm">
                      <p className="font-medium text-gray-900 mb-2">Dia {label}</p>
                      {payload.map((entry: any, index: number) => {
                        const reviewData = data?.find(d => d.category === entry.dataKey && d.date === label.toString());
                        const isRealData = reviewData?.metadata?.isRealData;
                        const isFallback = reviewData?.metadata?.isFallbackCurve;

                        return (
                          <div key={index} className="mb-2">
                            <p className="text-sm font-medium" style={{ color: entry.color }}>
                              {reviewData?.metadata?.title || entry.dataKey}
                            </p>
                            <p className="text-sm text-gray-600">
                              {entry.value?.toLocaleString('pt-BR')} views acumuladas
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <p className="text-xs text-gray-500">
                                Dados Reais
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {/* Hide default legend since we're using custom */}
              {reviewIds.map((reviewId, index) => {
                const reviewData = data?.find(item => item.category === reviewId);
                const isRealData = reviewData?.metadata?.isRealData;
                const isFallbackCurve = reviewData?.metadata?.isFallbackCurve;

                // Visual differentiation: dashed lines for estimated data, solid for real data
                const strokeDasharray = isRealData ? undefined : "5 5";
                const strokeWidth = isRealData ? 3 : 2;
                const dotRadius = isRealData ? 5 : 3;

                return (
                  <Line
                    key={reviewId}
                    type="monotone"
                    dataKey={reviewId}
                    stroke={colors[index % colors.length]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    dot={{ r: dotRadius, strokeWidth: 2 }}
                    name={`${reviewData?.metadata?.title?.substring(0, 15)}...${isFallbackCurve ? ' (estimado)' : ''}`}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right Legend Panel */}
        <div className="w-64 bg-gray-50 rounded-lg p-4 shrink-0">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Reviews Analisadas</h4>
          <div className="space-y-3">
            {reviewIds.map((reviewId, index) => {
              const reviewData = data?.find(item => item.category === reviewId);
              const reviewTitle = reviewData?.metadata?.title || `Review ${index + 1}`;
              const isRealData = reviewData?.metadata?.isRealData;
              const isFallbackCurve = reviewData?.metadata?.isFallbackCurve;
              const totalViews = reviewData?.metadata?.cumulativeViews || 0;

              return (
                <div key={reviewId} className="flex items-start gap-3 p-2 bg-white rounded border">
                  {/* Color indicator line */}
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div
                      className="w-6 h-1 rounded"
                      style={{
                        backgroundColor: colors[index % colors.length],
                        borderStyle: isRealData ? 'solid' : 'dashed',
                        borderWidth: isRealData ? '0' : '1px 0',
                        borderColor: colors[index % colors.length]
                      }}
                    />
                    <div className={`w-2 h-2 rounded-full ${isRealData ? 'bg-green-500' : 'bg-orange-400'}`} />
                  </div>

                  {/* Review info */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
                      {reviewTitle}
                    </h5>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">
                        {totalViews.toLocaleString('pt-BR')} views
                      </p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500">
                          {isRealData ? 'Dados Reais' : 'Estimativa'}
                        </p>
                      </div>
                      {isFallbackCurve && (
                        <p className="text-xs text-gray-400">
                          Curva Científica
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend explanation */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500 rounded" />
                <span className="text-xs text-gray-600">Linha sólida = Dados reais</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 border border-blue-500 border-dashed rounded" />
                <span className="text-xs text-gray-600">Linha tracejada = Estimativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ContentAnalyticsChart({
  chartId,
  title,
  description,
  data,
  isLoading,
  error,
  chartType
}: ContentAnalyticsChartProps) {
  const { state } = useDashboard();
  const isVisible = state.visibleCharts[chartId] ?? true;

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

  const renderContent = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-gray-500 font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-gray-400 mt-1">
              Ajuste o período ou publique mais conteúdo
            </p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'top-content':
        return <TopContentLeaderboard data={data} />;

      case 'performance-comparison':
        return <PerformanceComparisonChart data={data} chartId={chartId} />;

      case 'total-views':
      default:
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const getIcon = () => {
    switch (chartType) {
      case 'top-content':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'total-views':
        return <Eye className="h-5 w-5 text-blue-600" />;
      case 'performance-comparison':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card className="h-auto min-h-96">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            {getIcon()}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
          </div>
        </div>

        {/* Chart Info */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {chartType}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {data?.length || 0} {chartType === 'top-content' ? 'conteúdos' : 'pontos'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}