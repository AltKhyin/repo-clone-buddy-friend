// ABOUTME: Simple chart component using Recharts with minimal configuration

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SimpleChartData } from '../../packages/hooks/useSimpleAnalytics';

interface SimpleChartProps {
  title: string;
  description?: string;
  data: SimpleChartData[] | undefined;
  isLoading: boolean;
  error: Error | null;
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-blue-600">{payload[0]?.payload?.label}</p>
    </div>
  );
};

export function SimpleChart({ title, description, data, isLoading, error, color = '#2563eb' }: SimpleChartProps) {
  if (isLoading) {
    return (
      <Card className="h-80">
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
      <Card className="h-80">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500 font-medium">Erro ao carregar dados</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-80">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-gray-400 mt-1">
              Dados dos últimos 30 dias
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}