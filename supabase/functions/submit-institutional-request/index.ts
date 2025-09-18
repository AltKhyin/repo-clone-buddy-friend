// ABOUTME: Edge Function for submitting institutional plan requests with rate limiting and validation.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

// Validation schemas
interface InstitutionalRequestPayload {
  name: string;
  phone: string;
  email: string;
  business_name: string;
  specific_needs: string;
}

interface InstitutionalRequestResponse {
  message: string;
  request_id: string;
}

const validatePayload = (payload: any): InstitutionalRequestPayload => {
  const { name, phone, email, business_name, specific_needs } = payload;

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('VALIDATION_FAILED: Nome é obrigatório');
  }
  if (name.trim().length > 100) {
    throw new Error('VALIDATION_FAILED: Nome deve ter no máximo 100 caracteres');
  }

  // Phone validation (Brazilian format)
  if (!phone || typeof phone !== 'string') {
    throw new Error('VALIDATION_FAILED: Telefone é obrigatório');
  }
  const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
  if (!phoneRegex.test(phone.trim())) {
    throw new Error('VALIDATION_FAILED: Formato de telefone inválido. Use: (11) 99999-9999');
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    throw new Error('VALIDATION_FAILED: Email é obrigatório');
  }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('VALIDATION_FAILED: Formato de email inválido');
  }
  if (email.trim().length > 320) {
    throw new Error('VALIDATION_FAILED: Email deve ter no máximo 320 caracteres');
  }

  // Business name validation
  if (!business_name || typeof business_name !== 'string' || business_name.trim().length === 0) {
    throw new Error('VALIDATION_FAILED: Nome da empresa é obrigatório');
  }
  if (business_name.trim().length > 200) {
    throw new Error('VALIDATION_FAILED: Nome da empresa deve ter no máximo 200 caracteres');
  }

  // Specific needs validation
  if (!specific_needs || typeof specific_needs !== 'string' || specific_needs.trim().length === 0) {
    throw new Error('VALIDATION_FAILED: Necessidades específicas são obrigatórias');
  }
  if (specific_needs.trim().length < 10) {
    throw new Error('VALIDATION_FAILED: Necessidades específicas devem ter no mínimo 10 caracteres');
  }
  if (specific_needs.trim().length > 1000) {
    throw new Error('VALIDATION_FAILED: Necessidades específicas devem ter no máximo 1000 caracteres');
  }

  return {
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    business_name: business_name.trim(),
    specific_needs: specific_needs.trim()
  };
};

serve(async (req: Request) => {
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

    // STEP 3: Rate Limiting (5 requests per minute for institutional requests)
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 5 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Input Validation
    const payload = await req.json();
    const validatedPayload = validatePayload(payload);

    console.log(`Submitting institutional request for "${validatedPayload.business_name}" by ${validatedPayload.name}`);

    // STEP 5: Core Business Logic - Insert request
    const { data: newRequest, error: insertError } = await supabase
      .from('institutional_plan_requests')
      .insert({
        name: validatedPayload.name,
        phone: validatedPayload.phone,
        email: validatedPayload.email,
        business_name: validatedPayload.business_name,
        specific_needs: validatedPayload.specific_needs,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insertion error:', insertError);
      throw new Error(`Failed to submit request: ${insertError.message}`);
    }

    console.log('Institutional request submitted successfully:', newRequest.id);

    const response: InstitutionalRequestResponse = {
      message: 'Solicitação enviada com sucesso! Entraremos em contato em breve.',
      request_id: newRequest.id
    };

    // STEP 6: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult), origin);

  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Error in submit-institutional-request:', error);
    return createErrorResponse(error, {}, origin);
  }
});