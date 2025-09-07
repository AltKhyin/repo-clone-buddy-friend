// ABOUTME: Edge function for fetching individual review details by slug with access control.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Inline authentication helper
async function authenticateUser(supabase: any, authHeader: string | null) {
  if (!authHeader) {
    throw new Error('UNAUTHORIZED: Authorization header is required');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (authError || !user) {
    throw new Error('UNAUTHORIZED: Invalid authentication token');
  }

  return user;
}

// Inline success response
function createSuccessResponse(data: any, additionalHeaders: Record<string, string> = {}, origin?: string) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
        ...additionalHeaders,
      },
    }
  );
}

// Inline error response
function createErrorResponse(error: any, additionalHeaders: Record<string, string> = {}, origin?: string) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;

    if (message.startsWith('UNAUTHORIZED:')) {
      status = 401;
      code = 'UNAUTHORIZED';
      message = message.replace('UNAUTHORIZED: ', '');
    } else if (message.startsWith('FORBIDDEN:')) {
      status = 403;
      code = 'FORBIDDEN';
      message = message.replace('FORBIDDEN: ', '');
    } else if (message.startsWith('VALIDATION_FAILED:')) {
      status = 400;
      code = 'VALIDATION_FAILED';
      message = message.replace('VALIDATION_FAILED: ', '');
    } else if (message.startsWith('RATE_LIMIT_EXCEEDED:')) {
      status = 429;
      code = 'RATE_LIMIT_EXCEEDED';
      message = message.replace('RATE_LIMIT_EXCEEDED: ', '');
    }
  }

  return new Response(
    JSON.stringify({
      error: { message, code },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
        ...additionalHeaders,
      },
    }
  );
}

interface ReviewDetailResponse {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  structured_content: any;
  published_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  access_level: string;
  community_post_id: number | null;
  view_count: number | null;
  edicao: string | null;
  tags: string[];
}

serve(async req => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const origin = req.headers.get('Origin');

  try {
    // STEP 2: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 4: Extract slug from request (support both GET params and POST body)
    let slug;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      slug = url.searchParams.get('slug');
    } else {
      try {
        const body = await req.json();
        slug = body.slug;
      } catch (error) {
        console.error('Failed to parse request body:', error);
        throw new Error('VALIDATION_FAILED: Invalid request format');
      }
    }

    if (!slug) {
      throw new Error('VALIDATION_FAILED: Review slug is required');
    }

    // STEP 5: Authentication (Optional for reviews)
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    let userSubscriptionTier = 'free';
    let userRole = null;

    if (authHeader) {
      try {
        const user = await authenticateUser(supabase, authHeader);
        userId = user.id;
        userSubscriptionTier = user.user_metadata?.subscription_tier || 'free';
        
        // Extract role from JWT claims for admin bypass
        try {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          userRole = payload.app_metadata?.role || null;
          console.log(`🔑 ACCESS CONTROL: User ${userId} - Role: ${userRole}, Tier: ${userSubscriptionTier}`);
        } catch (jwtError) {
          console.warn('Failed to decode JWT for role extraction:', jwtError);
        }
      } catch (authError) {
        // Continue as anonymous user for public reviews
        console.log('Authentication failed, continuing as anonymous:', authError.message);
      }
    }

    console.log(`🔍 EDGE FUNCTION: Fetching review with slug: ${slug} for user: ${userId}`);

    // Try to parse as ID first, then fall back to title-based lookup
    const parsedId = parseInt(slug, 10);
    const isNumericId = !isNaN(parsedId) && parsedId > 0;

    let basicReview = null;
    let basicError = null;

    if (isNumericId) {
      console.log(`🔍 EDGE FUNCTION: Looking up review by ID: ${parsedId}`);
      // Try ID-based lookup first
      let query = supabase
        .from('Reviews')
        .select(
          `
          id,
          title,
          description,
          cover_image_url,
          structured_content,
          published_at,
          access_level,
          community_post_id,
          view_count,
          edicao,
          author_id,
          status,
          author:Practitioners!Reviews_author_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('id', parsedId);

      // Allow access to published reviews OR draft reviews by the author
      if (userId) {
        query = query.or(`status.eq.published,and(status.eq.draft,author_id.eq.${userId})`);
      } else {
        query = query.eq('status', 'published');
      }

      const result = await query.maybeSingle();

      basicReview = result.data;
      basicError = result.error;
    }

    // Fall back to title-based lookup if ID lookup failed or wasn't attempted
    if (!basicReview && !basicError) {
      const decodedSlug = decodeURIComponent(slug);
      console.log(`🔍 EDGE FUNCTION: Looking up review by title: ${decodedSlug}`);

      let query = supabase
        .from('Reviews')
        .select(
          `
          id,
          title,
          description,
          cover_image_url,
          structured_content,
          published_at,
          access_level,
          community_post_id,
          view_count,
          edicao,
          author_id,
          status,
          author:Practitioners!Reviews_author_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('title', decodedSlug);

      // Allow access to published reviews OR draft reviews by the author
      if (userId) {
        query = query.or(`status.eq.published,and(status.eq.draft,author_id.eq.${userId})`);
      } else {
        query = query.eq('status', 'published');
      }

      const result = await query.maybeSingle();

      basicReview = result.data;
      basicError = result.error;
    }

    if (basicError) {
      console.error('❌ EDGE FUNCTION: Basic review fetch error:', basicError);
      throw new Error(`Failed to fetch review: ${basicError.message}`);
    }

    if (!basicReview) {
      const decodedSlug = decodeURIComponent(slug);
      console.log(`🔍 EDGE FUNCTION: No review found with title: ${decodedSlug}`);

      // Let's also try a LIKE search to be more flexible
      let fuzzyQuery = supabase
        .from('Reviews')
        .select(
          `
          id,
          title,
          description,
          cover_image_url,
          structured_content,
          published_at,
          access_level,
          community_post_id,
          view_count,
          edicao,
          author_id,
          status,
          author:Practitioners!Reviews_author_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .ilike('title', `%${decodedSlug.replace(/\[.*?\]\s*/, '')}%`); // Remove [mockdata] prefix and search

      // Allow access to published reviews OR draft reviews by the author
      if (userId) {
        fuzzyQuery = fuzzyQuery.or(
          `status.eq.published,and(status.eq.draft,author_id.eq.${userId})`
        );
      } else {
        fuzzyQuery = fuzzyQuery.eq('status', 'published');
      }

      const { data: fuzzyReview } = await fuzzyQuery.maybeSingle();

      if (!fuzzyReview) {
        throw new Error('REVIEW_NOT_FOUND: Review not found');
      }

      basicReview = fuzzyReview;
    }

    const review = basicReview;

    // Add fallback for missing author data
    if (!review.author) {
      review.author = {
        id: review.author_id || 'unknown',
        full_name: 'Autor removido',
        avatar_url: null,
      };
    }

    console.log(`✅ EDGE FUNCTION: Found review ${review.id}: "${review.title}"`);

    // STEP 6: Hierarchical Access Control Validation
    console.log(`🔒 ACCESS CONTROL: Checking access for review "${review.title}" (level: ${review.access_level})`);
    
    // Admin bypass - admins can access ALL content regardless of access_level
    const isAdmin = userRole === 'admin' || userRole === 'editor';
    
    // Author bypass - authors can always see their own content
    const isAuthor = userId && userId === review.author_id;
    
    // Hierarchical tier access checking
    let hasAccess = false;
    
    if (isAdmin) {
      hasAccess = true;
      console.log(`✅ ACCESS CONTROL: Admin access granted (role: ${userRole})`);
    } else if (isAuthor) {
      hasAccess = true;
      console.log(`✅ ACCESS CONTROL: Author access granted`);
    } else {
      // Hierarchical tier system: premium ⊃ free ⊃ public
      switch (review.access_level) {
        case 'public':
          hasAccess = true; // Public content accessible to everyone
          console.log(`✅ ACCESS CONTROL: Public content access granted`);
          break;
          
        case 'free':
          hasAccess = userId !== null; // Any authenticated user can access free content
          console.log(`${hasAccess ? '✅' : '❌'} ACCESS CONTROL: Free content - authenticated user: ${!!userId}`);
          break;
          
        case 'premium':
          hasAccess = userId && userSubscriptionTier === 'premium';
          console.log(`${hasAccess ? '✅' : '❌'} ACCESS CONTROL: Premium content - user tier: ${userSubscriptionTier}`);
          break;
          
        default:
          hasAccess = false;
          console.log(`❌ ACCESS CONTROL: Unknown access level: ${review.access_level}`);
      }
    }

    if (!hasAccess) {
      const errorMessage = `ACCESS_DENIED: This content requires ${review.access_level === 'free' ? 'a free account' : review.access_level === 'premium' ? 'a premium subscription' : review.access_level + ' access'} to access`;
      console.log(`🚫 ACCESS CONTROL: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    console.log(`🎯 ACCESS CONTROL: Access granted for review "${review.title}"`);

    // STEP 7: Fetch Tags (Non-blocking)
    let tags: string[] = [];
    try {
      const { data: tagData } = await supabase
        .from('ReviewTags')
        .select(
          `
          Tags(tag_name)
        `
        )
        .eq('review_id', review.id);

      if (tagData) {
        tags = tagData.map((rt: any) => rt.Tags?.tag_name).filter(Boolean) || [];
      }
    } catch (tagError) {
      console.warn('⚠️ EDGE FUNCTION: Failed to fetch tags, continuing without them:', tagError);
      // Continue without tags rather than failing the entire request
    }

    // Asynchronously increment view count (fire and forget) - performance optimization
    if (userId) {
      supabase
        .from('Reviews')
        .update({ view_count: (review.view_count || 0) + 1 })
        .eq('id', review.id)
        .then(() => console.log(`📈 EDGE FUNCTION: View count incremented for review ${review.id}`))
        .catch(err => console.error('❌ EDGE FUNCTION: Failed to increment view count:', err));
    }

    // STEP 8: Enhanced V3 Content Bridge - Prioritize V3 content from editor
    let finalStructuredContent = review.structured_content;
    let contentBridgeUsed = false;
    
    console.log(`🔍 V3 CONTENT BRIDGE: Starting content bridge for review ${review.id}`);
    console.log(`📊 V3 CONTENT BRIDGE: Legacy content type: ${Array.isArray(review.structured_content) ? 'array' : typeof review.structured_content}, length: ${Array.isArray(review.structured_content) ? review.structured_content.length : 'N/A'}`);
    
    try {
      console.log(`🔍 V3 CONTENT BRIDGE: Checking for V3 editor content in review_editor_content table...`);
      
      // Try to fetch V3 content from review_editor_content table
      const { data: editorContent, error: editorError } = await supabase
        .from('review_editor_content')
        .select('structured_content, updated_at')
        .eq('review_id', review.id)
        .single();
      
      if (editorError) {
        if (editorError.code === 'PGRST116') {
          console.log(`📝 V3 CONTENT BRIDGE: No V3 editor content found for review ${review.id} (expected for legacy reviews)`);
        } else {
          console.error(`❌ V3 CONTENT BRIDGE: Database error fetching editor content for review ${review.id}:`, editorError);
        }
      } else if (editorContent) {
        console.log(`✅ V3 CONTENT BRIDGE: Found V3 editor content for review ${review.id}!`);
        console.log(`📊 V3 CONTENT BRIDGE: V3 Content structure analysis:`, {
          hasStructuredContent: Boolean(editorContent.structured_content),
          hasVersion: Boolean(editorContent.structured_content?.version),
          version: editorContent.structured_content?.version,
          hasNodes: Boolean(editorContent.structured_content?.nodes),
          nodeCount: editorContent.structured_content?.nodes?.length || 0,
          hasPositions: Boolean(editorContent.structured_content?.positions),
          positionCount: Object.keys(editorContent.structured_content?.positions || {}).length,
          hasMobilePositions: Boolean(editorContent.structured_content?.mobilePositions),
          mobilePositionCount: Object.keys(editorContent.structured_content?.mobilePositions || {}).length,
          updatedAt: editorContent.updated_at
        });
        
        // Validate V3 content structure before using
        if (editorContent.structured_content?.version === '3.0.0' && 
            editorContent.structured_content?.nodes && 
            Array.isArray(editorContent.structured_content.nodes)) {
          
          finalStructuredContent = editorContent.structured_content;
          contentBridgeUsed = true;
          console.log(`🚀 V3 CONTENT BRIDGE: Successfully using V3 content with ${editorContent.structured_content.nodes.length} nodes!`);
          console.log(`📊 V3 CONTENT BRIDGE: V3 node types:`, editorContent.structured_content.nodes.map(node => ({ id: node.id, type: node.type })));
        } else {
          console.warn(`⚠️ V3 CONTENT BRIDGE: Editor content exists but invalid V3 format for review ${review.id}:`);
          console.warn(`⚠️ V3 CONTENT BRIDGE: - Version: ${editorContent.structured_content?.version} (expected: "3.0.0")`);
          console.warn(`⚠️ V3 CONTENT BRIDGE: - Has nodes: ${Boolean(editorContent.structured_content?.nodes)}`);
          console.warn(`⚠️ V3 CONTENT BRIDGE: - Nodes is array: ${Array.isArray(editorContent.structured_content?.nodes)}`);
          console.warn(`⚠️ V3 CONTENT BRIDGE: Falling back to legacy content`);
        }
      }
    } catch (bridgeError) {
      console.error(`💥 V3 CONTENT BRIDGE: Unexpected error in content bridge for review ${review.id}:`, bridgeError);
      console.error(`💥 V3 CONTENT BRIDGE: Error details:`, {
        name: bridgeError.name,
        message: bridgeError.message,
        stack: bridgeError.stack
      });
      console.log(`🔄 V3 CONTENT BRIDGE: Continuing with legacy content due to error`);
    }

    // Debug logging for final content format
    if (Array.isArray(finalStructuredContent)) {
      console.log(`📄 FINAL CONTENT: Legacy array format with ${finalStructuredContent.length} blocks (bridge used: ${contentBridgeUsed})`);
    } else if (finalStructuredContent?.version === '3.0.0') {
      console.log(`🎯 FINAL CONTENT: V3 format with ${finalStructuredContent.nodes?.length || 0} nodes (bridge used: ${contentBridgeUsed})`);
    } else {
      console.log(`❓ FINAL CONTENT: Unknown format: ${typeof finalStructuredContent} (bridge used: ${contentBridgeUsed})`);
    }

    // STEP 9: Build Response
    const response: ReviewDetailResponse = {
      id: review.id,
      title: review.title,
      description: review.description,
      cover_image_url: review.cover_image_url,
      structured_content: finalStructuredContent,
      published_at: review.published_at,
      author: review.author,
      access_level: review.access_level,
      community_post_id: review.community_post_id,
      view_count: review.view_count,
      edicao: review.edicao,
      tags,
    };

    console.log(`✅ EDGE FUNCTION: Successfully returning review "${review.title}" with ${tags.length} tags (V3 bridge: ${contentBridgeUsed})`);

    // STEP 10: Standardized Success Response
    return createSuccessResponse(response, {}, origin);
  } catch (error) {
    // STEP 11: Centralized Error Handling
    console.error('💥 EDGE FUNCTION: Review detail fetch error:', error);
    return createErrorResponse(error, {}, origin);
  }
});