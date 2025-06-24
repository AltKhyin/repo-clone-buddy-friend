
-- Insert parent tags (main categories) without ON CONFLICT since there's no unique constraint
INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Cardiologia', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Cardiologia');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Neurologia', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Neurologia');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Pediatria', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Pediatria');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Medicina Interna', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Medicina Interna');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Cirurgia', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Cirurgia');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Radiologia', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Radiologia');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Farmacologia', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Farmacologia');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Medicina de Emergência', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Medicina de Emergência');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Psiquiatria', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Psiquiatria');

INSERT INTO public."Tags" (tag_name, parent_id, created_at) 
SELECT 'Dermatologia', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Dermatologia');

-- Insert child tags with proper parent references
INSERT INTO public."Tags" (tag_name, parent_id, created_at)
SELECT 'Cardiologia Intervencionista', t.id, NOW()
FROM public."Tags" t
WHERE t.tag_name = 'Cardiologia'
AND NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Cardiologia Intervencionista');

INSERT INTO public."Tags" (tag_name, parent_id, created_at)
SELECT 'Eletrofisiologia', t.id, NOW()
FROM public."Tags" t
WHERE t.tag_name = 'Cardiologia'
AND NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Eletrofisiologia');

INSERT INTO public."Tags" (tag_name, parent_id, created_at)
SELECT 'Neurologia Pediátrica', t.id, NOW()
FROM public."Tags" t
WHERE t.tag_name = 'Neurologia'
AND NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Neurologia Pediátrica');

INSERT INTO public."Tags" (tag_name, parent_id, created_at)
SELECT 'AVC', t.id, NOW()
FROM public."Tags" t
WHERE t.tag_name = 'Neurologia'
AND NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'AVC');

INSERT INTO public."Tags" (tag_name, parent_id, created_at)
SELECT 'Medicina Intensiva Pediátrica', t.id, NOW()
FROM public."Tags" t
WHERE t.tag_name = 'Pediatria'
AND NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Medicina Intensiva Pediátrica');

INSERT INTO public."Tags" (tag_name, parent_id, created_at)
SELECT 'Neonatologia', t.id, NOW()
FROM public."Tags" t
WHERE t.tag_name = 'Pediatria'
AND NOT EXISTS (SELECT 1 FROM public."Tags" WHERE tag_name = 'Neonatologia');
