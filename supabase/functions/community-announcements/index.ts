// ABOUTME: Dedicated community announcements API Edge Function with comprehensive CRUD operations, bulk actions, and real-time support

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { authenticateRequest, requireRole } from '../_shared/auth.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

// Type definitions for announcement operations
interface AnnouncementRequest {
  action:
    | 'list'
    | 'get'
    | 'create'
    | 'update'
    | 'delete'
    | 'bulk_update'
    | 'bulk_delete'
    | 'publish'
    | 'unpublish'
    | 'feature'
    | 'unfeature';
  id?: string;
  ids?: string[];
  data?: AnnouncementData;
  filters?: AnnouncementFilters;
  pagination?: PaginationParams;
}

interface AnnouncementData {
  title?: string;
  content?: string;
  type?: 'announcement' | 'news' | 'changelog' | 'event';
  priority?: number;
  is_published?: boolean;
  is_featured?: boolean;
  published_at?: string;
  expires_at?: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface AnnouncementFilters {
  type?: string[];
  is_published?: boolean;
  is_featured?: boolean;
  priority_min?: number;
  priority_max?: number;
  search?: string;
  created_after?: string;
  created_before?: string;
  expires_after?: string;
  expires_before?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

serve(async (req: Request) => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    console.log(`[Community Announcements API] ${req.method} ${req.url}`);

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
    let requestData: AnnouncementRequest;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const searchParams = url.searchParams;

      requestData = {
        action: 'list',
        filters: parseFiltersFromQuery(searchParams),
        pagination: parsePaginationFromQuery(searchParams),
      };
    } else {
      requestData = (await req.json()) as AnnouncementRequest;
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
      'bulk_delete',
      'publish',
      'unpublish',
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
        result = await listAnnouncements(supabase, requestData.filters, requestData.pagination);
        break;

      case 'get':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement ID is required'));
        }
        result = await getAnnouncement(supabase, requestData.id);
        break;

      case 'create':
        result = await createAnnouncement(supabase, requestData.data!, user.id);
        break;

      case 'update':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement ID is required'));
        }
        result = await updateAnnouncement(supabase, requestData.id, requestData.data!, user.id);
        break;

      case 'delete':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement ID is required'));
        }
        result = await deleteAnnouncement(supabase, requestData.id);
        break;

      case 'bulk_update':
        if (!requestData.ids || !requestData.data) {
          return createErrorResponse(
            new Error('VALIDATION_FAILED: Announcement IDs and data are required')
          );
        }
        result = await bulkUpdateAnnouncements(
          supabase,
          requestData.ids,
          requestData.data,
          user.id
        );
        break;

      case 'bulk_delete':
        if (!requestData.ids) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement IDs are required'));
        }
        result = await bulkDeleteAnnouncements(supabase, requestData.ids);
        break;

      case 'publish':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement ID is required'));
        }
        result = await publishAnnouncement(supabase, requestData.id, user.id);
        break;

      case 'unpublish':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement ID is required'));
        }
        result = await unpublishAnnouncement(supabase, requestData.id, user.id);
        break;

      case 'feature':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement ID is required'));
        }
        result = await featureAnnouncement(supabase, requestData.id, user.id);
        break;

      case 'unfeature':
        if (!requestData.id) {
          return createErrorResponse(new Error('VALIDATION_FAILED: Announcement ID is required'));
        }
        result = await unfeatureAnnouncement(supabase, requestData.id, user.id);
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
    console.error('[Community Announcements API Error]:', error);
    return createErrorResponse(error);
  }
});

// =============================================================================
// Query Parameter Parsing Utilities
// =============================================================================

function parseFiltersFromQuery(searchParams: URLSearchParams): AnnouncementFilters {
  const filters: AnnouncementFilters = {};

  // Parse array filters
  if (searchParams.has('type')) {
    filters.type = searchParams.getAll('type');
  }

  // Parse boolean filters
  if (searchParams.has('is_published')) {
    filters.is_published = searchParams.get('is_published') === 'true';
  }

  if (searchParams.has('is_featured')) {
    filters.is_featured = searchParams.get('is_featured') === 'true';
  }

  // Parse numeric filters
  if (searchParams.has('priority_min')) {
    filters.priority_min = parseInt(searchParams.get('priority_min')!);
  }

  if (searchParams.has('priority_max')) {
    filters.priority_max = parseInt(searchParams.get('priority_max')!);
  }

  // Parse string filters
  if (searchParams.has('search')) {
    filters.search = searchParams.get('search')!;
  }

  // Parse date filters
  if (searchParams.has('created_after')) {
    filters.created_after = searchParams.get('created_after')!;
  }

  if (searchParams.has('created_before')) {
    filters.created_before = searchParams.get('created_before')!;
  }

  if (searchParams.has('expires_after')) {
    filters.expires_after = searchParams.get('expires_after')!;
  }

  if (searchParams.has('expires_before')) {
    filters.expires_before = searchParams.get('expires_before')!;
  }

  return filters;
}

function parsePaginationFromQuery(searchParams: URLSearchParams): PaginationParams {
  const pagination: PaginationParams = {};

  if (searchParams.has('page')) {
    pagination.page = parseInt(searchParams.get('page')!) || 1;
  }

  if (searchParams.has('limit')) {
    pagination.limit = Math.min(parseInt(searchParams.get('limit')!) || 20, 100); // Max 100 per page
  }

  if (searchParams.has('order_by')) {
    pagination.order_by = searchParams.get('order_by')!;
  }

  if (searchParams.has('order_direction')) {
    const direction = searchParams.get('order_direction')!;
    pagination.order_direction = direction === 'asc' ? 'asc' : 'desc';
  }

  return pagination;
}

// =============================================================================
// Core Announcement Operations
// =============================================================================

async function listAnnouncements(
  supabase: any,
  filters: AnnouncementFilters = {},
  pagination: PaginationParams = {}
): Promise<any> {
  let query = supabase.from('CommunityAnnouncements').select(`
      *,
      Practitioners!CommunityAnnouncements_created_by_fkey(
        id,
        email,
        full_name
      )
    `);

  // Apply filters
  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }

  if (filters.is_published !== undefined) {
    query = query.eq('is_published', filters.is_published);
  }

  if (filters.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }

  if (filters.priority_min !== undefined) {
    query = query.gte('priority', filters.priority_min);
  }

  if (filters.priority_max !== undefined) {
    query = query.lte('priority', filters.priority_max);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after);
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before);
  }

  if (filters.expires_after) {
    query = query.gte('expires_at', filters.expires_after);
  }

  if (filters.expires_before) {
    query = query.lte('expires_at', filters.expires_before);
  }

  // Apply ordering
  const orderBy = pagination.order_by || 'created_at';
  const orderDirection = pagination.order_direction || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });

  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const { data: announcements, error, count } = await query;

  if (error) throw error;

  // Calculate pagination metadata
  const totalPages = count ? Math.ceil(count / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    announcements,
    pagination: {
      current_page: page,
      per_page: limit,
      total_items: count,
      total_pages: totalPages,
      has_next: hasNext,
      has_previous: hasPrev,
    },
  };
}

async function getAnnouncement(supabase: any, id: string): Promise<any> {
  const { data: announcement, error } = await supabase
    .from('CommunityAnnouncements')
    .select(
      `
      *,
      Practitioners!CommunityAnnouncements_created_by_fkey(
        id,
        email,
        full_name
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!announcement) throw new Error('Announcement not found');

  return { announcement };
}

async function createAnnouncement(
  supabase: any,
  data: AnnouncementData,
  userId: string
): Promise<any> {
  // Validate required fields
  if (!data.title || !data.content) {
    throw new Error('VALIDATION_FAILED: Title and content are required');
  }

  // Set defaults and prepare data
  const announcementData = {
    title: data.title,
    content: data.content,
    type: data.type || 'announcement',
    priority: data.priority || 0,
    is_published: data.is_published || false,
    is_featured: data.is_featured || false,
    published_at:
      data.is_published && !data.published_at ? new Date().toISOString() : data.published_at,
    expires_at: data.expires_at || null,
    image_url: data.image_url || null,
    link_url: data.link_url || null,
    link_text: data.link_text || null,
    tags: data.tags || [],
    metadata: data.metadata || {},
    created_by: userId,
  };

  const { data: announcement, error } = await supabase
    .from('CommunityAnnouncements')
    .insert(announcementData)
    .select(
      `
      *,
      Practitioners!CommunityAnnouncements_created_by_fkey(
        id,
        email,
        full_name
      )
    `
    )
    .single();

  if (error) throw error;

  return { announcement, message: 'Announcement created successfully' };
}

async function updateAnnouncement(
  supabase: any,
  id: string,
  data: AnnouncementData,
  userId: string
): Promise<any> {
  // Check if announcement exists
  const { data: existingAnnouncement } = await supabase
    .from('CommunityAnnouncements')
    .select('id')
    .eq('id', id)
    .single();

  if (!existingAnnouncement) {
    throw new Error('Announcement not found');
  }

  // Auto-set published_at if publishing for the first time
  if (data.is_published && !data.published_at) {
    data.published_at = new Date().toISOString();
  }

  const { data: announcement, error } = await supabase
    .from('CommunityAnnouncements')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      `
      *,
      Practitioners!CommunityAnnouncements_created_by_fkey(
        id,
        email,
        full_name
      )
    `
    )
    .single();

  if (error) throw error;

  return { announcement, message: 'Announcement updated successfully' };
}

async function deleteAnnouncement(supabase: any, id: string): Promise<any> {
  const { error } = await supabase.from('CommunityAnnouncements').delete().eq('id', id);

  if (error) throw error;

  return { message: 'Announcement deleted successfully' };
}

async function bulkUpdateAnnouncements(
  supabase: any,
  ids: string[],
  data: AnnouncementData,
  userId: string
): Promise<any> {
  // Auto-set published_at if publishing announcements
  if (data.is_published && !data.published_at) {
    data.published_at = new Date().toISOString();
  }

  const { data: announcements, error } = await supabase
    .from('CommunityAnnouncements')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)
    .select();

  if (error) throw error;

  return {
    announcements,
    updated_count: announcements?.length || 0,
    message: `${announcements?.length || 0} announcements updated successfully`,
  };
}

async function bulkDeleteAnnouncements(supabase: any, ids: string[]): Promise<any> {
  const { data: deletedAnnouncements, error } = await supabase
    .from('CommunityAnnouncements')
    .delete()
    .in('id', ids)
    .select('id');

  if (error) throw error;

  return {
    deleted_count: deletedAnnouncements?.length || 0,
    message: `${deletedAnnouncements?.length || 0} announcements deleted successfully`,
  };
}

async function publishAnnouncement(supabase: any, id: string, userId: string): Promise<any> {
  const { data: announcement, error } = await supabase
    .from('CommunityAnnouncements')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!announcement) throw new Error('Announcement not found');

  return { announcement, message: 'Announcement published successfully' };
}

async function unpublishAnnouncement(supabase: any, id: string, userId: string): Promise<any> {
  const { data: announcement, error } = await supabase
    .from('CommunityAnnouncements')
    .update({
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!announcement) throw new Error('Announcement not found');

  return { announcement, message: 'Announcement unpublished successfully' };
}

async function featureAnnouncement(supabase: any, id: string, userId: string): Promise<any> {
  const { data: announcement, error } = await supabase
    .from('CommunityAnnouncements')
    .update({
      is_featured: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!announcement) throw new Error('Announcement not found');

  return { announcement, message: 'Announcement featured successfully' };
}

async function unfeatureAnnouncement(supabase: any, id: string, userId: string): Promise<any> {
  const { data: announcement, error } = await supabase
    .from('CommunityAnnouncements')
    .update({
      is_featured: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!announcement) throw new Error('Announcement not found');

  return { announcement, message: 'Announcement unfeatured successfully' };
}
