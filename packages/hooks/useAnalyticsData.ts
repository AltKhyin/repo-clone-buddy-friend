// ABOUTME: TanStack Query hooks for fetching analytics data from production database sources

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { AnalyticsQuery, ChartDataPoint } from '@/types/analytics';
import { getDataSourceById } from '@/config/analyticsDataSources';

// Build SQL query from analytics query configuration
const buildAnalyticsQuery = (query: AnalyticsQuery): string => {
  const dataSource = getDataSourceById(query.dataSourceId);
  if (!dataSource) {
    throw new Error(`Data source not found: ${query.dataSourceId}`);
  }

  const table = `"${dataSource.table}"`;

  // Build SELECT clause with aggregations
  const selectFields = query.fields.map(field => {
    const aggregation = query.aggregations?.[field];
    if (aggregation && aggregation !== 'none') {
      return `${aggregation}(${field}) as ${field}`;
    }
    return field;
  }).join(', ');

  // Base query
  let sql = `SELECT ${selectFields} FROM ${table}`;

  // Add WHERE conditions
  const conditions: string[] = [];

  // Date range filter
  if (query.dateRange && dataSource.dateField) {
    conditions.push(`${dataSource.dateField} >= '${query.dateRange.start.toISOString()}'`);
    conditions.push(`${dataSource.dateField} <= '${query.dateRange.end.toISOString()}'`);
  }

  // Custom filters
  if (query.filters) {
    Object.entries(query.filters).forEach(([field, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'string') {
          conditions.push(`${field} = '${value}'`);
        } else {
          conditions.push(`${field} = ${value}`);
        }
      }
    });
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Add GROUP BY for aggregations
  const nonAggregatedFields = query.fields.filter(field =>
    !query.aggregations?.[field] || query.aggregations[field] === 'none'
  );

  if (nonAggregatedFields.length > 0 && Object.values(query.aggregations || {}).some(agg => agg && agg !== 'none')) {
    sql += ` GROUP BY ${nonAggregatedFields.join(', ')}`;
  }

  // Add ORDER BY
  if (query.orderBy) {
    sql += ` ORDER BY ${query.orderBy} ${query.orderDirection || 'DESC'}`;
  } else if (dataSource.defaultOrderBy) {
    sql += ` ORDER BY ${dataSource.defaultOrderBy} DESC`;
  }

  // Add LIMIT
  if (query.limit) {
    sql += ` LIMIT ${query.limit}`;
  }

  return sql;
};

// Hook for fetching analytics data
export const useAnalyticsData = (query: AnalyticsQuery, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics-data', query],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      console.log('🔍 Fetching analytics data:', query);

      try {
        const sql = buildAnalyticsQuery(query);
        console.log('📊 Generated SQL:', sql);

        const { data, error } = await supabase.rpc('execute_raw_sql', {
          sql_query: sql
        });

        if (error) {
          console.error('❌ Analytics query error:', error);
          throw new Error(`Analytics query failed: ${error.message}`);
        }

        // Extract data from the function result format
        const rawData = data?.[0]?.result || [];

        // Transform data to ensure proper types
        const transformedData = (rawData || []).map((row: any) => {
          const transformed: ChartDataPoint = {};
          Object.entries(row).forEach(([key, value]) => {
            // Convert date strings to Date objects
            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              transformed[key] = new Date(value);
            } else {
              transformed[key] = value as string | number | null;
            }
          });
          return transformed;
        });

        console.log('✅ Analytics data fetched:', {
          rowCount: transformedData.length,
          sampleRow: transformedData[0]
        });

        return transformedData;
      } catch (error) {
        console.error('❌ Analytics data fetch failed:', error);
        throw error;
      }
    },
    enabled: enabled && !!query.dataSourceId && query.fields.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.error('Analytics query retry:', failureCount, error);
      return failureCount < 2;
    }
  });
};

// Simplified hook for common time-series data
export const useTimeSeriesData = (
  dataSourceId: string,
  valueField: string,
  aggregation: string = 'count',
  days: number = 30
) => {
  const dataSource = getDataSourceById(dataSourceId);

  const query: AnalyticsQuery = {
    dataSourceId,
    fields: [dataSource?.dateField || 'created_at', valueField],
    aggregations: {
      [valueField]: aggregation
    },
    dateRange: {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    orderBy: dataSource?.dateField || 'created_at',
    orderDirection: 'asc'
  };

  return useAnalyticsData(query);
};

// Hook for getting data source preview (first 10 rows)
export const useDataSourcePreview = (dataSourceId: string) => {
  const dataSource = getDataSourceById(dataSourceId);

  const query: AnalyticsQuery = {
    dataSourceId,
    fields: dataSource?.fields.slice(0, 5).map(f => f.key) || [],
    limit: 10,
    orderBy: dataSource?.dateField || dataSource?.defaultOrderBy,
    orderDirection: 'desc'
  };

  return useAnalyticsData(query, !!dataSourceId);
};