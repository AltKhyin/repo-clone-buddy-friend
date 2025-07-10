// ABOUTME: Admin community management Edge Function following [DOC_5] mandatory 7-step pattern for comprehensive community administration

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

// Type definitions for request/response
interface AdminCommunityRequest {
  operation: 'create' | 'update' | 'delete' | 'reorder' | 'toggle_visibility';
  resource:
    | 'categories'
    | 'sidebar_sections'
    | 'announcements'
    | 'countdowns'
    | 'custom_sections'
    | 'online_users';
  data?: any;
  id?: string | number;
  ids?: (string | number)[];
}

interface AdminCommunityResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

serve(async req => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // Only allow POST requests for this endpoint
  if (req.method !== 'POST') {
    return createErrorResponse(new Error('Method not allowed'));
  }

  try {
    console.log('Starting admin community management operation...');

    // STEP 2: Manual Authentication (requires verify_jwt = false in config.toml)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(new Error('UNAUTHORIZED: Authorization header is required'));
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return createErrorResponse(new Error('UNAUTHORIZED: Invalid token'));
    }

    console.log(`Authenticated user: ${user.id}`);

    // STEP 3: Role-based Authorization (Admin only)
    const { data: userClaims } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userClaims || userClaims.role !== 'admin') {
      return createErrorResponse(new Error('FORBIDDEN: Admin access required'));
    }

    // STEP 4: Input Parsing & Validation
    const requestBody = (await req.json()) as AdminCommunityRequest;

    if (!requestBody.operation || !requestBody.resource) {
      return createErrorResponse(
        new Error('VALIDATION_FAILED: Missing required fields: operation and resource')
      );
    }

    console.log(`Processing ${requestBody.operation} operation on ${requestBody.resource}`);

    // STEP 5: Core Business Logic Execution
    let result: AdminCommunityResponse;

    switch (requestBody.resource) {
      case 'categories':
        result = await handleCategoryOperations(supabase, requestBody, user.id);
        break;
      case 'sidebar_sections':
        result = await handleSidebarSectionOperations(supabase, requestBody, user.id);
        break;
      case 'announcements':
        result = await handleAnnouncementOperations(supabase, requestBody, user.id);
        break;
      case 'countdowns':
        result = await handleCountdownOperations(supabase, requestBody, user.id);
        break;
      case 'custom_sections':
        result = await handleCustomSectionOperations(supabase, requestBody, user.id);
        break;
      case 'online_users':
        result = await handleOnlineUserOperations(supabase, requestBody, user.id);
        break;
      default:
        return createErrorResponse(
          new Error(`VALIDATION_FAILED: Unsupported resource: ${requestBody.resource}`)
        );
    }

    console.log('Admin community management operation completed successfully');

    // STEP 6: Standardized Success Response
    return createSuccessResponse({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Admin community management error:', error);
    return createErrorResponse(error);
  }
});

// =============================================================================
// Category Management Operations
// =============================================================================

async function handleCategoryOperations(
  supabase: any,
  request: AdminCommunityRequest,
  userId: string
): Promise<AdminCommunityResponse> {
  const { operation, data, id, ids } = request;

  switch (operation) {
    case 'create':
      if (!data || !data.name || !data.label) {
        throw new Error('Missing required fields: name and label');
      }

      const { data: newCategory, error: createError } = await supabase
        .from('CommunityCategories')
        .insert({
          name: data.name,
          label: data.label,
          description: data.description || null,
          text_color: data.text_color || '#1f2937',
          border_color: data.border_color || '#3b82f6',
          background_color: data.background_color || '#dbeafe',
          icon_name: data.icon_name || null,
          display_order: data.display_order || 0,
          is_active: data.is_active !== undefined ? data.is_active : true,
          created_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        success: true,
        data: newCategory,
        message: 'Category created successfully',
      };

    case 'update':
      if (!id) throw new Error('Category ID is required for update');

      const { data: updatedCategory, error: updateError } = await supabase
        .from('CommunityCategories')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: updatedCategory,
        message: 'Category updated successfully',
      };

    case 'delete':
      if (!id) throw new Error('Category ID is required for deletion');

      // Check if category is in use
      const { data: postsUsingCategory } = await supabase
        .from('CommunityPosts')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (postsUsingCategory && postsUsingCategory.length > 0) {
        throw new Error('Cannot delete category that is in use by posts');
      }

      const { error: deleteError } = await supabase
        .from('CommunityCategories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return {
        success: true,
        message: 'Category deleted successfully',
      };

    case 'reorder':
      if (!ids || !Array.isArray(ids)) {
        throw new Error('Category IDs array is required for reordering');
      }

      // Update display order for each category
      const reorderPromises = ids.map((categoryId, index) =>
        supabase.from('CommunityCategories').update({ display_order: index }).eq('id', categoryId)
      );

      await Promise.all(reorderPromises);

      return {
        success: true,
        message: 'Categories reordered successfully',
      };

    case 'toggle_visibility':
      if (!id) throw new Error('Category ID is required');

      const { data: category } = await supabase
        .from('CommunityCategories')
        .select('is_active')
        .eq('id', id)
        .single();

      if (!category) throw new Error('Category not found');

      const { data: toggledCategory, error: toggleError } = await supabase
        .from('CommunityCategories')
        .update({ is_active: !category.is_active })
        .eq('id', id)
        .select()
        .single();

      if (toggleError) throw toggleError;

      return {
        success: true,
        data: toggledCategory,
        message: `Category ${toggledCategory.is_active ? 'activated' : 'deactivated'} successfully`,
      };

    default:
      throw new Error(`Unsupported category operation: ${operation}`);
  }
}

// =============================================================================
// Sidebar Section Management Operations
// =============================================================================

async function handleSidebarSectionOperations(
  supabase: any,
  request: AdminCommunityRequest,
  userId: string
): Promise<AdminCommunityResponse> {
  const { operation, data, id, ids } = request;

  switch (operation) {
    case 'create':
      if (!data || !data.section_type || !data.title) {
        throw new Error('Missing required fields: section_type and title');
      }

      const { data: newSection, error: createError } = await supabase
        .from('CommunitySidebarSections')
        .insert({
          section_type: data.section_type,
          title: data.title,
          content: data.content || {},
          display_order: data.display_order || 0,
          is_visible: data.is_visible !== undefined ? data.is_visible : true,
          created_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        success: true,
        data: newSection,
        message: 'Sidebar section created successfully',
      };

    case 'update':
      if (!id) throw new Error('Section ID is required for update');

      const { data: updatedSection, error: updateError } = await supabase
        .from('CommunitySidebarSections')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: updatedSection,
        message: 'Sidebar section updated successfully',
      };

    case 'delete':
      if (!id) throw new Error('Section ID is required for deletion');

      // Check if section is system section
      const { data: section } = await supabase
        .from('CommunitySidebarSections')
        .select('is_system')
        .eq('id', id)
        .single();

      if (section && section.is_system) {
        throw new Error('Cannot delete system sections');
      }

      const { error: deleteError } = await supabase
        .from('CommunitySidebarSections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return {
        success: true,
        message: 'Sidebar section deleted successfully',
      };

    case 'reorder':
      if (!ids || !Array.isArray(ids)) {
        throw new Error('Section IDs array is required for reordering');
      }

      const reorderPromises = ids.map((sectionId, index) =>
        supabase
          .from('CommunitySidebarSections')
          .update({ display_order: index })
          .eq('id', sectionId)
      );

      await Promise.all(reorderPromises);

      return {
        success: true,
        message: 'Sidebar sections reordered successfully',
      };

    case 'toggle_visibility':
      if (!id) throw new Error('Section ID is required');

      const { data: sectionData } = await supabase
        .from('CommunitySidebarSections')
        .select('is_visible')
        .eq('id', id)
        .single();

      if (!sectionData) throw new Error('Section not found');

      const { data: toggledSection, error: toggleError } = await supabase
        .from('CommunitySidebarSections')
        .update({ is_visible: !sectionData.is_visible })
        .eq('id', id)
        .select()
        .single();

      if (toggleError) throw toggleError;

      return {
        success: true,
        data: toggledSection,
        message: `Section ${toggledSection.is_visible ? 'made visible' : 'hidden'} successfully`,
      };

    default:
      throw new Error(`Unsupported sidebar section operation: ${operation}`);
  }
}

// =============================================================================
// Announcement Management Operations
// =============================================================================

async function handleAnnouncementOperations(
  supabase: any,
  request: AdminCommunityRequest,
  userId: string
): Promise<AdminCommunityResponse> {
  const { operation, data, id } = request;

  switch (operation) {
    case 'create':
      if (!data || !data.title || !data.content) {
        throw new Error('Missing required fields: title and content');
      }

      const { data: newAnnouncement, error: createError } = await supabase
        .from('CommunityAnnouncements')
        .insert({
          title: data.title,
          content: data.content,
          type: data.type || 'announcement',
          priority: data.priority || 0,
          is_published: data.is_published || false,
          is_featured: data.is_featured || false,
          published_at: data.published_at || null,
          expires_at: data.expires_at || null,
          image_url: data.image_url || null,
          link_url: data.link_url || null,
          link_text: data.link_text || null,
          created_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        success: true,
        data: newAnnouncement,
        message: 'Announcement created successfully',
      };

    case 'update':
      if (!id) throw new Error('Announcement ID is required for update');

      const { data: updatedAnnouncement, error: updateError } = await supabase
        .from('CommunityAnnouncements')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: updatedAnnouncement,
        message: 'Announcement updated successfully',
      };

    case 'delete':
      if (!id) throw new Error('Announcement ID is required for deletion');

      const { error: deleteError } = await supabase
        .from('CommunityAnnouncements')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return {
        success: true,
        message: 'Announcement deleted successfully',
      };

    default:
      throw new Error(`Unsupported announcement operation: ${operation}`);
  }
}

// =============================================================================
// Countdown Management Operations
// =============================================================================

async function handleCountdownOperations(
  supabase: any,
  request: AdminCommunityRequest,
  userId: string
): Promise<AdminCommunityResponse> {
  const { operation, data, id } = request;

  switch (operation) {
    case 'create':
      if (!data || !data.title || !data.target_date) {
        throw new Error('Missing required fields: title and target_date');
      }

      const { data: newCountdown, error: createError } = await supabase
        .from('CommunityCountdowns')
        .insert({
          title: data.title,
          description: data.description || null,
          target_date: data.target_date,
          timezone: data.timezone || 'UTC',
          is_active: data.is_active !== undefined ? data.is_active : true,
          is_featured: data.is_featured || false,
          display_format: data.display_format || 'days_hours_minutes',
          completed_message: data.completed_message || null,
          created_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        success: true,
        data: newCountdown,
        message: 'Countdown created successfully',
      };

    case 'update':
      if (!id) throw new Error('Countdown ID is required for update');

      const { data: updatedCountdown, error: updateError } = await supabase
        .from('CommunityCountdowns')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: updatedCountdown,
        message: 'Countdown updated successfully',
      };

    case 'delete':
      if (!id) throw new Error('Countdown ID is required for deletion');

      const { error: deleteError } = await supabase
        .from('CommunityCountdowns')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return {
        success: true,
        message: 'Countdown deleted successfully',
      };

    default:
      throw new Error(`Unsupported countdown operation: ${operation}`);
  }
}

// =============================================================================
// Custom Section Management Operations
// =============================================================================

async function handleCustomSectionOperations(
  supabase: any,
  request: AdminCommunityRequest,
  userId: string
): Promise<AdminCommunityResponse> {
  const { operation, data, id, ids } = request;

  switch (operation) {
    case 'create':
      if (!data || !data.sidebar_section_id || !data.content_type) {
        throw new Error('Missing required fields: sidebar_section_id and content_type');
      }

      const { data: newCustomSection, error: createError } = await supabase
        .from('CommunityCustomSections')
        .insert({
          sidebar_section_id: data.sidebar_section_id,
          content_type: data.content_type,
          content_data: data.content_data || {},
          display_order: data.display_order || 0,
          is_visible: data.is_visible !== undefined ? data.is_visible : true,
          created_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        success: true,
        data: newCustomSection,
        message: 'Custom section created successfully',
      };

    case 'update':
      if (!id) throw new Error('Custom section ID is required for update');

      const { data: updatedCustomSection, error: updateError } = await supabase
        .from('CommunityCustomSections')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: updatedCustomSection,
        message: 'Custom section updated successfully',
      };

    case 'delete':
      if (!id) throw new Error('Custom section ID is required for deletion');

      const { error: deleteError } = await supabase
        .from('CommunityCustomSections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return {
        success: true,
        message: 'Custom section deleted successfully',
      };

    case 'reorder':
      if (!ids || !Array.isArray(ids)) {
        throw new Error('Custom section IDs array is required for reordering');
      }

      const reorderPromises = ids.map((customSectionId, index) =>
        supabase
          .from('CommunityCustomSections')
          .update({ display_order: index })
          .eq('id', customSectionId)
      );

      await Promise.all(reorderPromises);

      return {
        success: true,
        message: 'Custom sections reordered successfully',
      };

    default:
      throw new Error(`Unsupported custom section operation: ${operation}`);
  }
}

// =============================================================================
// Online User Management Operations
// =============================================================================

async function handleOnlineUserOperations(
  supabase: any,
  request: AdminCommunityRequest,
  userId: string
): Promise<AdminCommunityResponse> {
  const { operation, data } = request;

  switch (operation) {
    case 'update':
      // Update current user's online status
      const { error: updateError } = await supabase.rpc('update_user_online_status', {
        p_user_id: userId,
        p_is_viewing_community: data?.is_viewing_community || true,
      });

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Online status updated successfully',
      };

    default:
      throw new Error(`Unsupported online user operation: ${operation}`);
  }
}
