-- ABOUTME: Creates comprehensive community management system with dynamic sidebar sections, categories, announcements, and admin features

-- =============================================================================
-- Community Categories System (following ContentTypes pattern)
-- =============================================================================

CREATE TABLE "CommunityCategories" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  text_color VARCHAR(7) NOT NULL DEFAULT '#1f2937',
  border_color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  background_color VARCHAR(7) NOT NULL DEFAULT '#dbeafe',
  icon_name TEXT, -- For Lucide icon names
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL
);

-- Index for efficient querying
CREATE INDEX idx_community_categories_active_order ON "CommunityCategories" (is_active, display_order);
CREATE INDEX idx_community_categories_name ON "CommunityCategories" (name);

-- =============================================================================
-- Community Sidebar Sections System
-- =============================================================================

CREATE TABLE "CommunitySidebarSections" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL CHECK (section_type IN ('about', 'links', 'rules', 'moderators', 'categories', 'announcements', 'countdown', 'custom')),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL
);

-- Index for efficient querying
CREATE INDEX idx_community_sidebar_sections_visible_order ON "CommunitySidebarSections" (is_visible, display_order);
CREATE INDEX idx_community_sidebar_sections_type ON "CommunitySidebarSections" (section_type);

-- =============================================================================
-- Community Announcements System
-- =============================================================================

CREATE TABLE "CommunityAnnouncements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('announcement', 'news', 'changelog', 'event')),
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 5),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_community_announcements_published ON "CommunityAnnouncements" (is_published, published_at DESC);
CREATE INDEX idx_community_announcements_featured ON "CommunityAnnouncements" (is_featured, priority DESC);
CREATE INDEX idx_community_announcements_type ON "CommunityAnnouncements" (type);

-- =============================================================================
-- Community Countdowns System
-- =============================================================================

CREATE TABLE "CommunityCountdowns" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_format TEXT NOT NULL DEFAULT 'days_hours_minutes' CHECK (display_format IN ('days_hours_minutes', 'hours_minutes', 'days_only')),
  completed_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL
);

-- Index for efficient querying
CREATE INDEX idx_community_countdowns_active_featured ON "CommunityCountdowns" (is_active, is_featured, target_date);

-- =============================================================================
-- Community Custom Sections System
-- =============================================================================

CREATE TABLE "CommunityCustomSections" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sidebar_section_id UUID REFERENCES "CommunitySidebarSections"(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'html', 'markdown', 'button', 'image', 'link_list')),
  content_data JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL
);

-- Index for efficient querying
CREATE INDEX idx_community_custom_sections_sidebar_order ON "CommunityCustomSections" (sidebar_section_id, display_order);
CREATE INDEX idx_community_custom_sections_visible ON "CommunityCustomSections" (is_visible);

-- =============================================================================
-- Community Online Users Tracking System
-- =============================================================================

CREATE TABLE "CommunityOnlineUsers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "Practitioners"(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_viewing_community BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_community_online_users_last_seen ON "CommunityOnlineUsers" (last_seen_at DESC);
CREATE INDEX idx_community_online_users_viewing ON "CommunityOnlineUsers" (is_viewing_community, last_seen_at DESC);

-- =============================================================================
-- Update existing CommunityPosts to use new category system
-- =============================================================================

ALTER TABLE "CommunityPosts" 
ADD COLUMN category_id INTEGER REFERENCES "CommunityCategories"(id) ON DELETE SET NULL;

-- Create index for efficient querying
CREATE INDEX idx_community_posts_category_id ON "CommunityPosts" (category_id);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- CommunityCategories - Public read, admin write
ALTER TABLE "CommunityCategories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_categories_public_read" ON "CommunityCategories"
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "community_categories_admin_all" ON "CommunityCategories"
  FOR ALL TO authenticated
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

-- CommunitySidebarSections - Public read, admin write
ALTER TABLE "CommunitySidebarSections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_sidebar_sections_public_read" ON "CommunitySidebarSections"
  FOR SELECT TO public
  USING (is_visible = true);

CREATE POLICY "community_sidebar_sections_admin_all" ON "CommunitySidebarSections"
  FOR ALL TO authenticated
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

-- CommunityAnnouncements - Public read published, admin write
ALTER TABLE "CommunityAnnouncements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_announcements_public_read" ON "CommunityAnnouncements"
  FOR SELECT TO public
  USING (is_published = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "community_announcements_admin_all" ON "CommunityAnnouncements"
  FOR ALL TO authenticated
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

-- CommunityCountdowns - Public read active, admin write
ALTER TABLE "CommunityCountdowns" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_countdowns_public_read" ON "CommunityCountdowns"
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "community_countdowns_admin_all" ON "CommunityCountdowns"
  FOR ALL TO authenticated
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

-- CommunityCustomSections - Public read visible, admin write
ALTER TABLE "CommunityCustomSections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_custom_sections_public_read" ON "CommunityCustomSections"
  FOR SELECT TO public
  USING (is_visible = true);

CREATE POLICY "community_custom_sections_admin_all" ON "CommunityCustomSections"
  FOR ALL TO authenticated
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

-- CommunityOnlineUsers - Users can update their own, public read
ALTER TABLE "CommunityOnlineUsers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_online_users_own_write" ON "CommunityOnlineUsers"
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_online_users_public_read" ON "CommunityOnlineUsers"
  FOR SELECT TO public
  USING (true);

-- =============================================================================
-- Insert Default Data
-- =============================================================================

-- Insert default community categories (migrating from hardcoded values)
INSERT INTO "CommunityCategories" (name, label, description, text_color, background_color, border_color, display_order, is_system) VALUES
('discussao-geral', 'Discussão Geral', 'Discussões gerais sobre medicina e saúde', '#1f2937', '#f3f4f6', '#d1d5db', 1, true),
('duvida-clinica', 'Dúvida Clínica', 'Dúvidas sobre casos clínicos e práticas médicas', '#1f2937', '#fef3c7', '#fbbf24', 2, true),
('caso-clinico', 'Caso Clínico', 'Discussão de casos clínicos interessantes', '#1f2937', '#dcfce7', '#16a34a', 3, true),
('evidencia-cientifica', 'Evidência Científica', 'Artigos científicos e evidências médicas', '#1f2937', '#dbeafe', '#3b82f6', 4, true),
('tecnologia-saude', 'Tecnologia & Saúde', 'Tecnologias aplicadas à medicina e saúde', '#1f2937', '#e0e7ff', '#6366f1', 5, true),
('carreira-medicina', 'Carreira em Medicina', 'Discussões sobre carreira médica e especialidades', '#1f2937', '#fdf2f8', '#ec4899', 6, true),
('bem-estar-medico', 'Bem-estar Médico', 'Bem-estar e qualidade de vida dos profissionais de saúde', '#1f2937', '#f0fdf4', '#22c55e', 7, true);

-- Insert default sidebar sections
INSERT INTO "CommunitySidebarSections" (section_type, title, content, display_order, is_system) VALUES
('about', 'Sobre a Comunidade', '{"description": "Comunidade de profissionais da saúde dedicada ao compartilhamento de conhecimento e discussões sobre medicina baseada em evidências.", "member_count_enabled": true, "online_users_enabled": true}', 1, true),
('links', 'Links Úteis', '{"links": [{"title": "Diretrizes Clínicas", "url": "/diretrizes", "description": "Acesso às principais diretrizes médicas"}, {"title": "Calculadoras Médicas", "url": "/calculadoras", "description": "Ferramentas para cálculos clínicos"}]}', 2, true),
('rules', 'Regras da Comunidade', '{"rules": ["Mantenha o respeito profissional", "Compartilhe apenas conteúdo baseado em evidências", "Proteja a privacidade dos pacientes", "Seja construtivo nas discussões"]}', 3, true),
('moderators', 'Moderadores', '{"show_moderators": true, "show_contact_button": true}', 4, true),
('categories', 'Filtrar por Categoria', '{"show_all_categories": true, "show_post_count": true}', 5, true),
('announcements', 'Novidades', '{"show_recent_announcements": true, "max_items": 3}', 6, true);

-- Insert default countdown (example)
INSERT INTO "CommunityCountdowns" (title, description, target_date, is_active, is_featured) VALUES
('Próxima Edição da Revista', 'Contagem regressiva para a próxima edição da revista médica', '2025-02-01 00:00:00+00', true, true);

-- Insert default announcement
INSERT INTO "CommunityAnnouncements" (title, content, type, is_published, is_featured, published_at, priority) VALUES
('Bem-vindos à Nova Comunidade!', 'Estamos felizes em apresentar nossa nova plataforma de discussões médicas. Participem e compartilhem conhecimento!', 'announcement', true, true, NOW(), 5);

-- =============================================================================
-- Utility Functions
-- =============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON "CommunityCategories" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_sidebar_sections_updated_at BEFORE UPDATE ON "CommunitySidebarSections" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_announcements_updated_at BEFORE UPDATE ON "CommunityAnnouncements" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_countdowns_updated_at BEFORE UPDATE ON "CommunityCountdowns" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_custom_sections_updated_at BEFORE UPDATE ON "CommunityCustomSections" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_online_users_updated_at BEFORE UPDATE ON "CommunityOnlineUsers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get online users count
CREATE OR REPLACE FUNCTION get_online_users_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM "CommunityOnlineUsers"
  WHERE last_seen_at > NOW() - INTERVAL '5 minutes'
  AND is_viewing_community = true;
$$;

-- Function to get total community members count
CREATE OR REPLACE FUNCTION get_community_members_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT author_id)::INTEGER
  FROM "CommunityPosts"
  WHERE author_id IS NOT NULL;
$$;

-- Function to update user online status
CREATE OR REPLACE FUNCTION update_user_online_status(p_user_id UUID, p_is_viewing_community BOOLEAN DEFAULT true)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "CommunityOnlineUsers" (user_id, is_viewing_community)
  VALUES (p_user_id, p_is_viewing_community)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_seen_at = NOW(),
    is_viewing_community = p_is_viewing_community,
    updated_at = NOW();
END;
$$;

-- Function to get recent online users with avatars
CREATE OR REPLACE FUNCTION get_recent_online_users(p_limit INTEGER DEFAULT 7)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  last_seen_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    cou.user_id,
    p.full_name,
    p.avatar_url,
    cou.last_seen_at
  FROM "CommunityOnlineUsers" cou
  JOIN "Practitioners" p ON cou.user_id = p.id
  WHERE cou.last_seen_at > NOW() - INTERVAL '5 minutes'
  AND cou.is_viewing_community = true
  ORDER BY cou.last_seen_at DESC
  LIMIT p_limit;
$$;