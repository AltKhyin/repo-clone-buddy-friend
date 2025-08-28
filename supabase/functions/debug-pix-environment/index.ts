// ABOUTME: Debug Edge Function to check current Pagar.me environment variables
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Allow GET without auth for debugging
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY')
    const pagarmeApiVersion = Deno.env.get('PAGARME_API_VERSION')
    const pagarmeWebhookId = Deno.env.get('PAGARME_WEBHOOK_ENDPOINT_ID')
    
    const debugInfo = {
      pagarme_secret_key_configured: Boolean(pagarmeSecretKey),
      pagarme_secret_key_preview: pagarmeSecretKey ? `${pagarmeSecretKey.slice(0, 8)}...` : 'NOT_SET',
      pagarme_secret_key_is_placeholder: pagarmeSecretKey?.includes('your_real') || pagarmeSecretKey?.includes('placeholder'),
      pagarme_api_version: pagarmeApiVersion || 'NOT_SET',
      webhook_id_configured: Boolean(pagarmeWebhookId),
      webhook_id_preview: pagarmeWebhookId ? `${pagarmeWebhookId.slice(0, 8)}...` : 'NOT_SET',
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify(debugInfo, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})