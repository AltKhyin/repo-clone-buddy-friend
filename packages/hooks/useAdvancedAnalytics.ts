// ABOUTME: Advanced analytics hooks with filtering and multiple chart styles for three-tab dashboard

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export type ChartStyle = 'line' | 'bar' | 'area' | 'pie';
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface FilterOptions {
  timeRange: TimeRange;
  chartStyle: ChartStyle;
  planTiers?: string[];
  contentTypes?: string[];
  userTiers?: string[];
  paymentStatus?: string[];
}

// Helper to get date range
const getDateRange = (timeRange: TimeRange): Date => {
  const now = new Date();
  switch (timeRange) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all': return new Date('2024-01-01'); // Reasonable start date
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
};

// FINANCES TAB - 4 Key Analytics

// 1. Daily Revenue Trend with Plan Tier Filtering
export const useRevenueByPlan = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['revenue-by-plan', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      let query = supabase
        .from('payment_webhooks')
        .select('created_at, amount, event_type, status')
        .eq('event_type', 'charge.paid')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (filters.paymentStatus?.length) {
        query = query.in('status', filters.paymentStatus);
      } else {
        query = query.eq('status', 'paid');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date and plan tier
      const groupedData: Record<string, Record<string, number>> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        const amount = item.amount || 0;

        // Categorize by plan tier based on amount
        let planTier = 'Other';
        if (amount === 4900 || amount === 5000 || amount === 5100 || amount === 5150) {
          planTier = 'Basic (R$50)';
        } else if (amount === 29700) {
          planTier = 'Standard (R$297)';
        } else if (amount === 35880) {
          planTier = 'Premium (R$358)';
        } else if (amount >= 30000) {
          planTier = 'Premium+ (R$300+)';
        }

        if (!groupedData[date]) groupedData[date] = {};
        groupedData[date][planTier] = (groupedData[date][planTier] || 0) + amount;
      });

      // Convert to chart data format
      const result: ChartDataPoint[] = [];
      Object.entries(groupedData).forEach(([date, plans]) => {
        Object.entries(plans).forEach(([planTier, totalAmount]) => {
          result.push({
            date: new Date(date).toLocaleDateString('pt-BR'),
            value: totalAmount / 100, // Convert to reais
            label: `${planTier}: R$ ${(totalAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            category: planTier,
            metadata: { planTier, rawAmount: totalAmount }
          });
        });
      });

      return result;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1
  });
};

// 2. Revenue by Plan Tier Summary
export const usePlanTierSummary = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['plan-tier-summary', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('payment_webhooks')
        .select('amount, event_type, status')
        .eq('event_type', 'charge.paid')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by plan tier
      const planStats: Record<string, { count: number; revenue: number }> = {};

      data?.forEach(item => {
        const amount = item.amount || 0;
        let planTier = 'Other';

        if (amount === 4900 || amount === 5000 || amount === 5100 || amount === 5150) {
          planTier = 'Basic (R$50)';
        } else if (amount === 29700) {
          planTier = 'Standard (R$297)';
        } else if (amount === 35880) {
          planTier = 'Premium (R$358)';
        } else if (amount >= 30000) {
          planTier = 'Premium+ (R$300+)';
        }

        if (!planStats[planTier]) planStats[planTier] = { count: 0, revenue: 0 };
        planStats[planTier].count += 1;
        planStats[planTier].revenue += amount;
      });

      return Object.entries(planStats).map(([planTier, stats]) => ({
        date: planTier,
        value: stats.revenue / 100,
        label: `${planTier}: ${stats.count} vendas - R$ ${(stats.revenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        category: planTier,
        metadata: { count: stats.count, revenue: stats.revenue }
      }));
    },
    staleTime: 10 * 60 * 1000
  });
};

// 3. Payment Success Rate
export const usePaymentSuccessRate = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['payment-success-rate', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('payment_webhooks')
        .select('created_at, event_type, status')
        .in('event_type', ['charge.paid', 'charge.payment_failed'])
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyStats: Record<string, { success: number; failed: number }> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) dailyStats[date] = { success: 0, failed: 0 };

        if (item.event_type === 'charge.paid' && item.status === 'paid') {
          dailyStats[date].success += 1;
        } else if (item.event_type === 'charge.payment_failed') {
          dailyStats[date].failed += 1;
        }
      });

      return Object.entries(dailyStats).map(([date, stats]) => {
        const total = stats.success + stats.failed;
        const successRate = total > 0 ? (stats.success / total) * 100 : 0;

        return {
          date: new Date(date).toLocaleDateString('pt-BR'),
          value: successRate,
          label: `${successRate.toFixed(1)}% (${stats.success}/${total})`,
          category: 'success_rate',
          metadata: { success: stats.success, failed: stats.failed, total }
        };
      });
    },
    staleTime: 10 * 60 * 1000
  });
};

// USER ACTIVITY TAB - 2 Key Analytics

// 1. User Registration Growth with Tier Filtering
export const useUserGrowth = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['user-growth', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      let query = supabase
        .from('Practitioners')
        .select('created_at, subscription_tier')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Group by date and tier
      const groupedData: Record<string, Record<string, number>> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        const tier = item.subscription_tier || 'unknown';

        if (!groupedData[date]) groupedData[date] = {};
        groupedData[date][tier] = (groupedData[date][tier] || 0) + 1;
      });

      const result: ChartDataPoint[] = [];
      Object.entries(groupedData).forEach(([date, tiers]) => {
        Object.entries(tiers).forEach(([tier, count]) => {
          result.push({
            date: new Date(date).toLocaleDateString('pt-BR'),
            value: count,
            label: `${tier}: ${count} usuários`,
            category: tier,
            metadata: { tier, count }
          });
        });
      });

      return result;
    },
    staleTime: 10 * 60 * 1000
  });
};

// 2. User Tier Distribution
export const useUserTierDistribution = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['user-tier-distribution', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('Practitioners')
        .select('subscription_tier, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const tierCounts: Record<string, number> = {};
      data?.forEach(item => {
        const tier = item.subscription_tier || 'unknown';
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      });

      return Object.entries(tierCounts).map(([tier, count]) => ({
        date: tier,
        value: count,
        label: `${tier}: ${count} usuários`,
        category: tier,
        metadata: { tier, count }
      }));
    },
    staleTime: 10 * 60 * 1000
  });
};

// CONTENT PERFORMANCE TAB - 2 Key Analytics

// 1. Content Creation Trend with Type Filtering
export const useContentCreation = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['content-creation', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // Get both community posts and reviews
      const [postsResponse, reviewsResponse] = await Promise.all([
        supabase
          .from('CommunityPosts')
          .select('created_at, post_type')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('Reviews')
          .select('created_at, status')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })
      ]);

      if (postsResponse.error || reviewsResponse.error) {
        throw postsResponse.error || reviewsResponse.error;
      }

      const groupedData: Record<string, Record<string, number>> = {};

      // Process community posts
      postsResponse.data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        const contentType = `Post (${item.post_type})`;

        if (!groupedData[date]) groupedData[date] = {};
        groupedData[date][contentType] = (groupedData[date][contentType] || 0) + 1;
      });

      // Process reviews
      reviewsResponse.data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        const contentType = `Review (${item.status})`;

        if (!groupedData[date]) groupedData[date] = {};
        groupedData[date][contentType] = (groupedData[date][contentType] || 0) + 1;
      });

      const result: ChartDataPoint[] = [];
      Object.entries(groupedData).forEach(([date, types]) => {
        Object.entries(types).forEach(([contentType, count]) => {
          result.push({
            date: new Date(date).toLocaleDateString('pt-BR'),
            value: count,
            label: `${contentType}: ${count}`,
            category: contentType,
            metadata: { contentType, count }
          });
        });
      });

      return result;
    },
    staleTime: 10 * 60 * 1000
  });
};

// 2. Content Engagement by Type
export const useContentEngagement = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['content-engagement', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const [postsResponse, reviewsResponse] = await Promise.all([
        supabase
          .from('CommunityPosts')
          .select('post_type, upvotes')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('Reviews')
          .select('status, view_count')
          .gte('created_at', startDate.toISOString())
      ]);

      if (postsResponse.error || reviewsResponse.error) {
        throw postsResponse.error || reviewsResponse.error;
      }

      const engagementStats: Record<string, { total: number; count: number }> = {};

      // Process posts upvotes
      postsResponse.data?.forEach(item => {
        const type = `Post (${item.post_type})`;
        if (!engagementStats[type]) engagementStats[type] = { total: 0, count: 0 };
        engagementStats[type].total += item.upvotes || 0;
        engagementStats[type].count += 1;
      });

      // Process review views
      reviewsResponse.data?.forEach(item => {
        if (item.status === 'published') { // Only count published reviews
          const type = 'Review (views)';
          if (!engagementStats[type]) engagementStats[type] = { total: 0, count: 0 };
          engagementStats[type].total += item.view_count || 0;
          engagementStats[type].count += 1;
        }
      });

      return Object.entries(engagementStats).map(([type, stats]) => {
        const avgEngagement = stats.count > 0 ? stats.total / stats.count : 0;
        return {
          date: type,
          value: avgEngagement,
          label: `${type}: ${avgEngagement.toFixed(1)} média`,
          category: type,
          metadata: { total: stats.total, count: stats.count, average: avgEngagement }
        };
      });
    },
    staleTime: 10 * 60 * 1000
  });
};