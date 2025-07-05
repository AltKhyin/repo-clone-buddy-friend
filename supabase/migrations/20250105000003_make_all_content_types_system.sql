-- Migration: Update all content types to be system types and add comprehensive presets
-- All content types should be standardized presets that users select from

-- Update existing content types to be system types
UPDATE "ContentTypes" SET "is_system" = true WHERE "is_system" = false;

-- Add additional comprehensive content type presets
INSERT INTO "ContentTypes" (label, description, text_color, border_color, background_color, is_system) VALUES
('Protocolo Clínico', 'Análises de protocolos e guidelines clínicos', '#7c2d12', '#dc2626', '#fecaca', true),
('Caso Clínico', 'Discussões de casos clínicos específicos', '#831843', '#be185d', '#fce7f3', true),
('Pesquisa Original', 'Estudos originais e suas análises', '#1e3a8a', '#1d4ed8', '#dbeafe', true),
('Revisão Narrativa', 'Revisões narrativas da literatura', '#365314', '#65a30d', '#ecfccb', true),
('Consenso/Diretriz', 'Documentos de consenso e diretrizes oficiais', '#44403c', '#78716c', '#f5f5f4', true),
('Tecnologia/Inovação', 'Novas tecnologias e inovações médicas', '#4c1d95', '#7c3aed', '#ede9fe', true)
ON CONFLICT DO NOTHING;

-- Update migration comment
COMMENT ON TABLE "ContentTypes" IS 'Standardized content type presets for review categorization - all types are system presets';