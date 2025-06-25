// ABOUTME: Admin endpoint for comprehensive tag analytics and statistics with hierarchy analysis.

import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { sendSuccess, sendError } from '../_shared/api-helpers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface TagWithStats {
  id: number;
  tag_name: string;
  parent_id: number | null;
  created_at: string;
  usage_count: number;
  direct_children: number;
  total_descendants: number;
  recent_usage: number;
  color?: string;
  description?: string;
}

interface TagAnalytics {
  totalTags: number;
  popularTags: number;
  unusedTags: number;
  newThisMonth: number;
  hierarchyDepth: number;
  topUsedTags: TagWithStats[];
  orphanedTags: TagWithStats[];
  recentTags: TagWithStats[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Authenticate and verify admin privileges
    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return sendError('Authentication required', 401);
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Check if user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheck?.role !== 'admin') {
      return sendError('Admin privileges required', 403);
    }

    // Only allow GET requests for analytics
    if (req.method !== 'GET') {
      return sendError('Only GET method is allowed', 405);
    }

    // Fetch all tags with usage statistics
    const { data: allTags, error: tagsError } = await supabaseAdmin
      .from('Tags')
      .select(`
        id,
        tag_name,
        parent_id,
        created_at,
        color,
        description,
        ReviewTags(count)
      `)
      .order('tag_name');

    if (tagsError) {
      throw new Error(`Failed to fetch tags: ${tagsError.message}`);
    }

    // Calculate current date boundaries
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Transform tags data and calculate statistics
    const tagsWithStats: TagWithStats[] = (allTags || []).map(tag => {
      const usageCount = Array.isArray(tag.ReviewTags) ? tag.ReviewTags.length : 0;
      const createdAt = new Date(tag.created_at);
      
      return {
        id: tag.id,
        tag_name: tag.tag_name,
        parent_id: tag.parent_id,
        created_at: tag.created_at,
        usage_count: usageCount,
        direct_children: 0, // Will be calculated below
        total_descendants: 0, // Will be calculated below
        recent_usage: createdAt > oneWeekAgo ? usageCount : 0,
        color: tag.color,
        description: tag.description
      };
    });

    // Calculate hierarchy statistics
    const tagMap = new Map(tagsWithStats.map(tag => [tag.id, tag]));
    
    // Calculate direct children count
    tagsWithStats.forEach(tag => {
      const childrenCount = tagsWithStats.filter(t => t.parent_id === tag.id).length;
      tag.direct_children = childrenCount;
    });

    // Calculate hierarchy depth
    const calculateDepth = (tagId: number, visited = new Set<number>()): number => {
      if (visited.has(tagId)) return 0; // Prevent infinite loops
      visited.add(tagId);
      
      const children = tagsWithStats.filter(t => t.parent_id === tagId);
      if (children.length === 0) return 1;
      
      return 1 + Math.max(...children.map(child => calculateDepth(child.id, new Set(visited))));
    };

    const rootTags = tagsWithStats.filter(t => !t.parent_id);
    const hierarchyDepth = rootTags.length > 0 
      ? Math.max(...rootTags.map(tag => calculateDepth(tag.id))) 
      : 0;

    // Calculate total descendants for each tag
    const calculateTotalDescendants = (tagId: number): number => {
      const directChildren = tagsWithStats.filter(t => t.parent_id === tagId);
      let total = directChildren.length;
      
      directChildren.forEach(child => {
        total += calculateTotalDescendants(child.id);
      });
      
      return total;
    };

    tagsWithStats.forEach(tag => {
      tag.total_descendants = calculateTotalDescendants(tag.id);
    });

    // Calculate analytics
    const totalTags = tagsWithStats.length;
    const newThisMonth = tagsWithStats.filter(tag => 
      new Date(tag.created_at) > oneMonthAgo
    ).length;
    
    // Find unused tags (no usage and no children)
    const unusedTags = tagsWithStats.filter(tag => 
      tag.usage_count === 0 && tag.direct_children === 0
    ).length;
    
    // Define popular tags as those with usage above average
    const averageUsage = tagsWithStats.reduce((sum, tag) => sum + tag.usage_count, 0) / totalTags;
    const popularTagsCount = tagsWithStats.filter(tag => tag.usage_count > averageUsage).length;
    
    // Get top used tags (sorted by usage)
    const topUsedTags = tagsWithStats
      .filter(tag => tag.usage_count > 0)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
    
    // Get orphaned tags (tags with no parent and no children)
    const orphanedTags = tagsWithStats.filter(tag => 
      !tag.parent_id && tag.direct_children === 0
    );
    
    // Get recent tags (created in the last month)
    const recentTags = tagsWithStats
      .filter(tag => new Date(tag.created_at) > oneMonthAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    const analytics: TagAnalytics = {
      totalTags,
      popularTags: popularTagsCount,
      unusedTags,
      newThisMonth,
      hierarchyDepth,
      topUsedTags,
      orphanedTags,
      recentTags
    };

    return sendSuccess(analytics);

  } catch (error) {
    console.error('Admin tag analytics error:', error);
    return sendError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});