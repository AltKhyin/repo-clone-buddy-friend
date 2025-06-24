
// ABOUTME: Interactive analytics charts using Recharts library

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsChartsProps {
  userGrowthData: Array<{ month: string; users: number; premium: number }>;
  contentDistribution: Array<{ type: string; count: number; color: string }>;
  engagementTrends: Array<{ date: string; views: number; votes: number }>;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  userGrowthData,
  contentDistribution,
  engagementTrends
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Crescimento de Usuários</CardTitle>
          <CardDescription>
            Usuários totais e premium por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" name="Total" />
              <Bar dataKey="premium" fill="#10b981" name="Premium" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Content Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Conteúdo</CardTitle>
          <CardDescription>
            Tipos de conteúdo na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contentDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ type, count }) => `${type}: ${count}`}
              >
                {contentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement Trends Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tendências de Engajamento</CardTitle>
          <CardDescription>
            Visualizações e votos ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="views" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Visualizações"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="votes" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Votos"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
