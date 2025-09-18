// ABOUTME: Real-time sales analytics from payment_webhooks with plan breakdown

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface SalesAnalytics {
  totalSales: {
    count: number;
    revenue: number; // in cents
    revenueFormatted: string; // formatted as R$ X,XXX.XX
  };
  salesByStatus: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
  recentSales: Array<{
    payment_id: string;
    amount: number;
    event_type: string;
    status: string;
    created_at: string;
    customer_email?: string;
  }>;
  salesTrends: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  planPerformance: Array<{
    plan_name: string;
    sales_count: number;
    revenue: number;
  }>;
}

const formatCurrency = (amountInCents: number): string => {
  return (amountInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const useSalesAnalyticsQuery = () => {
  return useQuery({
    queryKey: ['sales-analytics'],
    queryFn: async (): Promise<SalesAnalytics> => {
      console.log('🔍 Fetching real sales analytics from payment_webhooks...');

      // Get total successful sales
      const { data: totalSalesData, error: totalError } = await supabase
        .from('payment_webhooks')
        .select('count, amount')
        .eq('event_type', 'charge.paid')
        .eq('status', 'paid');

      if (totalError) {
        console.error('❌ Error fetching total sales:', totalError);
        throw new Error(`Failed to fetch sales data: ${totalError.message}`);
      }

      // Calculate totals
      const totalCount = totalSalesData?.length || 0;
      const totalRevenue = totalSalesData?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;

      // Get sales by status
      const { data: statusData, error: statusError } = await supabase
        .from('payment_webhooks')
        .select('event_type, status, amount')
        .like('event_type', '%charge%');

      if (statusError) {
        console.error('❌ Error fetching sales by status:', statusError);
      }

      // Aggregate by status
      const salesByStatus = statusData?.reduce((acc: any[], item) => {
        const existing = acc.find(s => s.status === item.status);
        if (existing) {
          existing.count += 1;
          existing.revenue += item.amount || 0;
        } else {
          acc.push({
            status: item.status,
            count: 1,
            revenue: item.amount || 0
          });
        }
        return acc;
      }, []) || [];

      // Get recent sales (last 10)
      const { data: recentSalesData, error: recentError } = await supabase
        .from('payment_webhooks')
        .select('payment_id, amount, event_type, status, created_at, webhook_data')
        .eq('event_type', 'charge.paid')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('❌ Error fetching recent sales:', recentError);
      }

      // Extract customer emails from webhook_data
      const recentSales = recentSalesData?.map(sale => ({
        payment_id: sale.payment_id,
        amount: sale.amount,
        event_type: sale.event_type,
        status: sale.status,
        created_at: sale.created_at,
        customer_email: (sale.webhook_data as any)?.customerEmail || 'N/A'
      })) || [];

      // Get sales trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: trendsData, error: trendsError } = await supabase
        .from('payment_webhooks')
        .select('created_at, amount')
        .eq('event_type', 'charge.paid')
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (trendsError) {
        console.error('❌ Error fetching sales trends:', trendsError);
      }

      // Group by date
      const salesTrends = trendsData?.reduce((acc: any[], sale) => {
        const date = new Date(sale.created_at).toISOString().split('T')[0];
        const existing = acc.find(t => t.date === date);
        if (existing) {
          existing.count += 1;
          existing.revenue += sale.amount || 0;
        } else {
          acc.push({
            date,
            count: 1,
            revenue: sale.amount || 0
          });
        }
        return acc;
      }, []) || [];

      // Plan performance would require connecting payment data to plans
      // For now, return empty array as this needs plan metadata tracking
      const planPerformance: any[] = [];

      const result = {
        totalSales: {
          count: totalCount,
          revenue: totalRevenue,
          revenueFormatted: formatCurrency(totalRevenue)
        },
        salesByStatus,
        recentSales,
        salesTrends: salesTrends.sort((a, b) => a.date.localeCompare(b.date)),
        planPerformance
      };

      console.log('✅ Sales analytics loaded:', {
        totalSales: result.totalSales,
        statusBreakdown: salesByStatus.length,
        trends: salesTrends.length
      });

      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - frequent updates for real-time feel
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Always show latest sales data
    retry: (failureCount, error) => {
      console.error('Sales analytics query failed:', error);
      return failureCount < 2;
    }
  });
};