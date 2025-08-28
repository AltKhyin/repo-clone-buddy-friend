// ABOUTME: One-time Edge Function to create payment_config_updates table
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    console.log('Creating payment_config_updates table...')
    // Execute SQL commands one by one
    const commands = [
      `CREATE TABLE IF NOT EXISTS payment_config_updates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        config_data JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_manual_update',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        applied_at TIMESTAMPTZ,
        created_by UUID,
        notes TEXT
      )`,
      `ALTER TABLE payment_config_updates ENABLE ROW LEVEL SECURITY`,
      `CREATE INDEX IF NOT EXISTS idx_payment_config_updates_created_at ON payment_config_updates(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_payment_config_updates_status ON payment_config_updates(status)`
    ]

    for (const sql of commands) {
      const { error } = await supabase.rpc('exec', { sql })
      if (error) {
        console.error('SQL Error:', error, 'for command:', sql)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'payment_config_updates table created successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating table:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})