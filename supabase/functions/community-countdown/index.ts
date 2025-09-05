// ABOUTME: Dedicated community countdown API Edge Function with real-time countdown calculations, timezone support, and event management

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { authenticateRequest, requireRole } from '../_shared/auth.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

// Type definitions for countdown operations
interface CountdownRequest {
  action:
    | 'list'
    | 'get'
    | 'create'
    | 'update'
    | 'delete'
    | 'calculate'
    | 'bulk_update'
    | 'activate'
    | 'deactivate'
    | 'feature'
    | 'unfeature';
  id?: string;
  ids?: string[];
  data?: CountdownData;
  filters?: CountdownFilters;
  timezone?: string;
  calculation_type?: 'real_time' | 'to_date' | 'elapsed';
}

interface CountdownData {
  title?: string;
  description?: string;
  target_date?: string;
  timezone?: string;
  is_active?: boolean;
  is_featured?: boolean;
  display_format?: 'days_hours_minutes' | 'days_only' | 'hours_minutes' | 'full' | 'compact';
  completed_message?: string;
  completed_action?: 'hide' | 'show_message' | 'redirect' | 'custom';
  redirect_url?: string;
  auto_hide_after_completion?: boolean;
  show_seconds?: boolean;
  custom_labels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
  metadata?: Record<string, any>;
}

interface CountdownFilters {
  is_active?: boolean;
  is_featured?: boolean;
  is_completed?: boolean;
  target_after?: string;
  target_before?: string;
  search?: string;
}

interface CountdownCalculation {
  total_seconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  is_completed: boolean;
  formatted_display: string;
  progress_percentage?: number;
}

serve(async (req: Request) => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    console.log(`[Community Countdown API] ${req.method} ${req.url}`);

    // STEP 2: Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 3: Authentication (required for all operations)
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return createErrorResponse(new Error(`UNAUTHORIZED: ${authResult.error}`));
    }

    const user = authResult.user;
    console.log(`[Auth] User authenticated: ${user.id}`);

    // STEP 4: Input Parsing & Validation
    let requestData: CountdownRequest;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const searchParams = url.searchParams;

      requestData = {
        action: (searchParams.get('action') as any) || 'list',
        id: searchParams.get('id') || undefined,
        filters: parseFiltersFromQuery(searchParams),
        timezone: searchParams.get('timezone') || 'UTC',
        calculation_type: (searchParams.get('calculation_type') as any) || 'real_time',
      };
    } else {
      requestData = (await req.json()) as CountdownRequest;
    }

    if (!requestData.action) {
      return createErrorResponse(new Error('VALIDATION_FAILED: Missing required field: action'));
    }

    console.log(`[Request] Processing action: ${requestData.action}`);

    // STEP 5: Role-based Authorization
    const isWriteOperation = [
      'create',
      'update',
      'delete',
      'bulk_update',
      'activate',
      'deactivate',
      'feature',
      'unfeature',
    ].includes(requestData.action);

    if (isWriteOperation) {
      // Check admin role for write operations
      const { data: userClaims } = await supabase
        .from('Practitioners')
        .select('role')
        .eq('id', user.id)
        .single();

      const roleCheck = requireRole({ app_metadata: { role: userClaims?.role } }, ['admin']);
      if (!roleCheck.success) {
        return createErrorResponse(new Error(`FORBIDDEN: ${roleCheck.error}`));
      }
    }

    // STEP 6: Core Business Logic Execution
    let result: any;

    switch (requestData.action) {
      case 'list':
        result = await listCountdowns(supabase, requestData.filters, requestData.timezone);
        break;

      case 'get':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await getCountdown(supabase, requestData.id, requestData.timezone);
        break;

      case 'create':
        result = await createCountdown(supabase, requestData.data!, user.id);
        break;

      case 'update':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await updateCountdown(supabase, requestData.id, requestData.data!, user.id);
        break;

      case 'delete':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await deleteCountdown(supabase, requestData.id);
        break;

      case 'calculate':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await calculateCountdown(
          supabase,
          requestData.id,
          requestData.timezone,
          requestData.calculation_type
        );
        break;

      case 'bulk_update':
        if (!requestData.ids || !requestData.data) {
          return createErrorResponse(
            new Error('VALIDATION_FAILED: Countdown IDs and data are required')
          );
        }
        result = await bulkUpdateCountdowns(supabase, requestData.ids, requestData.data, user.id);
        break;

      case 'activate':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await activateCountdown(supabase, requestData.id, user.id);
        break;

      case 'deactivate':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await deactivateCountdown(supabase, requestData.id, user.id);
        break;

      case 'feature':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await featureCountdown(supabase, requestData.id, user.id);
        break;

      case 'unfeature':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Countdown ID is required'));
        }
        result = await unfeatureCountdown(supabase, requestData.id, user.id);
        break;

      default:
        return createErrorResponse(
          new Error(`VALIDATION_FAILED: Unsupported action: ${requestData.action}`)
        );
    }

    console.log(`[Success] ${requestData.action} completed successfully`);

    // STEP 7: Standardized Success Response
    return createSuccessResponse(result);
  } catch (error) {
    console.error('[Community Countdown API Error]:', error);
    return createErrorResponse(error);
  }
});

// =============================================================================
// Query Parameter Parsing Utilities
// =============================================================================

function parseFiltersFromQuery(searchParams: URLSearchParams): CountdownFilters {
  const filters: CountdownFilters = {};

  if (searchParams.has('is_active')) {
    filters.is_active = searchParams.get('is_active') === 'true';
  }

  if (searchParams.has('is_featured')) {
    filters.is_featured = searchParams.get('is_featured') === 'true';
  }

  if (searchParams.has('is_completed')) {
    filters.is_completed = searchParams.get('is_completed') === 'true';
  }

  if (searchParams.has('target_after')) {
    filters.target_after = searchParams.get('target_after')!;
  }

  if (searchParams.has('target_before')) {
    filters.target_before = searchParams.get('target_before')!;
  }

  if (searchParams.has('search')) {
    filters.search = searchParams.get('search')!;
  }

  return filters;
}

// =============================================================================
// Countdown Calculation Utilities
// =============================================================================

function calculateCountdownDetails(
  targetDate: string,
  timezone: string = 'UTC',
  startDate?: string
): CountdownCalculation {
  const now = new Date();
  const target = new Date(targetDate);
  const start = startDate ? new Date(startDate) : null;

  // Calculate time difference in milliseconds
  const timeDiff = target.getTime() - now.getTime();
  const isCompleted = timeDiff <= 0;

  // Calculate absolute values for display
  const totalSeconds = Math.abs(Math.floor(timeDiff / 1000));
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  // Calculate progress percentage if start date is provided
  let progressPercentage: number | undefined;
  if (start) {
    const totalDuration = target.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  // Format display string
  let formattedDisplay = '';
  if (isCompleted) {
    formattedDisplay = 'Completed';
  } else {
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    formattedDisplay = parts.join(' ');
  }

  return {
    total_seconds: totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    is_completed: isCompleted,
    formatted_display: formattedDisplay,
    progress_percentage: progressPercentage,
  };
}

function formatCountdownDisplay(
  calculation: CountdownCalculation,
  format: string = 'days_hours_minutes',
  customLabels?: CountdownData['custom_labels'],
  showSeconds: boolean = false
): string {
  if (calculation.is_completed) {
    return 'Completed';
  }

  const labels = {
    days: customLabels?.days || 'days',
    hours: customLabels?.hours || 'hours',
    minutes: customLabels?.minutes || 'minutes',
    seconds: customLabels?.seconds || 'seconds',
  };

  switch (format) {
    case 'days_only':
      return `${calculation.days} ${labels.days}`;

    case 'hours_minutes':
      const totalHours = calculation.days * 24 + calculation.hours;
      return `${totalHours} ${labels.hours} ${calculation.minutes} ${labels.minutes}`;

    case 'full':
      const parts = [];
      if (calculation.days > 0) parts.push(`${calculation.days} ${labels.days}`);
      if (calculation.hours > 0) parts.push(`${calculation.hours} ${labels.hours}`);
      if (calculation.minutes > 0) parts.push(`${calculation.minutes} ${labels.minutes}`);
      if (showSeconds && (calculation.seconds > 0 || parts.length === 0)) {
        parts.push(`${calculation.seconds} ${labels.seconds}`);
      }
      return parts.join(', ');

    case 'compact':
      return `${calculation.days}:${calculation.hours.toString().padStart(2, '0')}:${calculation.minutes.toString().padStart(2, '0')}${showSeconds ? ':' + calculation.seconds.toString().padStart(2, '0') : ''}`;

    case 'days_hours_minutes':
    default:
      const result = [];
      if (calculation.days > 0) result.push(`${calculation.days} ${labels.days}`);
      if (calculation.hours > 0) result.push(`${calculation.hours} ${labels.hours}`);
      if (calculation.minutes > 0) result.push(`${calculation.minutes} ${labels.minutes}`);
      return result.join(' ') || `0 ${labels.minutes}`;
  }
}

// =============================================================================
// Core Countdown Operations
// =============================================================================

async function listCountdowns(
  supabase: any,
  filters: CountdownFilters = {},
  timezone: string = 'UTC'
): Promise<any> {
  let query = supabase.from('CommunityCountdowns').select(`
      *,
      Practitioners!CommunityCountdowns_created_by_fkey(
        id,
        email,
        full_name
      )
    `);

  // Apply filters
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }

  if (filters.target_after) {
    query = query.gte('target_date', filters.target_after);
  }

  if (filters.target_before) {
    query = query.lte('target_date', filters.target_before);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Order by target date
  query = query.order('target_date', { ascending: true });

  const { data: countdowns, error } = await query;

  if (error) throw error;

  // Calculate countdown details for each countdown
  const countdownsWithCalculations =
    countdowns?.map(countdown => {
      const calculation = calculateCountdownDetails(countdown.target_date, timezone);
      const formattedDisplay = formatCountdownDisplay(
        calculation,
        countdown.display_format,
        countdown.custom_labels,
        countdown.show_seconds
      );

      return {
        ...countdown,
        calculation,
        formatted_display: formattedDisplay,
        is_completed: calculation.is_completed,
      };
    }) || [];

  // Apply completed filter if specified
  let filteredCountdowns = countdownsWithCalculations;
  if (filters.is_completed !== undefined) {
    filteredCountdowns = countdownsWithCalculations.filter(
      countdown => countdown.is_completed === filters.is_completed
    );
  }

  return {
    countdowns: filteredCountdowns,
    total_count: filteredCountdowns.length,
    active_count: filteredCountdowns.filter(c => c.is_active && !c.is_completed).length,
    completed_count: filteredCountdowns.filter(c => c.is_completed).length,
  };
}

async function getCountdown(supabase: any, id: string, timezone: string = 'UTC'): Promise<any> {
  const { data: countdown, error } = await supabase
    .from('CommunityCountdowns')
    .select(
      `
      *,
      Practitioners!CommunityCountdowns_created_by_fkey(
        id,
        email,
        full_name
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!countdown) throw new Error('Countdown not found');

  // Calculate countdown details
  const calculation = calculateCountdownDetails(countdown.target_date, timezone);
  const formattedDisplay = formatCountdownDisplay(
    calculation,
    countdown.display_format,
    countdown.custom_labels,
    countdown.show_seconds
  );

  return {
    countdown: {
      ...countdown,
      calculation,
      formatted_display: formattedDisplay,
      is_completed: calculation.is_completed,
    },
  };
}

async function createCountdown(supabase: any, data: CountdownData, userId: string): Promise<any> {
  // Validate required fields
  if (!data.title || !data.target_date) {
    throw new Error('VALIDATION_FAILED: Title and target date are required');
  }

  // Validate target date is in the future
  const targetDate = new Date(data.target_date);
  if (targetDate <= new Date()) {
    throw new Error('VALIDATION_FAILED: Target date must be in the future');
  }

  // Set defaults and prepare data
  const countdownData = {
    title: data.title,
    description: data.description || null,
    target_date: data.target_date,
    timezone: data.timezone || 'UTC',
    is_active: data.is_active !== undefined ? data.is_active : true,
    is_featured: data.is_featured || false,
    display_format: data.display_format || 'days_hours_minutes',
    completed_message: data.completed_message || null,
    completed_action: data.completed_action || 'show_message',
    redirect_url: data.redirect_url || null,
    auto_hide_after_completion: data.auto_hide_after_completion || false,
    show_seconds: data.show_seconds || false,
    custom_labels: data.custom_labels || null,
    metadata: data.metadata || {},
    created_by: userId,
  };

  const { data: countdown, error } = await supabase
    .from('CommunityCountdowns')
    .insert(countdownData)
    .select(
      `
      *,
      Practitioners!CommunityCountdowns_created_by_fkey(
        id,
        email,
        full_name
      )
    `
    )
    .single();

  if (error) throw error;

  // Calculate initial countdown details
  const calculation = calculateCountdownDetails(countdown.target_date, countdown.timezone);
  const formattedDisplay = formatCountdownDisplay(
    calculation,
    countdown.display_format,
    countdown.custom_labels,
    countdown.show_seconds
  );

  return {
    countdown: {
      ...countdown,
      calculation,
      formatted_display: formattedDisplay,
      is_completed: calculation.is_completed,
    },
    message: 'Countdown created successfully',
  };
}

async function updateCountdown(
  supabase: any,
  id: string,
  data: CountdownData,
  userId: string
): Promise<any> {
  // Check if countdown exists
  const { data: existingCountdown } = await supabase
    .from('CommunityCountdowns')
    .select('id, target_date')
    .eq('id', id)
    .single();

  if (!existingCountdown) {
    throw new Error('Countdown not found');
  }

  // Validate target date if being updated
  if (data.target_date) {
    const targetDate = new Date(data.target_date);
    if (targetDate <= new Date()) {
      throw new Error('VALIDATION_FAILED: Target date must be in the future');
    }
  }

  const { data: countdown, error } = await supabase
    .from('CommunityCountdowns')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      `
      *,
      Practitioners!CommunityCountdowns_created_by_fkey(
        id,
        email,
        full_name
      )
    `
    )
    .single();

  if (error) throw error;

  // Calculate updated countdown details
  const calculation = calculateCountdownDetails(countdown.target_date, countdown.timezone);
  const formattedDisplay = formatCountdownDisplay(
    calculation,
    countdown.display_format,
    countdown.custom_labels,
    countdown.show_seconds
  );

  return {
    countdown: {
      ...countdown,
      calculation,
      formatted_display: formattedDisplay,
      is_completed: calculation.is_completed,
    },
    message: 'Countdown updated successfully',
  };
}

async function deleteCountdown(supabase: any, id: string): Promise<any> {
  const { error } = await supabase.from('CommunityCountdowns').delete().eq('id', id);

  if (error) throw error;

  return { message: 'Countdown deleted successfully' };
}

async function calculateCountdown(
  supabase: any,
  id: string,
  timezone: string = 'UTC',
  calculationType: string = 'real_time'
): Promise<any> {
  const { data: countdown, error } = await supabase
    .from('CommunityCountdowns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!countdown) throw new Error('Countdown not found');

  const calculation = calculateCountdownDetails(countdown.target_date, timezone);
  const formattedDisplay = formatCountdownDisplay(
    calculation,
    countdown.display_format,
    countdown.custom_labels,
    countdown.show_seconds
  );

  return {
    id,
    calculation,
    formatted_display: formattedDisplay,
    timezone,
    calculation_type: calculationType,
    timestamp: new Date().toISOString(),
  };
}

async function bulkUpdateCountdowns(
  supabase: any,
  ids: string[],
  data: CountdownData,
  userId: string
): Promise<any> {
  const { data: countdowns, error } = await supabase
    .from('CommunityCountdowns')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)
    .select();

  if (error) throw error;

  return {
    countdowns,
    updated_count: countdowns?.length || 0,
    message: `${countdowns?.length || 0} countdowns updated successfully`,
  };
}

async function activateCountdown(supabase: any, id: string, userId: string): Promise<any> {
  return updateCountdown(supabase, id, { is_active: true }, userId);
}

async function deactivateCountdown(supabase: any, id: string, userId: string): Promise<any> {
  return updateCountdown(supabase, id, { is_active: false }, userId);
}

async function featureCountdown(supabase: any, id: string, userId: string): Promise<any> {
  return updateCountdown(supabase, id, { is_featured: true }, userId);
}

async function unfeatureCountdown(supabase: any, id: string, userId: string): Promise<any> {
  return updateCountdown(supabase, id, { is_featured: false }, userId);
}
