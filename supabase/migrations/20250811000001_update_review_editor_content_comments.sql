-- Migration: Update review_editor_content table comments to reflect V2/V3 support
-- Author: Claude Code Assistant  
-- Date: 2025-08-11
-- Purpose: Update database documentation to reflect support for both V2 and V3 structured content

-- Update table comment to reflect V2/V3 support
COMMENT ON TABLE public.review_editor_content IS 'Stores structured content data (v2.0 and v3.0) for the Visual Composition Engine editor. Each review can have one editor content record containing the JSONB representation of the visual composition with backward compatibility support.';

-- Update column comment to reflect V2/V3 support  
COMMENT ON COLUMN public.review_editor_content.structured_content IS 'JSONB field containing the complete structured content data (v2.0 or v3.0) including nodes, layouts/positions, and metadata for the Visual Composition Engine. Supports automatic migration between formats.';