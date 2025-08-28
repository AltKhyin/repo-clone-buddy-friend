-- Create table to track payment configuration updates from admin UI
CREATE TABLE payment_config_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_manual_update',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    created_by UUID REFERENCES Practitioners(id),
    notes TEXT
);

-- Add RLS policies
ALTER TABLE payment_config_updates ENABLE ROW LEVEL SECURITY;

-- Only admins can view payment config updates
CREATE POLICY "Admins can view payment config updates" ON payment_config_updates
    FOR SELECT TO authenticated
    USING (get_my_claim('role') IN ('admin', 'super_admin'));

-- Only admins can insert payment config updates  
CREATE POLICY "Admins can insert payment config updates" ON payment_config_updates
    FOR INSERT TO authenticated
    WITH CHECK (get_my_claim('role') IN ('admin', 'super_admin'));

-- Only admins can update payment config updates
CREATE POLICY "Admins can update payment config updates" ON payment_config_updates
    FOR UPDATE TO authenticated
    USING (get_my_claim('role') IN ('admin', 'super_admin'))
    WITH CHECK (get_my_claim('role') IN ('admin', 'super_admin'));

-- Create index for performance
CREATE INDEX idx_payment_config_updates_created_at ON payment_config_updates(created_at DESC);
CREATE INDEX idx_payment_config_updates_status ON payment_config_updates(status);