// ABOUTME: TypeScript types for analytics dashboard configuration and data structures

import { z } from 'zod';
import { ChartType } from '@/config/analyticsDataSources';

// Chart configuration schema for validation
export const chartConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Chart name is required'),
  description: z.string().optional(),
  chart_type: z.enum(['line', 'bar', 'area', 'scatter', 'pie']),

  // Data source configuration
  data_source_id: z.string().min(1, 'Data source is required'),
  x_axis_field: z.string().min(1, 'X-axis field is required'),
  y_axis_field: z.string().min(1, 'Y-axis field is required'),
  y_axis_aggregation: z.string().optional(),

  // Optional secondary Y-axis for mixed charts
  y2_axis_field: z.string().optional(),
  y2_axis_aggregation: z.string().optional(),
  y2_chart_type: z.enum(['line', 'bar', 'area', 'scatter']).optional(),

  // Filtering and date range
  date_range_days: z.number().min(1).max(365).default(30),
  filters: z.record(z.unknown()).default({}),

  // Styling and display
  colors: z.record(z.string()).default({}),
  chart_options: z.record(z.unknown()).default({}),

  // Dashboard positioning
  position_x: z.number().min(0).default(0),
  position_y: z.number().min(0).default(0),
  width: z.number().min(1).max(12).default(6),
  height: z.number().min(1).max(12).default(4),
});

export type ChartConfig = z.infer<typeof chartConfigSchema>;

// Database table type (includes metadata fields)
export interface ChartConfigDB extends ChartConfig {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Chart data point structure for rendering
export interface ChartDataPoint {
  [key: string]: string | number | Date | null;
}

// Analytics query parameters
export interface AnalyticsQuery {
  dataSourceId: string;
  fields: string[];
  aggregations?: Record<string, string>; // field -> aggregation type
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
}

// Chart rendering configuration
export interface ChartRenderConfig {
  type: ChartType;
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  y2AxisKey?: string;
  y2ChartType?: ChartType;
  colors: Record<string, string>;
  options: Record<string, unknown>;
  title?: string;
  description?: string;
}

// Dashboard layout item
export interface DashboardItem {
  id: string;
  config: ChartConfig;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Chart creation form data
export interface ChartFormData {
  name: string;
  description?: string;
  chart_type: ChartType;
  data_source_id: string;
  x_axis_field: string;
  y_axis_field: string;
  y_axis_aggregation?: string;
  y2_axis_field?: string;
  y2_axis_aggregation?: string;
  y2_chart_type?: ChartType;
  date_range_days: number;
  filters: Record<string, unknown>;
  colors: Record<string, string>;
  chart_options: Record<string, unknown>;
}

// Available aggregation functions
export const aggregationTypes = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'first', label: 'First Value' },
  { value: 'last', label: 'Last Value' },
] as const;

// Color palettes for charts
export const chartColorPalettes = {
  default: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'],
  business: ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea'],
  pastel: ['#fecaca', '#fed7d7', '#fde68a', '#d1fae5', '#dbeafe'],
  dark: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6'],
} as const;

export type ColorPalette = keyof typeof chartColorPalettes;

// Chart size presets
export const chartSizePresets = {
  small: { width: 4, height: 3 },
  medium: { width: 6, height: 4 },
  large: { width: 8, height: 5 },
  wide: { width: 12, height: 4 },
  tall: { width: 6, height: 8 },
} as const;

export type ChartSizePreset = keyof typeof chartSizePresets;