-- ABOUTME: EVIDENS payment system database extensions for Pagar.me integration

-- =====================================================================
-- Extend users table with EVIDENS payment and subscription fields
-- =====================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS evidens_pagarme_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS evidens_subscription_status text CHECK (evidens_subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'pending')),
ADD COLUMN IF NOT EXISTS evidens_subscription_tier text CHECK (evidens_subscription_tier IN ('basic', 'premium', 'enterprise')),
ADD COLUMN IF NOT EXISTS evidens_subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS evidens_trial_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS evidens_payment_method_preference text CHECK (evidens_payment_method_preference IN ('pix', 'credit_card', 'boleto'));

-- Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_users_evidens_pagarme_customer_id ON users(evidens_pagarme_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_evidens_subscription_status ON users(evidens_subscription_status);

-- =====================================================================
-- Create EVIDENS payment transactions table
-- =====================================================================

CREATE TABLE IF NOT EXISTS evidens_payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  evidens_plan_type text NOT NULL,
  evidens_plan_price integer NOT NULL, -- Price in cents
  pagarme_order_id text UNIQUE,
  pagarme_charge_id text,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'boleto')),
  pix_qr_code text, -- For PIX payments
  pix_qr_code_url text, -- For PIX QR code images
  pix_expires_at timestamp with time zone, -- PIX expiration
  card_last_digits text, -- For credit card payments
  card_brand text, -- visa, mastercard, etc.
  evidens_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidens_payments_user_id ON evidens_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_evidens_payments_status ON evidens_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_evidens_payments_pagarme_order_id ON evidens_payment_transactions(pagarme_order_id);
CREATE INDEX IF NOT EXISTS idx_evidens_payments_created_at ON evidens_payment_transactions(created_at DESC);

-- =====================================================================
-- Create EVIDENS plan configurations table
-- =====================================================================

CREATE TABLE IF NOT EXISTS evidens_plan_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  plan_type text NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
  price_cents integer NOT NULL CHECK (price_cents > 0),
  currency text NOT NULL DEFAULT 'BRL',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  trial_days integer DEFAULT 0,
  features jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default EVIDENS plans
INSERT INTO evidens_plan_configurations (plan_name, plan_type, price_cents, billing_cycle, trial_days, features, display_order) VALUES
('Plano Básico', 'basic', 2990, 'monthly', 7, '{"reviews_per_month": 10, "analysis_features": true, "basic_support": true}', 1),
('Plano Premium', 'premium', 4990, 'monthly', 14, '{"reviews_per_month": 50, "analysis_features": true, "advanced_analytics": true, "priority_support": true}', 2),
('Plano Enterprise', 'enterprise', 9990, 'monthly', 30, '{"unlimited_reviews": true, "all_features": true, "dedicated_support": true, "custom_integrations": true}', 3)
ON CONFLICT (plan_name) DO NOTHING;

-- =====================================================================
-- Row Level Security (RLS) Policies
-- =====================================================================

-- Enable RLS on payment transactions table
ALTER TABLE evidens_payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment transactions
CREATE POLICY "Users can view own payment transactions" ON evidens_payment_transactions
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can insert their own payment transactions (for payment creation)
CREATE POLICY "Users can create own payment transactions" ON evidens_payment_transactions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Only system can update payment transactions (via Edge Functions)
CREATE POLICY "System can update payment transactions" ON evidens_payment_transactions
    FOR UPDATE TO service_role USING (true);

-- Enable RLS on plan configurations
ALTER TABLE evidens_plan_configurations ENABLE ROW LEVEL SECURITY;

-- Anyone can read active plan configurations
CREATE POLICY "Anyone can read active plans" ON evidens_plan_configurations
    FOR SELECT TO authenticated USING (is_active = true);

-- Only admins can manage plan configurations
CREATE POLICY "Admins can manage plans" ON evidens_plan_configurations
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =====================================================================
-- Utility Functions
-- =====================================================================

-- Function to get user's active subscription
CREATE OR REPLACE FUNCTION get_evidens_user_subscription(user_uuid uuid)
RETURNS TABLE (
    subscription_status text,
    subscription_tier text,
    expires_at timestamp with time zone,
    is_trial boolean,
    trial_days_remaining integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.evidens_subscription_status,
        u.evidens_subscription_tier,
        u.evidens_subscription_expires_at,
        (u.evidens_trial_started_at IS NOT NULL AND 
         u.evidens_subscription_expires_at > now()) as is_trial,
        CASE 
            WHEN u.evidens_trial_started_at IS NOT NULL AND u.evidens_subscription_expires_at > now()
            THEN EXTRACT(day FROM u.evidens_subscription_expires_at - now())::integer
            ELSE 0
        END as trial_days_remaining
    FROM users u
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update payment transaction status
CREATE OR REPLACE FUNCTION update_evidens_payment_status(
    order_id text,
    new_status text,
    pagarme_data jsonb DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    transaction_record evidens_payment_transactions%ROWTYPE;
    user_record users%ROWTYPE;
BEGIN
    -- Get the payment transaction
    SELECT * INTO transaction_record 
    FROM evidens_payment_transactions 
    WHERE pagarme_order_id = order_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Update transaction status
    UPDATE evidens_payment_transactions 
    SET 
        status = new_status,
        updated_at = now(),
        evidens_metadata = COALESCE(pagarme_data, evidens_metadata)
    WHERE pagarme_order_id = order_id;
    
    -- If payment is successful, update user subscription
    IF new_status = 'paid' THEN
        -- Get plan configuration
        DECLARE
            plan_config evidens_plan_configurations%ROWTYPE;
            expires_at timestamp with time zone;
        BEGIN
            SELECT * INTO plan_config 
            FROM evidens_plan_configurations 
            WHERE plan_type = transaction_record.evidens_plan_type;
            
            -- Calculate expiration date
            expires_at := now() + (COALESCE(plan_config.trial_days, 0) || ' days')::interval;
            IF plan_config.billing_cycle = 'monthly' THEN
                expires_at := expires_at + interval '1 month';
            ELSIF plan_config.billing_cycle = 'quarterly' THEN
                expires_at := expires_at + interval '3 months';
            ELSIF plan_config.billing_cycle = 'yearly' THEN
                expires_at := expires_at + interval '1 year';
            END IF;
            
            -- Update user subscription
            UPDATE users 
            SET 
                evidens_subscription_status = 'active',
                evidens_subscription_tier = transaction_record.evidens_plan_type,
                evidens_subscription_expires_at = expires_at,
                evidens_trial_started_at = CASE 
                    WHEN plan_config.trial_days > 0 THEN now()
                    ELSE NULL
                END,
                updated_at = now()
            WHERE id = transaction_record.user_id;
        END;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- Triggers for updated_at timestamps
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to payment transactions
DROP TRIGGER IF EXISTS set_evidens_payment_transactions_updated_at ON evidens_payment_transactions;
CREATE TRIGGER set_evidens_payment_transactions_updated_at
    BEFORE UPDATE ON evidens_payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Add updated_at trigger to plan configurations
DROP TRIGGER IF EXISTS set_evidens_plan_configurations_updated_at ON evidens_plan_configurations;
CREATE TRIGGER set_evidens_plan_configurations_updated_at
    BEFORE UPDATE ON evidens_plan_configurations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();