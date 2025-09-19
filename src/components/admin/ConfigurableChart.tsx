// ABOUTME: Configurable chart component supporting multiple chart types with dual Y-axis using Recharts

import React from 'react';
import {
  LineChart,
  BarChart,
  AreaChart,
  ScatterChart,
  PieChart,
  Line,
  Bar,
  Area,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Edit3, Copy, Trash2 } from 'lucide-react';
import { ChartRenderConfig } from '@/types/analytics';
import { chartColorPalettes } from '@/types/analytics';

interface ConfigurableChartProps {
  config: ChartRenderConfig;
  isLoading?: boolean;
  error?: string | null;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

// Format values for display in tooltips and axes
const formatValue = (value: any, field: string): string => {
  if (value === null || value === undefined) return 'N/A';

  // Format currency (assuming amounts are in cents)
  if (field.toLowerCase().includes('amount') || field.toLowerCase().includes('revenue')) {
    return `R$ ${(Number(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  // Format dates
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }

  // Format numbers
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }

  return String(value);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, xAxisKey, yAxisKey, y2AxisKey }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 mb-2">
        {formatValue(label, xAxisKey)}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          <span className="font-medium">{entry.name}:</span>{' '}
          {formatValue(entry.value, entry.dataKey)}
        </p>
      ))}
    </div>
  );
};

export function ConfigurableChart({
  config,
  isLoading = false,
  error = null,
  onEdit,
  onDuplicate,
  onDelete,
  showActions = true,
}: ConfigurableChartProps) {
  const { type, data, xAxisKey, yAxisKey, y2AxisKey, y2ChartType, colors, title, description } = config;

  // Get colors from palette or use defaults
  const chartColors = colors.primary ? [colors.primary, colors.secondary] : chartColorPalettes.default;

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
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-gray-400 mt-1">
              Ajuste os filtros ou período para ver os dados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={(value) => formatValue(value, xAxisKey)}
            />
            <YAxis
              tickFormatter={(value) => formatValue(value, yAxisKey)}
            />
            {y2AxisKey && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatValue(value, y2AxisKey)}
              />
            )}
            <Tooltip content={<CustomTooltip xAxisKey={xAxisKey} yAxisKey={yAxisKey} y2AxisKey={y2AxisKey} />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={chartColors[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            {y2AxisKey && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={y2AxisKey}
                stroke={chartColors[1]}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={(value) => formatValue(value, xAxisKey)}
            />
            <YAxis
              tickFormatter={(value) => formatValue(value, yAxisKey)}
            />
            {y2AxisKey && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatValue(value, y2AxisKey)}
              />
            )}
            <Tooltip content={<CustomTooltip xAxisKey={xAxisKey} yAxisKey={yAxisKey} y2AxisKey={y2AxisKey} />} />
            <Legend />
            <Bar dataKey={yAxisKey} fill={chartColors[0]} />
            {y2AxisKey && y2ChartType === 'bar' && (
              <Bar yAxisId="right" dataKey={y2AxisKey} fill={chartColors[1]} />
            )}
            {/* Note: Mixed chart types with different components in same chart not directly supported by Recharts */}
            {/* For now, we'll handle dual Y-axis with same chart type */}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={(value) => formatValue(value, xAxisKey)}
            />
            <YAxis
              tickFormatter={(value) => formatValue(value, yAxisKey)}
            />
            <Tooltip content={<CustomTooltip xAxisKey={xAxisKey} yAxisKey={yAxisKey} />} />
            <Legend />
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={chartColors[0]}
              fill={chartColors[0]}
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={(value) => formatValue(value, xAxisKey)}
            />
            <YAxis
              tickFormatter={(value) => formatValue(value, yAxisKey)}
            />
            <Tooltip content={<CustomTooltip xAxisKey={xAxisKey} yAxisKey={yAxisKey} />} />
            <Scatter dataKey={yAxisKey} fill={chartColors[0]} />
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Tooltip formatter={(value) => formatValue(value, yAxisKey)} />
            <Legend />
            {/* Note: PieChart implementation would need data transformation */}
          </PieChart>
        );

      default:
        return <div>Tipo de gráfico não suportado: {type}</div>;
    }
  };

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {showActions && (
            <div className="flex items-center gap-1 ml-4">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              {onDuplicate && (
                <Button variant="ghost" size="sm" onClick={onDuplicate}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {type} chart
          </Badge>
          <Badge variant="outline" className="text-xs">
            {data.length} pontos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}