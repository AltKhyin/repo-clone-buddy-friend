
-- Add mock reviews with proper tag associations
-- This migration creates sample content for the Acervo page

-- Insert mock reviews
INSERT INTO public."Reviews" (
  title, 
  slug, 
  description, 
  content, 
  cover_image_url, 
  view_count, 
  is_published, 
  is_featured,
  created_at,
  updated_at
) VALUES
('Manejo da Fibrilação Atrial em Idosos', 'manejo-fibrilacao-atrial-idosos', 'Uma revisão abrangente sobre o tratamento da fibrilação atrial em pacientes geriátricos', '{"blocks":[{"type":"heading","data":{"text":"Introdução","level":2}},{"type":"text","data":{"text":"A fibrilação atrial é a arritmia mais comum em idosos..."}}]}', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop', 1247, true, true, NOW() - INTERVAL '2 days', NOW()),

('Neuroproteção em AVC Isquêmico', 'neuroprotecao-avc-isquemico', 'Estratégias modernas de neuroproteção no tratamento do AVC isquêmico agudo', '{"blocks":[{"type":"heading","data":{"text":"Fisiopatologia","level":2}},{"type":"text","data":{"text":"O AVC isquêmico resulta da interrupção do fluxo sanguíneo cerebral..."}}]}', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop', 892, true, false, NOW() - INTERVAL '5 days', NOW()),

('Medicina Intensiva Pediátrica: Ventilação Mecânica', 'medicina-intensiva-pediatrica-ventilacao', 'Princípios e práticas da ventilação mecânica em pediatria', '{"blocks":[{"type":"heading","data":{"text":"Indicações","level":2}},{"type":"text","data":{"text":"A ventilação mecânica em pediatria requer considerações especiais..."}}]}', 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=800&h=600&fit=crop', 634, true, false, NOW() - INTERVAL '7 days', NOW()),

('Farmacologia Cardiovascular Moderna', 'farmacologia-cardiovascular-moderna', 'Novos medicamentos e abordagens terapêuticas em cardiologia', '{"blocks":[{"type":"heading","data":{"text":"Inibidores SGLT2","level":2}},{"type":"text","data":{"text":"Os inibidores SGLT2 revolucionaram o tratamento da insuficiência cardíaca..."}}]}', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop', 1156, true, false, NOW() - INTERVAL '10 days', NOW()),

('Cirurgia Robótica em Urologia', 'cirurgia-robotica-urologia', 'Aplicações e benefícios da cirurgia robótica em procedimentos urológicos', '{"blocks":[{"type":"heading","data":{"text":"Vantagens","level":2}},{"type":"text","data":{"text":"A cirurgia robótica oferece precisão superior e menor invasividade..."}}]}', 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=600&fit=crop', 723, true, false, NOW() - INTERVAL '12 days', NOW()),

('Radiologia Intervencionista em Emergências', 'radiologia-intervencionista-emergencias', 'Procedimentos de radiologia intervencionista no atendimento de emergência', '{"blocks":[{"type":"heading","data":{"text":"Embolização","level":2}},{"type":"text","data":{"text":"A embolização é fundamental no controle de hemorragias graves..."}}]}', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop', 445, true, false, NOW() - INTERVAL '15 days', NOW()),

('Psiquiatria Geriátrica: Depressão e Demência', 'psiquiatria-geriatrica-depressao-demencia', 'Diagnóstico diferencial entre depressão e demência em idosos', '{"blocks":[{"type":"heading","data":{"text":"Avaliação Clínica","level":2}},{"type":"text","data":{"text":"A distinção entre depressão e demência requer avaliação cuidadosa..."}}]}', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop', 567, true, false, NOW() - INTERVAL '18 days', NOW()),

('Dermatologia Oncológica: Melanoma', 'dermatologia-oncologica-melanoma', 'Diagnóstico precoce e tratamento do melanoma cutâneo', '{"blocks":[{"type":"heading","data":{"text":"Diagnóstico","level":2}},{"type":"text","data":{"text":"O diagnóstico precoce do melanoma é crucial para o prognóstico..."}}]}', 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=800&h=600&fit=crop', 892, true, false, NOW() - INTERVAL '20 days', NOW());

-- Associate reviews with tags
-- First, get the tag IDs and review IDs, then create associations

-- Cardiologia tags
INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'manejo-fibrilacao-atrial-idosos' AND t.tag_name = 'Cardiologia';

INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'manejo-fibrilacao-atrial-idosos' AND t.tag_name = 'Eletrofisiologia';

INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'farmacologia-cardiovascular-moderna' AND t.tag_name = 'Cardiologia';

INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'farmacologia-cardiovascular-moderna' AND t.tag_name = 'Farmacologia';

-- Neurologia tags
INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'neuroprotecao-avc-isquemico' AND t.tag_name = 'Neurologia';

INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'neuroprotecao-avc-isquemico' AND t.tag_name = 'AVC';

-- Pediatria tags
INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'medicina-intensiva-pediatrica-ventilacao' AND t.tag_name = 'Pediatria';

INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'medicina-intensiva-pediatrica-ventilacao' AND t.tag_name = 'Medicina Intensiva Pediátrica';

-- Cirurgia tags
INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'cirurgia-robotica-urologia' AND t.tag_name = 'Cirurgia';

-- Radiologia tags
INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'radiologia-intervencionista-emergencias' AND t.tag_name = 'Radiologia';

INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'radiologia-intervencionista-emergencias' AND t.tag_name = 'Medicina de Emergência';

-- Psiquiatria tags
INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'psiquiatria-geriatrica-depressao-demencia' AND t.tag_name = 'Psiquiatria';

-- Dermatologia tags
INSERT INTO public."Review_Tags" (review_id, tag_id)
SELECT r.id, t.id
FROM public."Reviews" r, public."Tags" t
WHERE r.slug = 'dermatologia-oncologica-melanoma' AND t.tag_name = 'Dermatologia';
