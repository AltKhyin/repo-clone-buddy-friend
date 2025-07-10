// ABOUTME: Standardized community sidebar data fetching Edge Function that consolidates sidebar information for performance

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

interface CommunitySidebarData {
  sections: any[];
  categories: any[];
  announcements: any[];
  recentMembers: any[];
  memberStats: {
    totalMembers: number;
    onlineCount: number;
  };
  moderators: any[];
}

serve(async (req: Request) => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // Only allow GET requests for this endpoint
  if (req.method !== 'GET') {
    return createErrorResponse(new Error('METHOD_NOT_ALLOWED: Only GET requests are allowed'));
  }

  try {
    console.log('[Community Sidebar API] Fetching sidebar data...');

    // STEP 2: Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 3: Parse query parameters
    const url = new URL(req.url);
    const adminMode = url.searchParams.get('admin') === 'true';

    // STEP 4: Execute comprehensive queries in parallel for optimal performance
    const [
      sectionsResult,
      categoriesResult,
      announcementsResult,
      recentMembersResult,
      memberStatsResult,
      moderatorsResult,
    ] = await Promise.all([
      // Fetch sidebar sections (all sections for admin, visible only for public)
      adminMode
        ? supabase.from('CommunitySidebarSections').select('*').order('display_order')
        : supabase
            .from('CommunitySidebarSections')
            .select('*')
            .eq('is_visible', true)
            .order('display_order'),

      // Fetch active categories ordered by display_order
      supabase.from('CommunityCategories').select('*').eq('is_active', true).order('display_order'),

      // Fetch recent published announcements (max 5)
      supabase
        .from('CommunityAnnouncements')
        .select('*')
        .eq('is_published', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('is_featured', { ascending: false })
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(5),

      // Fetch recent members for simple avatar display (max 7)
      supabase
        .from('Practitioners')
        .select('id, full_name, avatar_url, created_at')
        .not('avatar_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(7),

      // Fetch real member statistics using database functions
      Promise.all([
        supabase.rpc('get_community_members_count'),
        supabase.rpc('get_online_users_count'),
      ]),

      // Fetch real moderators from Practitioners table (admins and editors act as moderators)
      supabase
        .from('Practitioners')
        .select('id, full_name, avatar_url, role, profession')
        .in('role', ['admin', 'editor'])
        .order('role', { ascending: true }), // admin first, then editor
    ]);

    // STEP 5: Check for errors in any of the queries
    if (sectionsResult.error) {
      console.error('[Community Sidebar API] Sections fetch error:', sectionsResult.error);
      throw new Error(
        `FETCH_ERROR: Failed to fetch sidebar sections - ${sectionsResult.error.message}`
      );
    }

    if (categoriesResult.error) {
      console.error('[Community Sidebar API] Categories fetch error:', categoriesResult.error);
      throw new Error(
        `FETCH_ERROR: Failed to fetch categories - ${categoriesResult.error.message}`
      );
    }

    if (announcementsResult.error) {
      console.error(
        '[Community Sidebar API] Announcements fetch error:',
        announcementsResult.error
      );
      throw new Error(
        `FETCH_ERROR: Failed to fetch announcements - ${announcementsResult.error.message}`
      );
    }

    if (recentMembersResult.error) {
      console.error(
        '[Community Sidebar API] Recent members fetch error:',
        recentMembersResult.error
      );
      throw new Error(
        `FETCH_ERROR: Failed to fetch recent members - ${recentMembersResult.error.message}`
      );
    }

    // Check member stats (from Promise.all of RPC calls)
    const [totalMembersResult, onlineCountResult] = memberStatsResult;
    if (totalMembersResult.error) {
      console.error('[Community Sidebar API] Total members count error:', totalMembersResult.error);
      throw new Error(
        `FETCH_ERROR: Failed to get member count - ${totalMembersResult.error.message}`
      );
    }
    if (onlineCountResult.error) {
      console.error('[Community Sidebar API] Online count error:', onlineCountResult.error);
      throw new Error(
        `FETCH_ERROR: Failed to get online count - ${onlineCountResult.error.message}`
      );
    }

    if (moderatorsResult.error) {
      console.error('[Community Sidebar API] Moderators fetch error:', moderatorsResult.error);
      throw new Error(
        `FETCH_ERROR: Failed to fetch moderators - ${moderatorsResult.error.message}`
      );
    }

    // STEP 6: Process sidebar sections and enhance with computed data
    const processedSections = await Promise.all(
      sectionsResult.data.map(async section => {
        // Add section-specific computed data
        switch (section.section_type) {
          case 'about':
            return {
              ...section,
              computed_data: {
                recent_members: recentMembersResult.data || [],
                total_members: totalMembersResult.data || 0,
                online_count: onlineCountResult.data || 0,
              },
            };

          case 'categories':
            // Get real post counts for each category
            const categoriesWithCounts = await Promise.all(
              (categoriesResult.data || []).map(async category => {
                const { data: postCount } = await supabase
                  .from('CommunityPosts')
                  .select('id', { count: 'exact', head: true })
                  .eq('category_id', category.id);

                return {
                  ...category,
                  post_count: postCount || 0,
                };
              })
            );

            return {
              ...section,
              computed_data: {
                categories: categoriesWithCounts,
              },
            };

          case 'moderators':
            return {
              ...section,
              computed_data: {
                moderators: moderatorsResult.data || [],
              },
            };

          case 'announcements':
            return {
              ...section,
              computed_data: {
                announcements: announcementsResult.data || [],
              },
            };

          case 'custom':
            // For custom sections, fetch their custom content
            const { data: customSections } = await supabase
              .from('CommunityCustomSections')
              .select('*')
              .eq('sidebar_section_id', section.id)
              .eq('is_visible', true)
              .order('display_order');

            return {
              ...section,
              computed_data: {
                custom_sections: customSections || [],
              },
            };

          default:
            return section;
        }
      })
    );

    // STEP 7: Construct response with reduced duplication
    // Only extract enhanced categories with post counts to avoid duplication
    const categoriesWithCounts =
      processedSections.find(s => s.section_type === 'categories')?.computed_data?.categories ||
      categoriesResult.data ||
      [];

    const sidebarData: CommunitySidebarData = {
      sections: processedSections,
      categories: categoriesWithCounts, // Use enhanced data from computed_data
      announcements: announcementsResult.data || [],
      recentMembers: recentMembersResult.data || [],
      memberStats: {
        totalMembers: totalMembersResult.data || 0,
        onlineCount: onlineCountResult.data || 0,
      },
      moderators: moderatorsResult.data || [],
    };

    console.log('[Community Sidebar API] Success - comprehensive sidebar data fetched');
    console.log(`- ${sidebarData.sections.length} sections`);
    console.log(`- ${sidebarData.categories.length} categories (with post counts)`);
    console.log(`- ${sidebarData.announcements.length} announcements`);
    console.log(`- ${sidebarData.recentMembers.length} recent members`);
    console.log(`- ${sidebarData.memberStats.totalMembers} total members`);
    console.log(`- ${sidebarData.memberStats.onlineCount} online now`);
    console.log(`- ${sidebarData.moderators.length} moderators`);

    // STEP 8: Standardized Success Response
    return createSuccessResponse(sidebarData);
  } catch (error) {
    console.error('[Community Sidebar API Error]:', error);
    return createErrorResponse(error);
  }
});
