-- Add color and description columns to Tags table
ALTER TABLE public."Tags" 
ADD COLUMN IF NOT EXISTS color VARCHAR(7),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add some default colors for existing tags
UPDATE public."Tags" 
SET color = CASE 
    WHEN tag_name = 'Cardiologia' THEN '#EF4444'
    WHEN tag_name = 'Neurologia' THEN '#8B5CF6'
    WHEN tag_name = 'Pediatria' THEN '#10B981'
    WHEN tag_name = 'Medicina Interna' THEN '#3B82F6'
    WHEN tag_name = 'Cirurgia' THEN '#F59E0B'
    WHEN tag_name = 'Radiologia' THEN '#6366F1'
    WHEN tag_name = 'Farmacologia' THEN '#14B8A6'
    WHEN tag_name = 'Medicina de Emergência' THEN '#DC2626'
    WHEN tag_name = 'Psiquiatria' THEN '#7C3AED'
    WHEN tag_name = 'Dermatologia' THEN '#EC4899'
    ELSE NULL
END
WHERE parent_id IS NULL AND color IS NULL;

-- Add descriptions for main categories
UPDATE public."Tags" 
SET description = CASE 
    WHEN tag_name = 'Cardiologia' THEN 'Especialidade médica que trata do coração e sistema circulatório'
    WHEN tag_name = 'Neurologia' THEN 'Especialidade médica que trata do sistema nervoso'
    WHEN tag_name = 'Pediatria' THEN 'Especialidade médica dedicada ao cuidado de crianças e adolescentes'
    WHEN tag_name = 'Medicina Interna' THEN 'Especialidade médica que trata de doenças em adultos'
    WHEN tag_name = 'Cirurgia' THEN 'Especialidade médica que realiza procedimentos operatórios'
    WHEN tag_name = 'Radiologia' THEN 'Especialidade médica de diagnóstico por imagem'
    WHEN tag_name = 'Farmacologia' THEN 'Estudo dos medicamentos e seus efeitos no organismo'
    WHEN tag_name = 'Medicina de Emergência' THEN 'Especialidade médica focada em urgências e emergências'
    WHEN tag_name = 'Psiquiatria' THEN 'Especialidade médica que trata transtornos mentais'
    WHEN tag_name = 'Dermatologia' THEN 'Especialidade médica que trata da pele e anexos'
    ELSE NULL
END
WHERE parent_id IS NULL AND description IS NULL;