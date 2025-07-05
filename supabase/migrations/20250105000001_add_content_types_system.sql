-- Migration: Add Content Types system with many-to-many relationship
-- Following the established ReviewTags pattern for architectural consistency

-- Content Types table (similar to Tags structure but with color customization)
CREATE TABLE "ContentTypes" (
  "id" SERIAL PRIMARY KEY,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "text_color" VARCHAR(7) NOT NULL DEFAULT '#1f2937',
  "border_color" VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  "background_color" VARCHAR(7) NOT NULL DEFAULT '#dbeafe',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "Practitioners"(id),
  "is_system" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Many-to-many junction table (following ReviewTags pattern exactly)
CREATE TABLE "ReviewContentTypes" (
  "id" SERIAL PRIMARY KEY,
  "review_id" INT NOT NULL REFERENCES "Reviews"(id) ON DELETE CASCADE,
  "content_type_id" INT NOT NULL REFERENCES "ContentTypes"(id) ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("review_id", "content_type_id")
);

-- Performance indexes (following established patterns)
CREATE INDEX "idx_review_content_types_review_id" ON "ReviewContentTypes"("review_id");
CREATE INDEX "idx_review_content_types_content_type_id" ON "ReviewContentTypes"("content_type_id");
CREATE INDEX "idx_content_types_label" ON "ContentTypes"("label");

-- Insert default content types with carefully chosen colors
INSERT INTO "ContentTypes" (label, description, text_color, border_color, background_color, is_system) VALUES
('Review', 'Review padrão do sistema', '#374151', '#6b7280', '#f3f4f6', true),
('Análise de Artigo', 'Análise detalhada de artigos científicos', '#1e40af', '#3b82f6', '#dbeafe', true),
('Artigo de Opinião', 'Artigos de opinião e perspectivas', '#065f46', '#10b981', '#d1fae5', true),
('Meta-análise', 'Revisões de meta-análises', '#9a3412', '#ea580c', '#fed7aa', true),
('Revisão Sistemática', 'Análises de revisões sistemáticas', '#581c87', '#8b5cf6', '#e9d5ff', true),
('Editorial', 'Comentários editoriais', '#be185d', '#ec4899', '#fce7f3', true),
('Relato de Caso', 'Relatos de casos clínicos', '#0c4a6e', '#0284c7', '#e0f2fe', true),
('Diretrizes', 'Análises de diretrizes clínicas', '#166534', '#16a34a', '#dcfce7', true);

-- Comment for documentation
COMMENT ON TABLE "ContentTypes" IS 'Customizable content type labels with styling for review categorization';
COMMENT ON TABLE "ReviewContentTypes" IS 'Many-to-many relationship between reviews and content types';