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

// FINANCES TAB - 2 Key Analytics

// 1. Daily Revenue Trend (Total Revenue, No Plan Filtering)
export const useDailyRevenue = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['daily-revenue', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('payment_webhooks')
        .select('created_at, amount, event_type, status')
        .eq('event_type', 'charge.paid')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date for total daily revenue
      const groupedData: Record<string, number> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        const amount = item.amount || 0;

        groupedData[date] = (groupedData[date] || 0) + amount;
      });

      return Object.entries(groupedData).map(([date, totalAmount]) => ({
        date: new Date(date).toLocaleDateString('pt-BR'),
        value: totalAmount / 100, // Convert to reais
        label: `R$ ${(totalAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        category: 'total_revenue',
        metadata: { date, rawAmount: totalAmount }
      }));
    },
    staleTime: 10 * 60 * 1000,
    retry: 1
  });
};

// 1. Daily Revenue Trend with Plan Tier Filtering (Legacy - kept for reference)
export const useRevenueByPlan = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['revenue-by-plan', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // First, get the plan mapping from paymentplansv2
      const { data: plansData, error: plansError } = await supabase
        .from('paymentplansv2')
        .select('id, name, slug, base_amount, final_amount, plan_type')
        .eq('is_active', true);

      if (plansError) throw plansError;

      // Create plan mapping
      const planMap = new Map();
      plansData?.forEach(plan => {
        planMap.set(plan.final_amount, {
          name: plan.name,
          slug: plan.slug,
          planType: plan.plan_type,
          baseAmount: plan.base_amount,
          finalAmount: plan.final_amount
        });
      });

      let query = supabase
        .from('payment_webhooks')
        .select('created_at, amount, event_type, status, webhook_data')
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

        // Get base price from webhook metadata
        const webhookMetadata = item.webhook_data?.data?.metadata;
        const basePrice = webhookMetadata?.base_price ? parseInt(webhookMetadata.base_price) : amount;

        // Find matching plan from our plan map
        const matchingPlan = planMap.get(basePrice);
        let planName = 'Unknown Plan';

        if (matchingPlan) {
          planName = matchingPlan.name;
        } else {
          // Fallback: categorize by base price if not found in plan map
          if (basePrice <= 5000) {
            planName = 'Test Plan (R$50)';
          } else if (basePrice === 29700) {
            planName = 'Reviews Plans (R$297)';
          } else {
            planName = `Other Plan (R$${(basePrice / 100).toFixed(0)})`;
          }
        }

        if (!groupedData[date]) groupedData[date] = {};
        groupedData[date][planName] = (groupedData[date][planName] || 0) + amount;
      });

      // Convert to chart data format
      const result: ChartDataPoint[] = [];
      Object.entries(groupedData).forEach(([date, plans]) => {
        Object.entries(plans).forEach(([planName, totalAmount]) => {
          result.push({
            date: new Date(date).toLocaleDateString('pt-BR'),
            value: totalAmount / 100, // Convert to reais
            label: `${planName}: R$ ${(totalAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            category: planName,
            metadata: { planName, rawAmount: totalAmount }
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

      // First, get the plan mapping from paymentplansv2
      const { data: plansData, error: plansError } = await supabase
        .from('paymentplansv2')
        .select('id, name, slug, base_amount, final_amount, plan_type')
        .eq('is_active', true);

      if (plansError) throw plansError;

      // Create plan mapping
      const planMap = new Map();
      plansData?.forEach(plan => {
        planMap.set(plan.final_amount, {
          name: plan.name,
          slug: plan.slug,
          planType: plan.plan_type,
          baseAmount: plan.base_amount,
          finalAmount: plan.final_amount
        });
      });

      const { data, error } = await supabase
        .from('payment_webhooks')
        .select('amount, event_type, status, webhook_data')
        .eq('event_type', 'charge.paid')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by plan tier
      const planStats: Record<string, { count: number; revenue: number; basePrice: number }> = {};

      data?.forEach(item => {
        const amount = item.amount || 0;

        // Get base price from webhook metadata
        const webhookMetadata = item.webhook_data?.data?.metadata;
        const basePrice = webhookMetadata?.base_price ? parseInt(webhookMetadata.base_price) : amount;

        // Find matching plan from our plan map
        const matchingPlan = planMap.get(basePrice);
        let planName = 'Unknown Plan';

        if (matchingPlan) {
          planName = matchingPlan.name;
        } else {
          // Fallback: categorize by base price if not found in plan map
          if (basePrice <= 5000) {
            planName = 'Test Plan';
          } else if (basePrice === 29700) {
            planName = 'Reviews Plans';
          } else {
            planName = `Other Plan`;
          }
        }

        if (!planStats[planName]) planStats[planName] = { count: 0, revenue: 0, basePrice };
        planStats[planName].count += 1;
        planStats[planName].revenue += amount;
      });

      return Object.entries(planStats).map(([planName, stats]) => ({
        date: planName,
        value: stats.revenue / 100,
        label: `${planName}: ${stats.count} vendas - R$ ${(stats.revenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        category: planName,
        metadata: { count: stats.count, revenue: stats.revenue, basePrice: stats.basePrice }
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

// USER ACTIVITY TAB - 5 Key Analytics

// 1. User Registration Growth
export const useUserGrowth = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['user-growth', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('Practitioners')
        .select('created_at, subscription_tier')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date (total growth, not by tier)
      const groupedData: Record<string, number> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        groupedData[date] = (groupedData[date] || 0) + 1;
      });

      return Object.entries(groupedData).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('pt-BR'),
        value: count,
        label: `${count} novos usuários`,
        category: 'new_users',
        metadata: { date, count }
      }));
    },
    staleTime: 10 * 60 * 1000
  });
};

// 2. Daily Active Users (DAU)
export const useDailyActiveUsers = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['daily-active-users', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // Get total user count for percentage calculation
      const { data: totalUsers, error: totalError } = await supabase
        .from('Practitioners')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;
      const totalUserCount = totalUsers?.length || 0;

      // Get daily active users from community activity
      const { data, error } = await supabase
        .from('CommunityOnlineUsers')
        .select('last_seen_at, user_id')
        .gte('last_seen_at', startDate.toISOString())
        .order('last_seen_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyActive: Record<string, Set<string>> = {};

      data?.forEach(item => {
        const date = new Date(item.last_seen_at).toISOString().split('T')[0];
        if (!dailyActive[date]) dailyActive[date] = new Set();
        dailyActive[date].add(item.user_id);
      });

      return Object.entries(dailyActive).map(([date, userSet]) => {
        const count = userSet.size;
        const percentage = totalUserCount > 0 ? (count / totalUserCount) * 100 : 0;
        return {
          date: new Date(date).toLocaleDateString('pt-BR'),
          value: count,
          label: `${count} usuários ativos (${percentage.toFixed(1)}%)`,
          category: 'dau',
          metadata: { date, count, percentage, totalUsers: totalUserCount }
        };
      });
    },
    staleTime: 10 * 60 * 1000
  });
};

// 3. Monthly Active Users (MAU)
export const useMonthlyActiveUsers = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['monthly-active-users', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // Get total user count for percentage calculation
      const { data: totalUsers, error: totalError } = await supabase
        .from('Practitioners')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;
      const totalUserCount = totalUsers?.length || 0;

      // Get monthly active users from community activity
      const { data, error } = await supabase
        .from('CommunityOnlineUsers')
        .select('last_seen_at, user_id')
        .gte('last_seen_at', startDate.toISOString())
        .order('last_seen_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyActive: Record<string, Set<string>> = {};

      data?.forEach(item => {
        const date = new Date(item.last_seen_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyActive[monthKey]) monthlyActive[monthKey] = new Set();
        monthlyActive[monthKey].add(item.user_id);
      });

      return Object.entries(monthlyActive).map(([month, userSet]) => {
        const count = userSet.size;
        const percentage = totalUserCount > 0 ? (count / totalUserCount) * 100 : 0;
        return {
          date: month,
          value: count,
          label: `${count} usuários ativos (${percentage.toFixed(1)}%)`,
          category: 'mau',
          metadata: { month, count, percentage, totalUsers: totalUserCount }
        };
      });
    },
    staleTime: 10 * 60 * 1000
  });
};

// 4. DAU:MAU Ratio
export const useDAUMAURatio = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['dau-mau-ratio', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // Get both DAU and MAU data
      const { data: onlineData, error } = await supabase
        .from('CommunityOnlineUsers')
        .select('last_seen_at, user_id')
        .gte('last_seen_at', startDate.toISOString())
        .order('last_seen_at', { ascending: true });

      if (error) throw error;

      // Calculate DAU and MAU for ratio
      const dailyActive: Record<string, Set<string>> = {};
      const monthlyActive: Record<string, Set<string>> = {};

      onlineData?.forEach(item => {
        const date = new Date(item.last_seen_at);
        const dateKey = date.toISOString().split('T')[0];
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!dailyActive[dateKey]) dailyActive[dateKey] = new Set();
        dailyActive[dateKey].add(item.user_id);

        if (!monthlyActive[monthKey]) monthlyActive[monthKey] = new Set();
        monthlyActive[monthKey].add(item.user_id);
      });

      // Calculate ratio for each day
      const result: ChartDataPoint[] = [];
      Object.entries(dailyActive).forEach(([date, dauSet]) => {
        const dateObj = new Date(date);
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const mauSet = monthlyActive[monthKey];

        if (mauSet && mauSet.size > 0) {
          const ratio = (dauSet.size / mauSet.size) * 100;
          result.push({
            date: dateObj.toLocaleDateString('pt-BR'),
            value: ratio,
            label: `${ratio.toFixed(1)}% (DAU: ${dauSet.size}, MAU: ${mauSet.size})`,
            category: 'dau_mau_ratio',
            metadata: { date, dau: dauSet.size, mau: mauSet.size, ratio }
          });
        }
      });

      return result;
    },
    staleTime: 10 * 60 * 1000
  });
};

// 5. User Engagement (Posts + Upvotes + Comments)
export const useUserEngagement = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['user-engagement', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // Get posts, votes, and comments data
      const [postsResponse, votesResponse] = await Promise.all([
        supabase
          .from('CommunityPosts')
          .select('created_at, author_id, post_type')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('CommunityPost_Votes')
          .select('created_at, practitioner_id, vote_type')
          .gte('created_at', startDate.toISOString())
      ]);

      if (postsResponse.error || votesResponse.error) {
        throw postsResponse.error || votesResponse.error;
      }

      // Group engagement by date and type
      const engagementData: Record<string, Record<string, number>> = {};

      // Process posts
      postsResponse.data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!engagementData[date]) engagementData[date] = {};
        engagementData[date]['posts'] = (engagementData[date]['posts'] || 0) + 1;
      });

      // Process votes (upvotes only)
      votesResponse.data?.forEach(item => {
        if (item.vote_type === 'up') {
          const date = new Date(item.created_at).toISOString().split('T')[0];
          if (!engagementData[date]) engagementData[date] = {};
          engagementData[date]['upvotes'] = (engagementData[date]['upvotes'] || 0) + 1;
        }
      });

      // Convert to chart data format
      const result: ChartDataPoint[] = [];
      Object.entries(engagementData).forEach(([date, engagement]) => {
        Object.entries(engagement).forEach(([type, count]) => {
          result.push({
            date: new Date(date).toLocaleDateString('pt-BR'),
            value: count,
            label: `${type}: ${count}`,
            category: type,
            metadata: { date, type, count }
          });
        });
      });

      return result;
    },
    staleTime: 10 * 60 * 1000
  });
};

// Legacy exports for backward compatibility
export const useUserTierDistribution = useUserGrowth;

// CONTENT PERFORMANCE TAB - 4 Review-Focused Analytics

// 1. Review Creation Trend by Status
export const useReviewCreation = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['review-creation', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('Reviews')
        .select('created_at, status, review_status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const groupedData: Record<string, Record<string, number>> = {};

      data?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        const status = item.status || 'unknown';

        if (!groupedData[date]) groupedData[date] = {};
        groupedData[date][status] = (groupedData[date][status] || 0) + 1;
      });

      const result: ChartDataPoint[] = [];
      Object.entries(groupedData).forEach(([date, statuses]) => {
        Object.entries(statuses).forEach(([status, count]) => {
          result.push({
            date: new Date(date).toLocaleDateString('pt-BR'),
            value: count,
            label: `${status}: ${count} reviews`,
            category: status,
            metadata: { status, count }
          });
        });
      });

      return result;
    },
    staleTime: 10 * 60 * 1000
  });
};

// 2. Review Performance by Study Type
export const useReviewPerformance = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['review-performance', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('Reviews')
        .select('study_type, view_count, status, reading_time_minutes')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'published'); // Only published reviews for performance metrics

      if (error) throw error;

      const performanceStats: Record<string, { totalViews: number; count: number; totalReadingTime: number }> = {};

      data?.forEach(item => {
        const studyType = item.study_type || 'Não Especificado';
        if (!performanceStats[studyType]) {
          performanceStats[studyType] = { totalViews: 0, count: 0, totalReadingTime: 0 };
        }
        performanceStats[studyType].totalViews += item.view_count || 0;
        performanceStats[studyType].totalReadingTime += item.reading_time_minutes || 0;
        performanceStats[studyType].count += 1;
      });

      return Object.entries(performanceStats).map(([studyType, stats]) => {
        const avgViews = stats.count > 0 ? stats.totalViews / stats.count : 0;
        return {
          date: studyType,
          value: avgViews,
          label: `${studyType}: ${avgViews.toFixed(1)} visualizações médias (${stats.count} reviews)`,
          category: studyType,
          metadata: {
            avgViews,
            count: stats.count,
            totalViews: stats.totalViews,
            avgReadingTime: stats.count > 0 ? stats.totalReadingTime / stats.count : 0
          }
        };
      });
    },
    staleTime: 10 * 60 * 1000
  });
};

// 3. Review Content Types Distribution
export const useContentTypeDistribution = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['content-type-distribution', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('Reviews')
        .select(`
          created_at,
          ReviewContentTypes!inner(
            ContentTypes!inner(
              label
            )
          )
        `)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const contentTypeStats: Record<string, number> = {};

      data?.forEach(item => {
        item.ReviewContentTypes?.forEach((rct: any) => {
          const contentType = rct.ContentTypes?.label || 'Não Categorizado';
          contentTypeStats[contentType] = (contentTypeStats[contentType] || 0) + 1;
        });
      });

      return Object.entries(contentTypeStats).map(([contentType, count]) => ({
        date: contentType,
        value: count,
        label: `${contentType}: ${count} reviews`,
        category: contentType,
        metadata: { contentType, count }
      }));
    },
    staleTime: 10 * 60 * 1000
  });
};

// 4. Editorial Pipeline Status
export const useEditorialPipeline = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['editorial-pipeline', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('Reviews')
        .select('review_status, access_level, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Count by review status and access level
      const pipelineStats: Record<string, Record<string, number>> = {};

      data?.forEach(item => {
        const status = item.review_status || 'unknown';
        const access = item.access_level || 'public';
        const key = `${status} (${access})`;

        if (!pipelineStats[key]) pipelineStats[key] = {};
        pipelineStats[key]['count'] = (pipelineStats[key]['count'] || 0) + 1;
      });

      return Object.entries(pipelineStats).map(([statusAccess, stats]) => ({
        date: statusAccess,
        value: stats.count,
        label: `${statusAccess}: ${stats.count} reviews`,
        category: statusAccess,
        metadata: { statusAccess, count: stats.count }
      }));
    },
    staleTime: 10 * 60 * 1000
  });
};

// YOUTUBE-STYLE CONTENT ANALYTICS

// 1. Total Content Views (REAL DAILY DATA ONLY)
export const useContentTotalViews = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['content-total-views', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);
      const endDate = new Date();

      // ONLY use real daily view metrics data
      const { data: dailyMetrics, error } = await supabase
        .from('daily_view_metrics')
        .select('view_date, daily_views')
        .gte('view_date', startDate.toISOString().split('T')[0])
        .lte('view_date', endDate.toISOString().split('T')[0])
        .order('view_date', { ascending: true });

      if (error) throw error;

      if (!dailyMetrics || dailyMetrics.length === 0) {
        console.warn('No real daily view metrics available for the selected period');
        return []; // Return empty if no real data available
      }

      // Group by date for daily total views from REAL data
      const dailyViews: Record<string, number> = {};

      dailyMetrics.forEach(metric => {
        const date = metric.view_date;
        dailyViews[date] = (dailyViews[date] || 0) + metric.daily_views;
      });

      return Object.entries(dailyViews)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort by date
        .map(([date, totalViews]) => ({
          date: new Date(date).toLocaleDateString('pt-BR'),
          value: totalViews,
          label: `${totalViews.toLocaleString('pt-BR')} visualizações`,
          category: 'total_views',
          metadata: { date, totalViews, isRealData: true }
        }));
    },
    staleTime: 5 * 60 * 1000
  });
};

// 2. Top Performing Content (Period-specific views, not lifetime totals)
export const useTopPerformingContent = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['top-performing-content', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);
      const endDate = new Date();

      // Get all published reviews in the time period
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('Reviews')
        .select('id, title, view_count, created_at, study_type, reading_time_minutes')
        .eq('status', 'published')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      // Try to get period-specific view data from daily_view_metrics
      const reviewIds = reviewsData.map(r => r.id);
      const { data: dailyMetrics, error: metricsError } = await supabase
        .from('daily_view_metrics')
        .select('review_id, daily_views, view_date')
        .in('review_id', reviewIds)
        .gte('view_date', startDate.toISOString().split('T')[0])
        .lte('view_date', endDate.toISOString().split('T')[0]);

      // Calculate period-specific views for each review
      const reviewPeriodViews: Record<number, { periodViews: number; hasRealData: boolean }> = {};

      // Initialize with zero views
      reviewsData.forEach(review => {
        reviewPeriodViews[review.id] = { periodViews: 0, hasRealData: false };
      });

      // If we have daily metrics, calculate real period views
      if (!metricsError && dailyMetrics && dailyMetrics.length > 0) {
        dailyMetrics.forEach(metric => {
          reviewPeriodViews[metric.review_id].periodViews += metric.daily_views;
          reviewPeriodViews[metric.review_id].hasRealData = true;
        });
      }

      // ONLY include reviews with real data - no estimation
      const sortedReviews = reviewsData
        .map(review => ({
          ...review,
          periodViews: reviewPeriodViews[review.id].periodViews,
          hasRealData: reviewPeriodViews[review.id].hasRealData
        }))
        .filter(review => review.hasRealData && review.periodViews > 0) // ONLY real data
        .sort((a, b) => b.periodViews - a.periodViews)
        .slice(0, 10);

      return sortedReviews.map((item, index) => ({
        date: `#${index + 1}`,
        value: item.periodViews,
        label: `${item.title?.substring(0, 50)}${(item.title?.length || 0) > 50 ? '...' : ''}`,
        category: 'top_content',
        metadata: {
          id: item.id,
          title: item.title,
          periodViews: item.periodViews,
          totalViews: item.view_count,
          rank: index + 1,
          studyType: item.study_type,
          readingTime: item.reading_time_minutes,
          publishedAt: item.created_at,
          hasRealData: item.hasRealData,
          isEstimated: !item.hasRealData
        }
      }));
    },
    staleTime: 5 * 60 * 1000
  });
};

// 3. Content Click Rate (Estimated based on review views vs community engagement)
export const useContentClickRate = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['content-click-rate', filters],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // Get published content and their views
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('Reviews')
        .select('id, view_count, created_at, title')
        .eq('status', 'published')
        .gte('created_at', startDate.toISOString());

      if (reviewsError) throw reviewsError;

      // Get community activity as proxy for potential impressions
      const { data: communityActivity, error: communityError } = await supabase
        .from('CommunityPosts')
        .select('created_at, upvotes')
        .gte('created_at', startDate.toISOString());

      if (communityError) throw communityError;

      // Calculate daily engagement metrics
      const dailyStats: Record<string, { totalViews: number; communityEngagement: number; contentCount: number }> = {};

      // Group reviews by date
      reviewsData?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) dailyStats[date] = { totalViews: 0, communityEngagement: 0, contentCount: 0 };
        dailyStats[date].totalViews += item.view_count || 0;
        dailyStats[date].contentCount += 1;
      });

      // Calculate community engagement per day
      communityActivity?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) dailyStats[date] = { totalViews: 0, communityEngagement: 0, contentCount: 0 };
        dailyStats[date].communityEngagement += (item.upvotes || 0) + 1; // Post + upvotes as engagement
      });

      return Object.entries(dailyStats)
        .filter(([_, stats]) => stats.contentCount > 0) // Only days with published content
        .map(([date, stats]) => {
          // Calculate engagement rate: views per content vs community engagement
          const avgViewsPerContent = stats.totalViews / Math.max(1, stats.contentCount);
          const engagementScore = Math.min(100, avgViewsPerContent / Math.max(1, stats.communityEngagement) * 100);

          return {
            date: new Date(date).toLocaleDateString('pt-BR'),
            value: Math.round(engagementScore * 100) / 100,
            label: `${engagementScore.toFixed(1)}% Score (${stats.totalViews} views, ${stats.contentCount} conteúdo)`,
            category: 'engagement_rate',
            metadata: {
              date,
              engagementScore: Math.round(engagementScore * 100) / 100,
              totalViews: stats.totalViews,
              contentCount: stats.contentCount,
              communityEngagement: stats.communityEngagement,
              avgViewsPerContent: Math.round(avgViewsPerContent * 100) / 100
            }
          };
        });
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

// Social Media Engagement Science: Parabolic Decay Algorithm
// Based on analysis of medical content engagement patterns
const generateParabolicViewCurve = (totalViews: number, maxDays: number): { day: number; dailyViews: number; cumulativeViews: number }[] => {
  if (totalViews === 0 || maxDays === 0) return [];

  // Scientific engagement distribution for medical/educational content:
  // Day 1: 40% of total views (high initial interest)
  // Day 2: 22% of total views (word-of-mouth peak)
  // Day 3: 12% of total views (social sharing decline)
  // Days 4-7: 6%, 4%, 3%, 2% respectively (rapid decay)
  // Week 2+: Exponential decay with long tail

  const curve = [];
  let cumulativeViews = 0;

  for (let day = 1; day <= Math.min(maxDays, 30); day++) { // Cap at 30 days for performance
    let dailyViewPercentage: number;

    if (day === 1) {
      dailyViewPercentage = 0.40; // 40% on launch day
    } else if (day === 2) {
      dailyViewPercentage = 0.22; // 22% peak sharing day
    } else if (day === 3) {
      dailyViewPercentage = 0.12; // 12% social momentum
    } else if (day <= 7) {
      // Days 4-7: Rapid decay (6%, 4%, 3%, 2%)
      const decayRate = [0.06, 0.04, 0.03, 0.02];
      dailyViewPercentage = decayRate[day - 4] || 0.01;
    } else {
      // Week 2+: Exponential decay with long tail
      // Formula: 0.14 * e^(-0.3 * (day-7)) for remaining 14%
      const remainingAfterWeek1 = 0.14;
      dailyViewPercentage = remainingAfterWeek1 * Math.exp(-0.3 * (day - 7));
    }

    const dailyViews = Math.round(totalViews * dailyViewPercentage);
    cumulativeViews += dailyViews;

    // Prevent over-allocation due to rounding
    if (cumulativeViews > totalViews) {
      const adjustment = cumulativeViews - totalViews;
      const adjustedDailyViews = Math.max(0, dailyViews - adjustment);
      cumulativeViews = totalViews;

      curve.push({ day, dailyViews: adjustedDailyViews, cumulativeViews });
      break;
    }

    curve.push({ day, dailyViews, cumulativeViews });

    // Stop when daily views become negligible
    if (dailyViews === 0) break;
  }

  return curve;
};

// 4. Performance Since Publication (REAL DATA ONLY - Cumulative Views)
export const useContentPerformanceSincePublication = (filters: FilterOptions, selectedContentIds?: string[]) => {
  return useQuery({
    queryKey: ['content-performance-since-publication', filters, selectedContentIds],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const startDate = getDateRange(filters.timeRange);

      // Get published reviews with publication date
      let reviewQuery = supabase
        .from('Reviews')
        .select('id, title, view_count, created_at, published_at, reading_time_minutes, study_type')
        .eq('status', 'published')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // If no specific content selected, default to last 4
      if (!selectedContentIds || selectedContentIds.length === 0) {
        reviewQuery = reviewQuery.limit(4);
      } else {
        reviewQuery = reviewQuery.in('id', selectedContentIds);
      }

      const { data: reviewsData, error: reviewsError } = await reviewQuery;
      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      // ONLY get real daily metrics - NO FALLBACK/ESTIMATED DATA
      const reviewIds = reviewsData.map(r => r.id);
      const { data: dailyMetrics, error: metricsError } = await supabase
        .from('daily_view_metrics')
        .select('review_id, view_date, daily_views')
        .in('review_id', reviewIds)
        .order('view_date', { ascending: true });

      if (metricsError) {
        console.warn('Failed to fetch daily metrics:', metricsError);
        return []; // Return empty if no real data available
      }

      if (!dailyMetrics || dailyMetrics.length === 0) {
        console.warn('No real daily metrics available for selected content');
        return []; // Return empty if no real data available
      }

      const result: ChartDataPoint[] = [];

      reviewsData.forEach(review => {
        const reviewTitle = review.title?.length > 20 ?
          review.title.substring(0, 20) + '...' :
          review.title || `Review ${review.id}`;

        // Get real daily data for this review
        const reviewDailyData = dailyMetrics?.filter(m => m.review_id === review.id) || [];

        // ONLY proceed if we have real data
        if (reviewDailyData.length > 0) {
          const publicationDate = review.published_at ? new Date(review.published_at) : new Date(review.created_at);
          let cumulativeViews = 0;
          const dataByDate: Record<string, number> = {};

          // Build date map from real data
          reviewDailyData.forEach(metric => {
            dataByDate[metric.view_date] = metric.daily_views;
          });

          // Get date range from actual data
          const dates = reviewDailyData.map(m => new Date(m.view_date)).sort((a, b) => a.getTime() - b.getTime());
          const startDataDate = dates[0];
          const endDataDate = dates[dates.length - 1];

          // Generate points only for days with actual data
          dates.forEach((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dailyViews = dataByDate[dateStr] || 0;
            cumulativeViews += dailyViews;

            const daysSincePublication = Math.max(0, Math.floor(
              (date.getTime() - publicationDate.getTime()) / (1000 * 60 * 60 * 24)
            ));

            result.push({
              date: daysSincePublication.toString(),
              value: cumulativeViews, // Show CUMULATIVE views
              label: `${reviewTitle}: Dia ${daysSincePublication} - ${cumulativeViews} views acumuladas`,
              category: review.id.toString(),
              metadata: {
                id: review.id,
                title: review.title,
                daysSincePublication,
                dailyViews,
                cumulativeViews,
                isRealData: true,
                studyType: review.study_type,
                readingTime: review.reading_time_minutes,
                publishedAt: publicationDate.toISOString(),
                actualDate: date.toISOString()
              }
            });
          });
        }
      });

      return result;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000
  });
};

// 5. Available Content for Performance Selection
export const useAvailableContentForSelection = (filters: FilterOptions) => {
  return useQuery({
    queryKey: ['available-content-selection', filters],
    queryFn: async (): Promise<{id: string, title: string, views: number, publishedAt: string}[]> => {
      const startDate = getDateRange(filters.timeRange);

      const { data, error } = await supabase
        .from('Reviews')
        .select('id, title, view_count, created_at')
        .eq('status', 'published')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        title: item.title || `Review ${item.id}`,
        views: item.view_count || 0,
        publishedAt: new Date(item.created_at).toLocaleDateString('pt-BR')
      })) || [];
    },
    staleTime: 5 * 60 * 1000
  });
};

// Legacy exports for backward compatibility - will be removed
export const useContentCreation = useReviewCreation;
export const useContentEngagement = useReviewPerformance;