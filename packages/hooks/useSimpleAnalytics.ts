// ABOUTME: Simplified analytics data fetching - loads data once when needed

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

// Simple data structure for charts
export interface SimpleChartData {
  date: string;
  value: number;
  label: string;
}

// Get payment revenue over last 30 days
export const usePaymentRevenue = () => {
  return useQuery({
    queryKey: ['payment-revenue-30d'],
    queryFn: async (): Promise<SimpleChartData[]> => {
      const { data, error } = await supabase
        .from('payment_webhooks')
        .select('created_at, amount')
        .eq('event_type', 'charge.paid')
        .eq('status', 'paid')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and sum amounts
      const groupedData: Record<string, number> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        groupedData[date] = (groupedData[date] || 0) + (item.amount || 0);
      });

      return Object.entries(groupedData).map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('pt-BR'),
        value: value / 100, // Convert cents to reais
        label: `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });
};

// Get user registrations over last 30 days
export const useUserRegistrations = () => {
  return useQuery({
    queryKey: ['user-registrations-30d'],
    queryFn: async (): Promise<SimpleChartData[]> => {
      const { data, error } = await supabase
        .from('Practitioners')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and count
      const groupedData: Record<string, number> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        groupedData[date] = (groupedData[date] || 0) + 1;
      });

      return Object.entries(groupedData).map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('pt-BR'),
        value,
        label: `${value} usuários`
      }));
    },
    staleTime: 10 * 60 * 1000,
    retry: 1
  });
};

// Get community posts over last 30 days
export const useCommunityPosts = () => {
  return useQuery({
    queryKey: ['community-posts-30d'],
    queryFn: async (): Promise<SimpleChartData[]> => {
      const { data, error } = await supabase
        .from('CommunityPosts')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and count
      const groupedData: Record<string, number> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        groupedData[date] = (groupedData[date] || 0) + 1;
      });

      return Object.entries(groupedData).map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('pt-BR'),
        value,
        label: `${value} posts`
      }));
    },
    staleTime: 10 * 60 * 1000,
    retry: 1
  });
};