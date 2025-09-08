// ABOUTME: Unified notification management Edge Function for all notification operations with proper security and validation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface CreateNotificationPayload {
  recipient_id: string;
  type: 'comment_reply' | 'post_like' | 'comment_like' | 'new_review' | 'admin_custom';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

interface NotificationOperation {
  operation: 'create' | 'list' | 'count' | 'mark_read' | 'mark_all_read' | 'delete';
  notification_id?: string;
  notification_ids?: string[];
  recipient_id?: string;
  type?: string;
  title?: string;
  message?: string;
  metadata?: Record<string, any>;
  page?: number;
  limit?: number;
  include_read?: boolean;
  type_filter?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let body: NotificationOperation = {};
    
    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      body = {
        operation: url.searchParams.get('operation') as any || 'list',
        page: parseInt(url.searchParams.get('page') || '0'),
        limit: parseInt(url.searchParams.get('limit') || '20'),
        include_read: url.searchParams.get('include_read') === 'true',
        type_filter: url.searchParams.get('type_filter') || undefined
      };
    } else if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (error) {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid JSON in request body' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Validate operation
    if (!body.operation) {
      return new Response(
        JSON.stringify({ error: { message: 'Operation is required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result;

    switch (body.operation) {
      case 'create':
        result = await createNotification(supabase, body, user.id);
        break;
      
      case 'list':
        result = await getUserNotifications(supabase, user.id, body);
        break;
      
      case 'count':
        result = await getNotificationCount(supabase, user.id);
        break;
      
      case 'mark_read':
        if (!body.notification_id && !body.notification_ids) {
          throw new Error('notification_id or notification_ids is required for mark_read operation');
        }
        result = await markNotificationRead(supabase, body, user.id);
        break;
      
      case 'mark_all_read':
        result = await markAllNotificationsRead(supabase, user.id);
        break;
      
      case 'delete':
        if (!body.notification_id && !body.notification_ids) {
          throw new Error('notification_id or notification_ids is required for delete operation');
        }
        result = await deleteNotification(supabase, body, user.id);
        break;
      
      default:
        throw new Error(`Unknown operation: ${body.operation}`);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in manage-notifications:', error)
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Internal server error' } }),
      { status: error.message?.includes('Unauthorized') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Create notification function
async function createNotification(supabase: any, body: NotificationOperation, requestUserId: string) {
  console.log('Creating notification:', { 
    type: body.type, 
    recipient_id: body.recipient_id, 
    requestUserId,
    title: body.title 
  });

  // Validate required fields for creation
  if (!body.recipient_id || !body.type || !body.title || !body.message) {
    throw new Error('recipient_id, type, title, and message are required for creating notification');
  }

  // Validate notification type
  const validTypes = ['comment_reply', 'post_like', 'comment_like', 'new_review', 'admin_custom'];
  if (!validTypes.includes(body.type)) {
    throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
  }

  // For admin_custom notifications, verify the user has admin role
  if (body.type === 'admin_custom') {
    const { data: practitioner, error: practitionerError } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', requestUserId)
      .single();

    if (practitionerError || !practitioner) {
      console.error('Failed to fetch practitioner for admin check:', practitionerError);
      throw new Error('Unauthorized: User not found');
    }

    if (practitioner.role !== 'admin') {
      console.error('Non-admin user attempting to create admin notification:', { 
        userId: requestUserId, 
        role: practitioner.role 
      });
      throw new Error('Unauthorized: Admin role required for admin_custom notifications');
    }
  }

  // Prevent self-notifications (except for admin_custom and new_review)
  if (body.recipient_id === requestUserId && !['admin_custom', 'new_review'].includes(body.type)) {
    return { success: true, message: 'Skipped self-notification' };
  }

  // Create notification
  const { data, error } = await supabase
    .from('Notifications')
    .insert({
      practitioner_id: body.recipient_id,
      type: body.type,
      title: body.title,
      message: body.message,
      metadata: body.metadata || {},
      is_read: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }

  return { success: true, data };
}

// Get user notifications with pagination
async function getUserNotifications(supabase: any, userId: string, options: NotificationOperation) {
  const page = options.page || 0;
  const limit = options.limit || 20;
  const offset = page * limit;

  // Build query
  let query = supabase
    .from('Notifications')
    .select('*')
    .eq('practitioner_id', userId);

  // Add type filter if specified
  if (options.type_filter) {
    query = query.eq('type', options.type_filter);
  }

  // Add read filter if specified
  if (options.include_read === false) {
    query = query.eq('is_read', false);
  }

  // Get notifications with pagination
  const { data: notifications, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }

  // Get total count
  let totalCountQuery = supabase
    .from('Notifications')
    .select('*', { count: 'exact', head: true })
    .eq('practitioner_id', userId);

  if (options.type_filter) {
    totalCountQuery = totalCountQuery.eq('type', options.type_filter);
  }

  const { count: totalCount, error: totalCountError } = await totalCountQuery;

  if (totalCountError) {
    console.error('Error counting total notifications:', totalCountError);
  }

  // Get unread count
  const { count: unreadCount, error: countError } = await supabase
    .from('Notifications')
    .select('*', { count: 'exact', head: true })
    .eq('practitioner_id', userId)
    .eq('is_read', false);

  if (countError) {
    console.error('Error counting unread notifications:', countError);
  }

  // Check if there are more notifications
  const hasMore = notifications && notifications.length === limit;

  return {
    notifications: notifications || [],
    pagination: {
      page,
      hasMore: hasMore || false,
      total: totalCount || 0,
      unread_count: unreadCount || 0
    }
  };
}

// Get notification count only
async function getNotificationCount(supabase: any, userId: string) {
  // Get total count
  const { count: totalCount, error: totalError } = await supabase
    .from('Notifications')
    .select('*', { count: 'exact', head: true })
    .eq('practitioner_id', userId);

  if (totalError) {
    console.error('Error counting total notifications:', totalError);
    throw new Error('Failed to count total notifications');
  }

  // Get unread count
  const { count: unreadCount, error: unreadError } = await supabase
    .from('Notifications')
    .select('*', { count: 'exact', head: true })
    .eq('practitioner_id', userId)
    .eq('is_read', false);

  if (unreadError) {
    console.error('Error counting unread notifications:', unreadError);
    throw new Error('Failed to count unread notifications');
  }

  return {
    unread_count: unreadCount || 0,
    total_count: totalCount || 0
  };
}

// Mark notification(s) as read
async function markNotificationRead(supabase: any, options: NotificationOperation, userId: string) {
  const ids = options.notification_ids || (options.notification_id ? [options.notification_id] : []);
  
  if (ids.length === 0) {
    throw new Error('No notification IDs provided');
  }

  const { data, error } = await supabase
    .from('Notifications')
    .update({ is_read: true })
    .in('id', ids)
    .eq('practitioner_id', userId) // Ensure user can only mark their own notifications
    .select();

  if (error) {
    console.error('Error marking notifications as read:', error);
    throw new Error('Failed to mark notifications as read');
  }

  return { success: true, data, updated_count: data?.length || 0 };
}

// Mark all notifications as read
async function markAllNotificationsRead(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('Notifications')
    .update({ is_read: true })
    .eq('practitioner_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }

  return { success: true, message: 'All notifications marked as read' };
}

// Delete notification(s)
async function deleteNotification(supabase: any, options: NotificationOperation, userId: string) {
  const ids = options.notification_ids || (options.notification_id ? [options.notification_id] : []);
  
  if (ids.length === 0) {
    throw new Error('No notification IDs provided');
  }

  const { data, error } = await supabase
    .from('Notifications')
    .delete()
    .in('id', ids)
    .eq('practitioner_id', userId) // Ensure user can only delete their own notifications
    .select();

  if (error) {
    console.error('Error deleting notifications:', error);
    throw new Error('Failed to delete notifications');
  }

  return { success: true, data, deleted_count: data?.length || 0 };
}

// Helper function for creating notifications from other Edge Functions
export async function createNotificationHelper(
  supabase: any,
  payload: CreateNotificationPayload
) {
  return await createNotification(supabase, {
    operation: 'create',
    recipient_id: payload.recipient_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata
  }, 'system');
}