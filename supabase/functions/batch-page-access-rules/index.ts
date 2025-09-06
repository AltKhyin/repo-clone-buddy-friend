// ABOUTME: Batch endpoint to fetch all page access rules in one request for session caching

import { corsHeaders, sendSuccess, sendError } from '../_shared/cors.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      PageAccessControl: {
        Row: {
          id: number;
          page_path: string;
          required_access_level: 'public' | 'free' | 'premium' | 'editor_admin';
          redirect_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify authentication (optional - public endpoint for caching)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(jwt);
      if (error && error.message !== 'Invalid JWT') {
        return sendError('Authentication error', 401);
      }
      // Continue regardless - public data
    }

    // Fetch all active page access rules
    const { data: pageRules, error } = await supabase
      .from('PageAccessControl')
      .select('page_path, required_access_level, redirect_url, is_active')
      .eq('is_active', true)
      .order('page_path');

    if (error) {
      console.error('Database error:', error);
      return sendError('Failed to fetch page access rules', 500);
    }

    // Transform for frontend consumption
    const rules = pageRules.map(rule => ({
      page_path: rule.page_path,
      required_access_level: rule.required_access_level,
      redirect_url: rule.redirect_url,
      is_active: rule.is_active
    }));

    return sendSuccess({
      rules,
      cached_at: new Date().toISOString(),
      count: rules.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return sendError('Internal server error', 500);
  }
}