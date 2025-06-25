
// ABOUTME: Edge function for admins/editors to reward community content with comprehensive security checks.

import { 
  serve,
  createClient,
  corsHeaders,
  handleCorsPreflightRequest,
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
  checkRateLimit,
  rateLimitHeaders,
  RateLimitError
} from '../_shared/imports.ts';

interface RewardRequest {
  content_id: number;
}

interface RewardResponse {
  success: boolean;
  rewarded_content: any;
  message: string;
}

serve(async (req) => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 3: Rate Limiting
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 20 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Authentication & Authorization (Required for rewarding)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required for content rewarding');
    }

    const user = await authenticateUser(supabase, authHeader);
    
    // Verify admin/editor privileges
    const { data: practitioner, error: practitionerError } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (practitionerError || !practitioner || !['admin', 'editor'].includes(practitioner.role)) {
      throw new Error('FORBIDDEN: Admin or editor privileges required for content rewarding');
    }

    // STEP 5: Input Validation
    const body: RewardRequest = await req.json();
    
    if (!body.content_id || typeof body.content_id !== 'number') {
      throw new Error('VALIDATION_FAILED: Invalid content_id provided');
    }

    // STEP 6: Core Business Logic
    const { data, error: updateError } = await supabase
      .from('CommunityPosts')
      .update({ is_rewarded: true })
      .eq('id', body.content_id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new Error('NOT_FOUND: Content not found');
      }
      throw new Error(`Database error: ${updateError.message}`);
    }

    const response: RewardResponse = {
      success: true,
      rewarded_content: data,
      message: 'Content rewarded successfully'
    };

    // STEP 7: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in reward-content:', error);
    return createErrorResponse(error);
  }
});
