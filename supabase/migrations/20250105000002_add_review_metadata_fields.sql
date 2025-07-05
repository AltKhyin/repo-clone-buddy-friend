-- Migration: Add new review metadata fields and configure study types
-- Extends Reviews table with edition and article data fields

-- Add new review metadata fields to Reviews table
ALTER TABLE "Reviews" 
ADD COLUMN "edicao" TEXT,
ADD COLUMN "original_article_title" TEXT,
ADD COLUMN "original_article_authors" TEXT,
ADD COLUMN "original_article_publication_date" DATE,
ADD COLUMN "study_type" TEXT;

-- Study types configuration with comprehensive preset in SiteSettings
INSERT INTO "SiteSettings" (key, value, description, category) VALUES
('study_types', '[
  "Revisão Sistemática",
  "Meta-análise", 
  "Ensaio Clínico Randomizado (RCT)",
  "Estudo de Coorte Prospectivo",
  "Estudo de Coorte Retrospectivo",
  "Estudo Caso-Controle",
  "Estudo Transversal",
  "Estudo Ecológico",
  "Relato de Caso",
  "Série de Casos",
  "Ensaio Clínico Não-Randomizado",
  "Estudo Piloto",
  "Estudo de Validação",
  "Análise Secundária",
  "Revisão Narrativa",
  "Scoping Review",
  "Umbrella Review",
  "Overview",
  "Rapid Review",
  "Living Review"
]'::jsonb, 'Available study design types for articles', 'review_metadata');

-- Migrate existing reviews to have default "Review" content type
-- This ensures backward compatibility for all existing content
INSERT INTO "ReviewContentTypes" (review_id, content_type_id)
SELECT r.id, ct.id 
FROM "Reviews" r 
CROSS JOIN "ContentTypes" ct 
WHERE ct.label = 'Review' 
  AND ct.is_system = true
  AND NOT EXISTS (
    SELECT 1 FROM "ReviewContentTypes" rct 
    WHERE rct.review_id = r.id AND rct.content_type_id = ct.id
  );

-- Add comments for documentation
COMMENT ON COLUMN "Reviews"."edicao" IS 'Review edition information (e.g., "1ª edição", "2ª edição revisada")';
COMMENT ON COLUMN "Reviews"."original_article_title" IS 'Title of the original scientific article being reviewed';
COMMENT ON COLUMN "Reviews"."original_article_authors" IS 'Authors of the original article';
COMMENT ON COLUMN "Reviews"."original_article_publication_date" IS 'Publication date of the original article';
COMMENT ON COLUMN "Reviews"."study_type" IS 'Type of study design from configurable list';