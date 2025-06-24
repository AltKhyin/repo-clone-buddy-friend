
-- MILESTONE 1: Foundation Enhancement for Management Blueprint
-- This creates the necessary database infrastructure to support advanced admin features

-- M1.1: Database Schema Enhancements

-- Create UserRoles table for granular role management
CREATE TABLE public."UserRoles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id UUID NOT NULL REFERENCES public."Practitioners"(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL CHECK (role_name IN ('admin', 'editor', 'moderator', 'practitioner')),
    granted_by UUID REFERENCES public."Practitioners"(id),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(practitioner_id, role_name)
);

-- Create SystemAuditLog table for comprehensive audit trails
CREATE TABLE public."SystemAuditLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by UUID NOT NULL REFERENCES public."Practitioners"(id),
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Extend SiteSettings with management-specific configurations
ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_roles_practitioner_active ON public."UserRoles"(practitioner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_active ON public."UserRoles"(role_name, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON public."SystemAuditLog"(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public."SystemAuditLog"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public."SystemAuditLog"(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON public."SiteSettings"(category);

-- Create management-specific database functions

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public."UserRoles" ur
        WHERE ur.practitioner_id = p_user_id 
        AND ur.role_name = p_role_name 
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_performed_by UUID,
    p_action_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public."SystemAuditLog" (
        performed_by,
        action_type,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        p_performed_by,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_metadata
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- Function to get user's effective roles
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS TABLE(role_name TEXT, granted_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role_name,
        ur.granted_at,
        ur.expires_at
    FROM public."UserRoles" ur
    WHERE ur.practitioner_id = p_user_id 
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY ur.granted_at DESC;
END;
$$;

-- M1.2: Enhanced RLS Policies

-- Enable RLS on new tables
ALTER TABLE public."UserRoles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SystemAuditLog" ENABLE ROW LEVEL SECURITY;

-- UserRoles RLS Policies
CREATE POLICY "Admins can manage all user roles"
ON public."UserRoles"
FOR ALL
TO authenticated
USING (
    public.user_has_role(auth.uid(), 'admin') OR
    public.user_has_role(auth.uid(), 'editor')
)
WITH CHECK (
    public.user_has_role(auth.uid(), 'admin') OR
    public.user_has_role(auth.uid(), 'editor')
);

CREATE POLICY "Users can view their own roles"
ON public."UserRoles"
FOR SELECT
TO authenticated
USING (practitioner_id = auth.uid());

-- SystemAuditLog RLS Policies
CREATE POLICY "Admins can view all audit logs"
ON public."SystemAuditLog"
FOR SELECT
TO authenticated
USING (
    public.user_has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view their own audit logs"
ON public."SystemAuditLog"
FOR SELECT
TO authenticated
USING (performed_by = auth.uid());

CREATE POLICY "System can insert audit logs"
ON public."SystemAuditLog"
FOR INSERT
TO authenticated
WITH CHECK (performed_by = auth.uid());

-- Enhanced SiteSettings RLS Policies
CREATE POLICY "Admins can manage all site settings"
ON public."SiteSettings"
FOR ALL
TO authenticated
USING (
    public.user_has_role(auth.uid(), 'admin')
)
WITH CHECK (
    public.user_has_role(auth.uid(), 'admin')
);

CREATE POLICY "Public site settings are viewable by all"
ON public."SiteSettings"
FOR SELECT
TO authenticated
USING (is_public = true);

-- Insert default admin role for existing admin users (if any)
-- This will be handled by the Edge Functions when role assignments are made

-- Create trigger to automatically log audit events for critical tables
CREATE OR REPLACE FUNCTION public.trigger_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only log for authenticated users
    IF auth.uid() IS NOT NULL THEN
        PERFORM public.log_audit_event(
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id::TEXT, OLD.id::TEXT),
            CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
            jsonb_build_object('table_schema', TG_TABLE_SCHEMA)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_practitioners_changes
    AFTER INSERT OR UPDATE OR DELETE ON public."Practitioners"
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

CREATE TRIGGER audit_reviews_changes
    AFTER INSERT OR UPDATE OR DELETE ON public."Reviews"
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public."UserRoles"
    FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();
